from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import torch
import torch.nn as nn
from torchvision import models, transforms
import io
import logging
import os

# ----------------------------
# Configuration
# ----------------------------
MODEL_PATH = "./models/food-classification/models/food_classifier_best.pth"  # <-- Change this to your model path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
logger.info(f"Using device: {device}")

# ----------------------------
# Hardcoded Class Name Map
# ----------------------------
CLASS_NAME_MAP = {
    0: 'fish_and_chips',
    1: 'fried_noodles',
    2: 'fried_rice',
    3: 'hamburger',
    4: 'kaya_toast',
    5: 'laksa',
    6: 'mixed_rice',
    7: 'nasi_lemak',
    8: 'popiah',
    9: 'roti_canai',
    10: 'satay',
}

# ----------------------------
# Load Model
# ----------------------------
logger.info(f"Loading model from: {MODEL_PATH}")

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"Model not found at {MODEL_PATH}")

checkpoint = torch.load(MODEL_PATH, map_location=device)
FOOD_CLASSES = list(CLASS_NAME_MAP.values())  # Use hardcoded names
num_classes = len(FOOD_CLASSES)

model = models.resnet18(pretrained=False)
model.fc = nn.Linear(model.fc.in_features, num_classes)
model.load_state_dict(checkpoint['model_state_dict'])
model.to(device)
model.eval()

logger.info(f"✓ Model loaded successfully!")
logger.info(f"✓ Accuracy: {checkpoint['accuracy']:.2f}%")
logger.info(f"✓ Classes ({num_classes}): {FOOD_CLASSES}")

# ----------------------------
# Image Transform
# ----------------------------
transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

# ----------------------------
# Flask App
# ----------------------------
app = Flask(__name__)
CORS(app)

# Max file size: 16MB
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

# Allowed file types
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ----------------------------
# Helper Function
# ----------------------------
def classify_image(image):
    """
    Classify a PIL Image
    
    Args:
        image: PIL Image object
    
    Returns:
        dict with prediction results
    """
    # Preprocess
    img_tensor = transform(image).unsqueeze(0).to(device)
    
    # Predict
    with torch.no_grad():
        outputs = model(img_tensor)
        probs = torch.nn.functional.softmax(outputs, dim=1)
        
        # Get top 3 predictions
        top3_probs, top3_indices = torch.topk(probs, min(3, num_classes))
    
    # Format results using hardcoded class names
    predictions = []
    for i in range(len(top3_probs[0])):
        class_idx = top3_indices[0][i].item()
        class_name = CLASS_NAME_MAP.get(class_idx, f"unknown_{class_idx}")
        predictions.append({
            "class": class_name,
            "confidence": round(top3_probs[0][i].item(), 4)
        })
    
    return {
        "predicted_class": predictions[0]["class"],
        "confidence": predictions[0]["confidence"],
        "top_predictions": predictions
    }

# ----------------------------
# API Endpoints
# ----------------------------
@app.route("/", methods=["GET"])
def home():
    """API info"""
    return jsonify({
        "name": "Malaysian Food Classifier API",
        "version": "1.0",
        "endpoints": {
            "GET /": "API info",
            "GET /test": "Health check",
            "POST /classify": "Classify food image"
        }
    })

@app.route("/test", methods=["GET"])
def test():
    """Health check"""
    return jsonify({
        "status": "OK",
        "model_path": MODEL_PATH,
        "device": str(device),
        "accuracy": checkpoint['accuracy'],
        "num_classes": num_classes,
        "classes": FOOD_CLASSES
    })

@app.route("/classify", methods=["POST"])
def classify():
    """
    Classify food from uploaded image
    
    Expected: POST request with form-data containing 'image' field
    
    Returns: JSON with prediction results
    """
    
    # Step 1: Check if image field exists
    if 'image' not in request.files:
        return jsonify({
            "error": "No image provided",
            "hint": "Send POST request with form-data field named 'image'"
        }), 400
    
    # Step 2: Get the file
    file = request.files['image']
    
    # Step 3: Check if file was selected
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400
    
    # Step 4: Validate file type
    if not allowed_file(file.filename):
        return jsonify({
            "error": f"Invalid file type: {file.filename}",
            "allowed": list(ALLOWED_EXTENSIONS)
        }), 400
    
    try:
        # Step 5: Read file bytes
        image_bytes = file.read()
        
        # Step 6: Convert to PIL Image
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        
        logger.info(f"Processing image: {file.filename} (size: {image.size})")
        
        # Step 7: Classify
        result = classify_image(image)
        
        logger.info(f"Prediction: {result['predicted_class']} ({result['confidence']*100:.1f}%)")
        
        # Step 8: Return result
        return jsonify({
            "status": "success",
            "filename": file.filename,
            "image_size": image.size,
            "classification": result
        })
        
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        return jsonify({"error": str(e)}), 500

# ----------------------------
# Error Handlers
# ----------------------------
@app.errorhandler(413)
def file_too_large(e):
    return jsonify({"error": "File too large. Maximum size is 16MB."}), 413

@app.errorhandler(500)
def internal_error(e):
    return jsonify({"error": "Internal server error"}), 500

# ----------------------------
# Run Server
# ----------------------------
if __name__ == "__main__":
    print("="*60)
    print("Food Classifier API")
    print("="*60)
    print(f"Model: {MODEL_PATH}")
    print(f"Device: {device}")
    print(f"Classes: {FOOD_CLASSES}")
    print("="*60)
    print("Endpoints:")
    print("  GET  /        - API info")
    print("  GET  /test    - Health check")
    print("  POST /classify - Classify food image")
    print("="*60)
    
    app.run(host="0.0.0.0", port=8080, debug=True)