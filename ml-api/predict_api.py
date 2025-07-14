from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np

app = FastAPI()

model = joblib.load("locker_slot_model.joblib")

class InputData(BaseModel):
    customer_lat: float
    customer_lng: float
    locker_lat: float
    locker_lng: float
    distance_km: float
    available_compartments: int
    active_pickups: int
    total_compartments: int
    time_of_day: int

@app.post("/predict")
def predict_slot(data: InputData):
    X = np.array([[
        data.customer_lat,
        data.customer_lng,
        data.locker_lat,
        data.locker_lng,
        data.distance_km,
        data.available_compartments,
        data.active_pickups,
        data.total_compartments,
        data.time_of_day
    ]])
    slot = model.predict(X)[0]
    return {"assign_slot": int(slot)}
