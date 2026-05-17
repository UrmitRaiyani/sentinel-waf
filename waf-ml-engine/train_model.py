import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import joblib

print("🧠 Loading processed dataset...")
# 1. Load the data we just created
df = pd.read_csv('processed_dataset.csv')

# 2. Split the data into "Features" (X) and "Answers/Labels" (y)
X = df[['length', 'special_chars', 'keywords']] # The clues
y = df['label']                                 # The answer (0 or 1)

# 3. Initialize the AI (Random Forest)
print("🌲 Planting the Random Forest...")
model = RandomForestClassifier(n_estimators=100, random_state=42)

# 4. TRAIN THE AI! (This is where the magic happens)
print("🏋️ Training the Machine Learning Model...")
model.fit(X, y)

# 5. Test the AI to see how smart it is
predictions = model.predict(X)
accuracy = accuracy_score(y, predictions)

print(f"\n🎯 Model Accuracy: {accuracy * 100}%")
print("📊 Classification Report:")
print(classification_report(y, predictions))

# 6. Save the trained "brain" to a file
joblib.dump(model, 'waf_rf_model.joblib')
print("\n💾 AI Model successfully saved as 'waf_rf_model.joblib'")