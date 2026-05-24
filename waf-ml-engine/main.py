from urllib import request

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
    # We remove quotes that immediately surround keys or values
    clean_payload = re.sub(r'[{}\":, \n]', '', payload_string)
    length = len(payload_string)
    special_chars = len(re.findall(r'[<>\'%;()&+]', clean_payload))
    keywords = len(re.findall(r'(select|union|insert|update|delete|script|alert|drop)', clean_payload))

    # Return the raw numbers instead of the dataframe immediately
    return length, special_chars, keywords

# 5. Create the Endpoint that Node.js will hit
@app.post("/analyze")
async def analyze_traffic(data: RequestData):
    payload_string = data.payload
    
    # Get our extracted numbers
    length, special_chars, keywords = extract_features(payload_string)
    
    # THE DEFENSE GUARDRAIL
    # If the payload has no hacker characters and no bad words, it is safe.
    # This prevents the AI from flagging benign logins just because they are long.
    if special_chars == 0 and keywords == 0:
        prediction = 0
    else:
        # If it DOES have special characters, ask the AI model to evaluate it
        features = pd.DataFrame([[length, special_chars, keywords]], columns=['length', 'special_chars', 'keywords'])
        prediction = model.predict(features)[0] 
        
    if prediction == 1:
        return {"status": "anomaly", "message": "Zero-Day Threat Detected!", "confidence": "High"}
    else:
        return {"status": "clean", "message": "Traffic looks safe."}