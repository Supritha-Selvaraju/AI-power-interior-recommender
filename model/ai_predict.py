from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from tensorflow.keras.models import load_model
from PIL import Image
import numpy as np
import io

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins; adjust for production
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Load your AI model
model = load_model('model/ai_model.keras')

# Preprocess the image (resize, normalize, etc.)
def preprocess_image(image: Image.Image):
    image = image.resize((224, 224))  # Resize image if required
    image = np.array(image) / 255.0   # Normalize the image (0-1 range)
    image = np.expand_dims(image, axis=0)  # Add batch dimension
    return image

@app.post("/predict")
async def predict_image(file: UploadFile = File(...)):
    try:
        # Read the uploaded image file
        image_data = await file.read()
        image = Image.open(io.BytesIO(image_data))

        # Preprocess the image for the AI model
        processed_image = preprocess_image(image)

        # Make a prediction
        prediction = model.predict(processed_image)
        
        # Log the raw prediction output for debugging
        print("Raw prediction output:", prediction)

        # Use argmax to find the predicted style
        predicted_class = np.argmax(prediction, axis=1)[0]
        class_names = ['aesthetic', 'modern', 'neutral', 'vintage']
        predicted_style = class_names[predicted_class]

        return {"predicted_style": predicted_style}
    
    except Exception as e:
        print("Error during prediction:", str(e))  # Log the error
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
