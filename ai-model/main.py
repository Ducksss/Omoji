# from huggingface_hub import InferenceClient
#
# client = InferenceClient("EvanZhouDev/open-genmoji")
#
# # output is a PIL.Image object
# image = client.text_to_image("Astronaut riding a horse")
# Use a pipeline as a high-level helper

from typing import Dict
import base64
import os
from io import BytesIO

import torch
from pydantic import BaseModel
from fastapi import FastAPI, HTTPException
from transformers import AutoModelForSequenceClassification, AutoTokenizer
from huggingface_hub import InferenceClient
from openai import OpenAI

# Initialize FastAPI app
app = FastAPI(
    title="Emoji Suggester and Image Analysis API",
    description="API for suggesting emojis and analyzing images",
    version="1.0.0",
)


# Pydantic models
class TextInput(BaseModel):
    text: str


class EmojiPrediction(BaseModel):
    text: str
    suggested_emoji: str


class ImageInput(BaseModel):
    image: str  # base64 encoded image
    prompt: str = "What's in this image?"  # Optional custom prompt


class ImageAnalysis(BaseModel):
    caption: str


class ImageToEmojiInput(BaseModel):
    image: str  # base64 encoded image


class ImageToEmojiOutput(BaseModel):
    emoji: str
    text: str  # image description


class GenmojiInput(BaseModel):
    image: str


class GenmojiOutput(BaseModel):
    image: str  # base64 encoded image


# Initialize clients and models
model = None
tokenizer = None
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
genmoji_client = InferenceClient("EvanZhouDev/open-genmoji")


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
        # print([i for i in model.config.id2label.values()])
    except Exception as e:
        raise RuntimeError(f"Failed to load model and tokenizer: {str(e)}")


@app.post("/predict", response_model=EmojiPrediction)
async def predict_emoji(input_data: TextInput) -> Dict:
    if not model or not tokenizer:
        raise HTTPException(status_code=500, detail="Model not loaded")

    try:
        inputs = tokenizer(input_data.text, return_tensors="pt")

        with torch.no_grad():
            outputs = model(**inputs)

        predicted_emoji = model.config.id2label[outputs.logits.argmax(dim=-1).item()]

        return {"text": input_data.text, "suggested_emoji": predicted_emoji}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@app.post("/image", response_model=ImageAnalysis)
async def analyze_image(input_data: ImageInput) -> Dict:
    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=500, detail="OpenAI API key not configured")

    try:
        # Validate base64 string
        try:
            image_data = base64.b64decode(input_data.image)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid base64 image data")

        # Call OpenAI Vision API
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": input_data.prompt},
                        {
                            "type": "image_url",
                            "image_url": {"url": f"{input_data.image}"},
                        },
                    ],
                }
            ],
            max_tokens=500,
        )

        return {"caption": response.choices[0].message.content}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image analysis error: {str(e)}")


@app.post("/image-to-emoji", response_model=ImageToEmojiOutput)
async def image_to_emoji(input_data: ImageToEmojiInput) -> Dict:
    if not os.getenv("OPENAI_API_KEY") or not model or not tokenizer:
        raise HTTPException(
            status_code=500, detail="API key not configured or models not loaded"
        )

    try:
        # First, get image description from Vision API
        vision_response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Describe the image like posting a new tweet",
                        },
                        {
                            "type": "image_url",
                            "image_url": {"url": f"{input_data.image}"},
                        },
                    ],
                }
            ],
            max_tokens=100,  # Shorter response for efficiency
        )

        image_description = vision_response.choices[0].message.content

        # Then, get emoji prediction for the description
        inputs = tokenizer(image_description, return_tensors="pt")

        with torch.no_grad():
            outputs = model(**inputs)

        predicted_emoji = model.config.id2label[outputs.logits.argmax(dim=-1).item()]

        return {"emoji": predicted_emoji, "text": image_description}

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Image to emoji conversion error: {str(e)}"
        )


@app.post("/generate-emoji", response_model=GenmojiOutput)
async def generate_emoji(input_data: GenmojiInput) -> Dict:
    try:
        # First, get image description from Vision API
        vision_response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Focus on the main subject from the image and describe how this will look like in an emoji",
                        },
                        {
                            "type": "image_url",
                            "image_url": {"url": f"{input_data.image}"},
                        },
                    ],
                }
            ],
            max_tokens=100,  # Shorter response for efficiency
        )

        image_description = vision_response.choices[0].message.content
        print(image_description)

        # Generate image using Genmoji
        pil_image = genmoji_client.text_to_image(image_description)

        # Convert PIL image to base64
        buffered = BytesIO()
        pil_image.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode()

        return {"image": img_str}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Emoji generation error: {str(e)}")


@app.get("/health")
async def health_check():
    if not model or not tokenizer:
        raise HTTPException(status_code=503, detail="Model not loaded")
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
