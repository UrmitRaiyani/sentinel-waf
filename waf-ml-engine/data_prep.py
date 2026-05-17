import pandas as pd
import numpy as np
import re

print("🚀 Starting Data Preprocessing Engine on Massive Dataset...")

# 1. Load the  CSV 
df = pd.read_csv('csic_simulated_dataset.csv')

# 2. The Feature Extraction Function
def extract_features(payload):
    payload = str(payload).lower() 
    
    length = len(payload)
    special_chars = len(re.findall(r'[<>\'\"%;()&+]', payload))
    keywords = len(re.findall(r'(select|union|insert|update|delete|drop|script|alert|exec|javascript)', payload))
    
    return pd.Series([length, special_chars, keywords])

# 3. Apply the function to the entire dataset
print(f"⚙️ Extracting numerical features from {len(df)} HTTP payloads...")
df[['length', 'special_chars', 'keywords']] = df['payload'].apply(extract_features)

# Save this processed data
df.to_csv('processed_dataset.csv', index=False)
print("💾 Saved processed data to 'processed_dataset.csv'")