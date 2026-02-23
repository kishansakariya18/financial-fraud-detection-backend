import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import joblib

def create_mock_data(n_samples=1000):
    np.random.seed(42)
    
    # Categories and Payment Methods based on existing enums
    categories = ['food_beverage', 'transportation', 'shopping', 'entertainment', 
                  'health_wellness', 'salary', 'investment', 'rent_utilities', 'others']
    payment_methods = ['UPI', 'CARD', 'CASH', 'NET_BANKING', 'WALLET']
    types = ['INCOME', 'EXPENSE']
    
    data = []
    
    for _ in range(n_samples):
        amount = np.random.exponential(scale=5000)
        pay_method = np.random.choice(payment_methods)
        cat = np.random.choice(categories)
        tx_type = 'EXPENSE' if cat not in ['salary', 'investment'] else 'INCOME'
        
        # Simple fraud logic for the training set
        # High amounts, specific payment methods usually flag more fraud in this mock
        is_fraud = 0
        
        if amount > 50000:
            is_fraud = np.random.choice([0, 1], p=[0.2, 0.8])
        elif pay_method == 'WALLET' and amount > 10000:
            is_fraud = np.random.choice([0, 1], p=[0.4, 0.6])
        else:
            is_fraud = np.random.choice([0, 1], p=[0.95, 0.05])
            
        data.append({
            'amount': amount,
            'paymentMethod': pay_method,
            'type': tx_type,
            'is_fraud': is_fraud
        })
        
    return pd.DataFrame(data)

def train_model():
    print("Generating mock dataset...")
    df = create_mock_data(5000)
    
    print("Preprocessing data...")
    # Encode categorical features
    le_payment = LabelEncoder()
    le_type = LabelEncoder()
    
    df['paymentMethod_enc'] = le_payment.fit_transform(df['paymentMethod'])
    df['type_enc'] = le_type.fit_transform(df['type'])
    
    X = df[['amount', 'paymentMethod_enc', 'type_enc']]
    y = df['is_fraud']
    
    print("Training Random Forest...")
    rf = RandomForestClassifier(n_estimators=100, random_state=42)
    rf.fit(X, y)
    
    print("Saving model and encoders...")
    joblib.dump(rf, 'fraud_model.pkl')
    joblib.dump(le_payment, 'le_payment.pkl')
    joblib.dump(le_type, 'le_type.pkl')
    print("Done! Model saved to fraud_model.pkl")

if __name__ == "__main__":
    train_model()
