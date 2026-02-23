# Fraud Detection ML Service

This service provides a machine learning API for predicting potential fraud in financial transactions. It is built using Python, FastAPI, and Scikit-Learn.

## Table of Contents
- [Setup & Installation](#setup--installation)
- [Running the Service](#running-the-service)
- [API Endpoints](#api-endpoints)
- [Integration Guide](#integration-guide)
- [Project Structure](#project-structure)

## Setup & Installation

### Prerequisites
- Python 3.8+
- `pip` (Python package manager)

### Installation
1. Navigate to the `ml-service` directory:
   ```bash
   cd ml-service
   ```
2. Create and activate a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Running the Service

### Start the API Server
Run the following command to start the FastAPI server with auto-reload:
```bash
uvicorn main:app --reload --port 8000
```
The API will be available at `http://localhost:8000`.

### Re-training the Model (Optional)
To train the model from scratch (if datasets are available or if you want to update the pickled models):
```bash
python train.py
```

## API Endpoints

### 1. Predict Fraud
- **Endpoint**: `/predict`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "amount": 100.50,
    "type": "TRANSFER",
    "paymentMethod": "CARD"
  }
  ```
- **Response**:
  ```json
  {
    "isFraud": false,
    "score": 15,
    "modelVersion": "v1.0-rf"
  }
  ```

### 2. Health Check
- **Endpoint**: `/health`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "status": "ok",
    "model_loaded": true
  }
  ```

## Integration Guide

### Backend Integration
The main Node.js backend interacts with this service using the `ML_SERVICE_URL` environment variable.

1. **Environment Variable**: Ensure `.env` in the root directory contains:
   ```env
   ML_SERVICE_URL=http://localhost:8000
   ```
2. **Service Method**: The integration logic is located in `services/ml.service.js`.
3. **Flow**:
   - The backend sends transaction data (`amount`, `type`, `paymentMethod`) to the `/predict` endpoint.
   - The ML service processes the input, encodes categorical data, and returns a fraud score.
   - The backend then updates the transaction record based on the `isFraud` status.

### Error Handling & Fallbacks
- The ML service encodes categorical inputs safely. If an unknown category is received, it defaults to a fallback value (0) and logs the event.
- If the ML service is unreachable, the Node.js backend handles the error and returns a default safe response (`isFraud: false`).

## Project Structure
- `main.py`: Entry point for the FastAPI application.
- `train.py`: Script used for model training and preprocessing.
- `requirements.txt`: Python package dependencies.
- `*.pkl`: Serialized model and label encoders.
- `README.md`: Documentation (this file).
