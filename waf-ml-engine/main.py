from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import pandas as pd
import re

print("🚀 Booting up the WAF ML Microservice...")

# 1. Initialize the FastAPI Server
app = FastAPI(title="Hybrid WAF - ML Engine API")

# 2. Load the trained "Brain" into memory
try:
    model = joblib.load('waf_rf_model.joblib')
    print("🧠 AI Model loaded successfully!")
except Exception as e:
    print(f"❌ Error loading model: {e}")

# 3. Define the structure of the data Node.js will send us
class RequestData(BaseModel):
    payload: str

# 4. The exact same Feature Extractor from our training script
def extract_features(payload_string):
    payload_string = str(payload_string).lower()
    
    length = len(payload_string)
    special_chars = len(re.findall(r'[<>\'\"%;()&+]', payload_string))
    keywords = len(re.findall(r'(select|union|insert|update|delete|script|alert|drop)', payload_string))
    
    # Machine Learning expects a 2D table, even for one row, so we format it as a DataFrame
    return pd.DataFrame([[length, special_chars, keywords]], columns=['length', 'special_chars', 'keywords'])

# 5. Create the Endpoint that Node.js will hit
@app.post("/analyze")
async def analyze_traffic(data: RequestData):
    # Step A: Convert the raw text into numbers
    features = extract_features(data.payload)
    
    # Step B: Ask the AI to make a prediction
    prediction = model.predict(features)[0] # Returns 0 (Normal) or 1 (Hacker)
    
    # Step C: Send the answer back
    if prediction == 1:
        return {"status": "anomaly", "message": "Zero-Day Threat Detected!", "confidence": "High"}
    else:
        return {"status": "clean", "message": "Traffic looks safe."}