

from fastapi import FastAPI

from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import joblib
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
model = joblib.load("model.pkl")
vectorizer = joblib.load("vectorizer.pkl")
class ResumeRequest(BaseModel):
    resume_text: str
@app.get("/")
def home():
    return {"message": "AI Resume Scanner Backend Running"}
@app.post("/predict")
def predict(data: ResumeRequest):

    resume_vector = vectorizer.transform([data.resume_text])

    prediction = model.predict(resume_vector)

    return {
        "predicted_category": prediction[0]
    }