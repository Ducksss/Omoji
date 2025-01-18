# from huggingface_hub import InferenceClient
#
# client = InferenceClient("EvanZhouDev/open-genmoji")
#
# # output is a PIL.Image object
# image = client.text_to_image("Astronaut riding a horse")
# Use a pipeline as a high-level helper

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from transformers import AutoModelForSequenceClassification, AutoTokenizer
import torch
from typing import Dict

# Initialize FastAPI app
app = FastAPI(
    title="Emoji Suggester API",
    description="API for suggesting emojis based on text input using KoalaAI/Emoji-Suggester model",
    version="1.0.0",
)


# Pydantic model for request
class TextInput(BaseModel):
    text: str


# Pydantic model for response
class EmojiPrediction(BaseModel):
    text: str
    suggested_emoji: str


# Load model and tokenizer on startup
model = None
tokenizer = None


@app.on_event("startup")
async def load_model():
    global model, tokenizer
    try:
        model = AutoModelForSequenceClassification.from_pretrained(
            "KoalaAI/Emoji-Suggester", use_auth_token=True
        )
        tokenizer = AutoTokenizer.from_pretrained(
            "KoalaAI/Emoji-Suggester", use_auth_token=True
        )
    except Exception as e:
        raise RuntimeError(f"Failed to load model and tokenizer: {str(e)}")


@app.post("/predict", response_model=EmojiPrediction)
async def predict_emoji(input_data: TextInput) -> Dict:
    if not model or not tokenizer:
        raise HTTPException(status_code=500, detail="Model not loaded")

    try:
        # Tokenize input text
        inputs = tokenizer(input_data.text, return_tensors="pt")

        # Make prediction
        with torch.no_grad():
            outputs = model(**inputs)

        # Get predicted emoji
        predicted_emoji = model.config.id2label[outputs.logits.argmax(dim=-1).item()]

        return {"text": input_data.text, "suggested_emoji": predicted_emoji}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@app.get("/health")
async def health_check():
    if not model or not tokenizer:
        raise HTTPException(status_code=503, detail="Model not loaded")
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
