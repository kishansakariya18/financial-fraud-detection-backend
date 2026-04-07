# Fraud detection ML flow

This document describes how machine learning is wired into the fraud-detection backend: what runs where, what the model actually does, and how data moves through the system.

---

## High-level architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────────┐
│  Node.js API    │     │  RabbitMQ        │     │  Python ML service      │
│  (Express)      │────▶│  queue:          │────▶│  FastAPI + scikit-learn │
│                 │     │  `fraud_tasks`   │     │  `/predict`             │
└─────────────────┘     └──────────────────┘     └─────────────────────────┘
        │                        │                         │
        │                        │                         │
        ▼                        ▼                         ▼
   MongoDB:                 (async work)            `fraud_model.pkl`
   Transaction saved        Consumer calls          + label encoders
   then enqueued            ML + DB updates
```

1. A **transaction** is created and stored in MongoDB (`fraudStatus` starts as `PENDING`).
2. The same document is **published** to the **`fraud_tasks`** queue (RabbitMQ).
3. A **worker** (started with the API in `index.js`) **consumes** messages and runs the fraud check.
4. The worker calls the **Python ML service** over HTTP (`POST /predict`).
5. Results are written back: **transaction** (`fraudStatus`, `fraudScore`) and a **fraud log** row.

If the queue is unavailable, the code **falls back** to running the fraud check **inline** (same `consumeFraudCheck` path) so a single transaction still gets scored.

---

## End-to-end sequence

| Step | Location | What happens |
|------|----------|----------------|
| 1 | `services/transaction.service.js` | After validation, `Transaction.create(...)` persists the transaction. |
| 2 | `queues/fraud.queue.js` → `addToFraudQueue` | Serializes the transaction document to JSON and sends it to RabbitMQ queue `fraud_tasks`. On publish failure, calls `consumeFraudCheck(transaction)` directly. |
| 3 | `queues/fraud.queue.js` → `processFraudQueue` | Subscribes to `fraud_tasks`, `prefetch(1)`, parses JSON, calls `consumeFraudCheck`. |
| 4 | `consumeFraudCheck` | Calls `services/ml.service.js` → `checkFraud(transaction)`. |
| 5 | `services/ml.service.js` | `POST {ML_SERVICE_URL}/predict` with body: `amount`, `type`, `paymentMethod` (defaults to `"CARD"` if missing). |
| 6 | On success | `fraud.repository.createFraudLog(...)` and `transaction.repository.updateFraudStatus(id, fraudStatus, fraudScore)`. |
| 7 | On ML HTTP error | Node returns `{ score: 0, isFraud: false, modelVersion: "fallback-error" }` so the pipeline still completes without blocking on ML downtime. |

**Environment:** `ML_SERVICE_URL` (default `http://localhost:8000`) must point at the Python service when you want real scores.

---

## What the ML algorithm is

The production inference code lives in **`ml-service/main.py`**.

### Model type

- **Algorithm:** **Random Forest** classifier (`sklearn.ensemble.RandomForestClassifier`).
- **Training script:** **`ml-service/train.py`** (run manually: `python train.py`).
- **Artifacts:** After training, these files are loaded at FastAPI startup:
  - `fraud_model.pkl` — fitted `RandomForestClassifier` (`n_estimators=100`, `random_state=42` in training script).
  - `le_payment.pkl` — `LabelEncoder` for `paymentMethod`.
  - `le_type.pkl` — `LabelEncoder` for transaction `type`.

If the `.pkl` files are missing, `/predict` returns **503** (“Model not loaded”).

### Features used at prediction time

The model sees **three numeric inputs** (same layout as training):

| Feature | Source | Notes |
|---------|--------|--------|
| `amount` | Request body | Raw float. |
| Payment method (encoded) | `paymentMethod` | Encoded with `le_payment`; unknown values → **fallback `0`**. |
| Transaction type (encoded) | `type` | Encoded with `le_type`; unknown values → **fallback `0`**. |

