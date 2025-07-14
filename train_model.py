
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from joblib import dump

# Load data
df = pd.read_csv("/Users/tanusharma/Downloads/locker_slot_mock_training_data.csv")
X = df.drop(columns=["success"])
y = df["success"]

# Train/test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train model
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Save model
dump(model, "locker_slot_model.joblib")
print("Model trained and saved as locker_slot_model.joblib")
