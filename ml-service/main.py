import logging
import os
import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("ml-service")

app = FastAPI(title="Fraud Detection ML API")

# Load model and encoders at startup
model = None
le_payment = None
le_type = None

@app.on_event("startup")
def load_model():
    global model, le_payment, le_type
    model_path = "fraud_model.pkl"
    try:
        model = joblib.load(model_path)
        le_payment = joblib.load("le_payment.pkl")
        le_type = joblib.load("le_type.pkl")
        logger.info("Model and encoders loaded successfully.")
    except Exception as e:
        logger.warning(f"Could not load model assets: {e}. Please run train.py first.")

class TransactionInput(BaseModel):
    amount: float
    type: str
    paymentMethod: str = "CARD"  # Default if not provided
    # Add other fields if needed, but the model only uses these 3 currently

class PredictionOutput(BaseModel):
    isFraud: bool
    score: int
    modelVersion: str

@app.post("/predict", response_model=PredictionOutput)
async def predict_fraud(transaction: TransactionInput):
    logger.info(f"Received prediction request: amount={transaction.amount}, type={transaction.type}, paymentMethod={transaction.paymentMethod}")
    
    if model is None:
        logger.error("Model not loaded - cannot process prediction.")
        raise HTTPException(status_code=503, detail="Model not loaded. Train the model first.")
        
    try:
        # Preprocess logic matches training
        # Encode inputs safely
        try:
            pay_m_enc = le_payment.transform([transaction.paymentMethod])[0]
        except ValueError:
            logger.info(f"Payment method '{transaction.paymentMethod}' not found in encoder. Using fallback.")
            pay_m_enc = 0 # Default fallback
            
        try:
            type_enc = le_type.transform([transaction.type])[0]
        except ValueError:
            logger.info(f"Transaction type '{transaction.type}' not found in encoder. Using fallback.")
            type_enc = 0
            
        # Create feature array matching training shape [amount, payMethod, type]
        features = np.array([[transaction.amount, pay_m_enc, type_enc]])
        
        # Predict probability
        prob = model.predict_proba(features)[0][1] # Probability of class 1 (fraud)
        
        # Convert to 0-100 score
        score = int(prob * 100)
        
        # Threshold at 50%
        is_fraud = bool(prob >= 0.5)
        
        logger.info(f"Prediction complete. isFraud={is_fraud}, score={score}")
        
        return PredictionOutput(
            isFraud=is_fraud,
            score=score,
            modelVersion="v1.0-rf"
        )
        
    except Exception as e:
        logger.exception(f"Error during prediction processing: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "ok", "model_loaded": model is not None}