**Important:** The Node API sends **`type`** as **`INCOME`** or **`EXPENSE`** (transaction model). The README example mentioning `"TRANSFER"` is illustrative only; the live integration matches your DB enums.

**Not currently sent to the model:** `categoryId`, user id, location, description, or time-of-day. Those could be added in a future model version by extending `train.py`, `main.py`, and `ml.service.js` together.

### How a score and label are produced

In `main.py`:

1. Build feature row: `[amount, pay_m_enc, type_enc]`.
2. Call `model.predict_proba(features)[0][1]` — probability of the **positive class** (fraud = class `1`).
3. **`score`** = `int(prob * 100)` (0–100).
4. **`isFraud`** = `prob >= 0.5` (50% threshold).
5. **`modelVersion`** is returned as **`"v1.0-rf"`** (fixed string in code).

So the “ML algorithm” here is: **supervised binary classification** with a **probability → integer score** mapping and a **fixed 0.5 decision threshold**.

---

## Training data (how the forest was fit)

`train.py` does **not** read your MongoDB. It:

1. Builds a **synthetic dataset** (`create_mock_data`, default 5000 rows).
2. Draws **amounts** from an exponential distribution, random **payment methods** and **types** (`INCOME` / `EXPENSE` derived from mock “category” names).
3. Assigns **`is_fraud`** with **hand-crafted rules** (e.g. large amounts more likely fraud; certain wallet + amount combinations skewed).

That means the deployed model is **only as realistic as this mock process**. For production, you would replace or augment this with **real labeled transactions** (and retrain, version, and validate).

---

## How results are stored in MongoDB

### Transaction document

Updated by `transaction.repository.updateFraudStatus`:

- **`fraudScore`** — numeric (from ML `score`, 0–100; or `0` on fallback error path).
- **`fraudStatus`** — set to **`FLAGGED`** if `isFraud` is true, else **`SAFE`** (when ML succeeds). Initial state before processing is **`PENDING`**.

### Fraud log document

Created by `fraud.repository.createFraudLog` with fields including:

- `transactionId`, `userId`
- `fraudScore`, `modelVersion`
- `detectedBy: "ML"`
- `status` — **`FLAGGED`** or **`SAFE`** depending on `isFraud` (see `queues/fraud.queue.js`)

---

## Failure and fallback behavior

| Scenario | Behavior |
|----------|-----------|
| RabbitMQ down / publish fails | Fraud check runs **synchronously** via `consumeFraudCheck` (no queue). |
| ML service unreachable / HTTP error | `checkFraud` returns `score: 0`, `isFraud: false`, `modelVersion: "fallback-error"`; transaction still updated and log still created with that outcome. |
| ML service up but model files missing | `/predict` returns 503; Node treats as error → same **fallback** as above. |
| Unknown `paymentMethod` / `type` in Python | Label encoders use **0** after `ValueError`; prediction still runs. |

---

## Files reference

| Piece | Path |
|-------|------|
| Queue + consumer | `queues/fraud.queue.js` |
| HTTP client to ML | `services/ml.service.js` |
| Transaction creation → enqueue | `services/transaction.service.js` |
| ML API | `ml-service/main.py` |
| Training | `ml-service/train.py` |
| RabbitMQ helper | `utils/rabbitmq.js` |

---

## Operational checklist

- Start **RabbitMQ** and ensure the app connects (`connectRabbitMQ` in `index.js`).
- Start **Python ML service**: e.g. `uvicorn main:app --reload --port 8000` from `ml-service/` after `train.py` has produced the `.pkl` files.
- Set **`ML_SERVICE_URL`** in `.env` to match the Python service URL.

This gives you a single place to reason about **what the ML layer does today** (Random Forest on amount + encoded payment method + encoded type) and **how it is triggered** (async queue → HTTP predict → DB updates).
