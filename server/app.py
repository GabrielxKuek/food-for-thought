from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import torch
import torch.nn as nn
from torchvision import models, transforms
import io
import logging
import os
from huggingface_hub import hf_hub_download

# ----------------------------
# Configuration
# ----------------------------
# MODEL_PATH = "./models/food-classification/models/food_classifier_best.pth"

MODEL_PATH = hf_hub_download(
    repo_id="GabrielxKuek/food-for-thought",
    filename="food_classifier_best.pth",
    local_dir="/tmp"
)

print("model downloaded here bro: " + MODEL_PATH)
print("MODEL EXISTS:", os.path.isfile(MODEL_PATH))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
logger.info(f"Using device: {device}")

# ----------------------------
# Hardcoded Stuff
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

# (the nutrition db query actually works ok, just so dunnid make api call all the time for the classifer foods)
FOOD_NUTRITION_DB = {
    'nasi_lemak': {
        "serving_size": 350,
        "energy": 680,
        "fat": {"base": 36.0, "saturated": 18.0, "polyunsaturated": 4.0, "monounsaturated": 12.0},
        "cholesterol": 85,
        "sodium": 820,
        "carbohydrates": {"base": 72.0, "fibre": 3.2, "sugar": 4.5},
        "protein": 18.5,
        "potassium": 320
    },
    'fried_rice': {
        "serving_size": 300,
        "energy": 550,
        "fat": {"base": 18.0, "saturated": 4.5, "polyunsaturated": 5.0, "monounsaturated": 7.0},
        "cholesterol": 65,
        "sodium": 950,
        "carbohydrates": {"base": 75.0, "fibre": 2.0, "sugar": 3.0},
        "protein": 15.0,
        "potassium": 280
    },
    'fried_noodles': {
        "serving_size": 280,
        "energy": 520,
        "fat": {"base": 20.0, "saturated": 5.0, "polyunsaturated": 4.5, "monounsaturated": 8.0},
        "cholesterol": 55,
        "sodium": 1100,
        "carbohydrates": {"base": 68.0, "fibre": 2.5, "sugar": 4.0},
        "protein": 14.0,
        "potassium": 250
    },
    'laksa': {
        "serving_size": 450,
        "energy": 750,
        "fat": {"base": 42.0, "saturated": 22.0, "polyunsaturated": 5.0, "monounsaturated": 12.0},
        "cholesterol": 95,
        "sodium": 1400,
        "carbohydrates": {"base": 70.0, "fibre": 3.0, "sugar": 5.0},
        "protein": 22.0,
        "potassium": 380
    },
    'roti_canai': {
        "serving_size": 120,
        "energy": 380,
        "fat": {"base": 18.0, "saturated": 8.0, "polyunsaturated": 2.0, "monounsaturated": 6.0},
        "cholesterol": 25,
        "sodium": 450,
        "carbohydrates": {"base": 48.0, "fibre": 1.5, "sugar": 2.0},
        "protein": 7.0,
        "potassium": 120
    },
    'satay': {
        "serving_size": 150,
        "energy": 320,
        "fat": {"base": 18.0, "saturated": 6.0, "polyunsaturated": 4.0, "monounsaturated": 7.0},
        "cholesterol": 70,
        "sodium": 680,
        "carbohydrates": {"base": 12.0, "fibre": 1.0, "sugar": 6.0},
        "protein": 28.0,
        "potassium": 350
    },
    'kaya_toast': {
        "serving_size": 100,
        "energy": 280,
        "fat": {"base": 12.0, "saturated": 7.0, "polyunsaturated": 1.0, "monounsaturated": 3.0},
        "cholesterol": 45,
        "sodium": 320,
        "carbohydrates": {"base": 38.0, "fibre": 1.0, "sugar": 18.0},
        "protein": 6.0,
        "potassium": 80
    },
    'mixed_rice': {
        "serving_size": 400,
        "energy": 650,
        "fat": {"base": 22.0, "saturated": 5.0, "polyunsaturated": 5.0, "monounsaturated": 10.0},
        "cholesterol": 60,
        "sodium": 900,
        "carbohydrates": {"base": 85.0, "fibre": 4.0, "sugar": 5.0},
        "protein": 25.0,
        "potassium": 450
    },
    'popiah': {
        "serving_size": 150,
        "energy": 220,
        "fat": {"base": 8.0, "saturated": 2.0, "polyunsaturated": 2.0, "monounsaturated": 3.0},
        "cholesterol": 30,
        "sodium": 520,
        "carbohydrates": {"base": 30.0, "fibre": 3.0, "sugar": 6.0},
        "protein": 8.0,
        "potassium": 280
    },
    'fish_and_chips': {
        "serving_size": 350,
        "energy": 820,
        "fat": {"base": 42.0, "saturated": 8.0, "polyunsaturated": 12.0, "monounsaturated": 18.0},
        "cholesterol": 75,
        "sodium": 780,
        "carbohydrates": {"base": 75.0, "fibre": 4.0, "sugar": 2.0},
        "protein": 32.0,
        "potassium": 650
    },
    'hamburger': {
        "serving_size": 220,
        "energy": 540,
        "fat": {"base": 28.0, "saturated": 10.0, "polyunsaturated": 3.0, "monounsaturated": 12.0},
        "cholesterol": 85,
        "sodium": 850,
        "carbohydrates": {"base": 40.0, "fibre": 2.0, "sugar": 8.0},
        "protein": 28.0,
        "potassium": 380
    }
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
# Import health routes
# ----------------------------
from routes.health import health_bp
app.register_blueprint(health_bp)

# ----------------------------
# endpoints
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
# Search Food Endpoint
# ----------------------------
@app.route("/search-food", methods=["GET"])
def search_food():
    """
    Search for food and return nutritional information from USDA FoodData Central API
    
    Query params:
        q: search query (e.g., "chicken rice", "apple")
        page: page number (default: 1)
        page_size: results per page (default: 10, max: 50)
    """
    import requests
    
    query = request.args.get('q', '')
    page = request.args.get('page', 1, type=int)
    page_size = request.args.get('page_size', 10, type=int)
    
    if not query:
        return jsonify({"status": "error", "error": "Missing query parameter 'q'"}), 400
    
    # Clamp page_size to reasonable limits
    page_size = max(1, min(page_size, 50))
    page = max(1, page)
    
    # USDA FoodData Central API
    api_key = "kHdwCCIysAXhjomJdAJLdONrf10HKQTOHMVmBTaQ"
    api_url = "https://api.nal.usda.gov/fdc/v1/foods/search"
    
    params = {
        "query": query,
        "api_key": api_key,
        "pageSize": page_size,
        "pageNumber": page
    }
    
    try:
        response = requests.get(api_url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
    except requests.RequestException as e:
        return jsonify({"status": "error", "error": f"Failed to fetch from USDA API: {str(e)}"}), 502
    
    # Transform results to a cleaner format
    results = []
    for food in data.get("foods", []):
        # Extract nutrients into a dictionary
        nutrients = {}
        for nutrient in food.get("foodNutrients", []):
            nutrient_name = nutrient.get("nutrientName", "").lower()
            value = nutrient.get("value", 0)
            unit = nutrient.get("unitName", "")
            
            # Map common nutrients
            if "energy" in nutrient_name:
                nutrients["energy"] = f"{value} {unit}"
            elif "protein" in nutrient_name:
                nutrients["protein"] = f"{value} {unit}"
            elif "total lipid" in nutrient_name or nutrient_name == "fat":
                nutrients["fat"] = f"{value} {unit}"
            elif "carbohydrate" in nutrient_name:
                nutrients["carbohydrates"] = f"{value} {unit}"
            elif "sodium" in nutrient_name:
                nutrients["sodium"] = f"{value} {unit}"
            elif "cholesterol" in nutrient_name:
                nutrients["cholesterol"] = f"{value} {unit}"
            elif "potassium" in nutrient_name:
                nutrients["potassium"] = f"{value} {unit}"
            elif "fiber" in nutrient_name:
                nutrients["fiber"] = f"{value} {unit}"
            elif "sugars" in nutrient_name and "added" not in nutrient_name:
                nutrients["sugars"] = f"{value} {unit}"
        
        results.append({
            "fdc_id": food.get("fdcId"),
            "name": food.get("description", "").title(),
            "brand": food.get("brandOwner", None),
            "category": food.get("foodCategory", None),
            "data_type": food.get("dataType", None),
            "nutritional_information": nutrients
        })
    
    total_hits = data.get("totalHits", 0)
    total_pages = (total_hits + page_size - 1) // page_size
    
    return jsonify({
        "status": "OK",
        "query": query,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total_results": total_hits,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_previous": page > 1
        },
        "count": len(results),
        "results": results
    })

# ----------------------------
# Classify with Nutrition Endpoint
# ----------------------------
@app.route("/classify-nutrition", methods=["POST"])
def classify_with_nutrition():
    """
    Classify food from image AND return nutritional information
    
    Expected: POST request with form-data containing 'image' field
    """
    
    if 'image' not in request.files:
        return jsonify({"status": "error", "error": "No image provided"}), 400
    
    file = request.files['image']
    
    if file.filename == '':
        return jsonify({"status": "error", "error": "No file selected"}), 400
    
    if not allowed_file(file.filename):
        return jsonify({"status": "error", "error": f"Invalid file type"}), 400
    
    try:
        image_bytes = file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        
        # Classify the image
        result = classify_image(image)
        food_name = result['predicted_class']
        
        # Get nutrition info
        nutrition = FOOD_NUTRITION_DB.get(food_name, None)
        
        if nutrition is None:
            return jsonify({
                "status": "OK",
                "food": food_name,
                "confidence": result['confidence'],
                "nutritional_information": None,
                "message": "Nutritional information not available for this food"
            })
        
        return jsonify({
            "status": "OK",
            "food": food_name,
            "confidence": result['confidence'],
            "nutritional_information": {
                "serving_size": nutrition["serving_size"],
                "energy": nutrition["energy"],
                "fat": nutrition["fat"],
                "cholesterol": nutrition["cholesterol"],
                "sodium": nutrition["sodium"],
                "carbohydrates": nutrition["carbohydrates"],
                "protein": nutrition["protein"],
                "potassium": nutrition["potassium"]
            }
        })
        
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return jsonify({"status": "error", "error": str(e)}), 500
    
# ----------------------------
# Goal Setting Endpoint
# ----------------------------
@app.route("/set-goals", methods=["POST"])
def set_goals():
    """
    Set user's nutritional goals based on biometric information
    
    Expected JSON body:
    {
        "age": 25,
        "gender": "male",  // "male" or "female"
        "weight": 70,      // kg
        "height": 175,     // cm
        "activity_level": "moderate",  // "sedentary", "light", "moderate", "active", "very_active"
        "goal": "lose",    // "lose", "maintain", "gain"
        "target_weight": 65  // kg (optional)
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"status": "error", "error": "No JSON data provided"}), 400
        
        # Required fields
        required = ["age", "gender", "weight", "height", "activity_level", "goal"]
        for field in required:
            if field not in data:
                return jsonify({"status": "error", "error": f"Missing field: {field}"}), 400
        
        age = data["age"]
        gender = data["gender"].lower()
        weight = data["weight"]
        height = data["height"]
        activity_level = data["activity_level"].lower()
        goal = data["goal"].lower()
        
        # Calculate BMR (Mifflin-St Jeor)
        if gender == "male":
            bmr = 10 * weight + 6.25 * height - 5 * age + 5
        else:
            bmr = 10 * weight + 6.25 * height - 5 * age - 161
        
        # Activity multipliers
        activity_multipliers = {
            "sedentary": 1.2,
            "light": 1.375,
            "moderate": 1.55,
            "active": 1.725,
            "very_active": 1.9
        }
        
        tdee = bmr * activity_multipliers.get(activity_level, 1.55)
        
        # Adjust based on goal
        weekly_progress = 0
        response_msg = ""
        
        if goal == "lose":
            calorie_target = tdee - 500  # 0.5kg/week deficit
            weekly_progress = -0.5
            response_msg = f"Based on your profile, your maintenance calories are {int(tdee)} kcal. To lose weight safely at 0.5kg/week, aim for {int(calorie_target)} kcal daily."
        elif goal == "gain":
            calorie_target = tdee + 400  # lean bulk
            weekly_progress = 0.3
            response_msg = f"Based on your profile, your maintenance calories are {int(tdee)} kcal. To gain lean mass at 0.3kg/week, aim for {int(calorie_target)} kcal daily."
        else:  # maintain
            calorie_target = tdee
            weekly_progress = 0
            response_msg = f"Based on your profile, your maintenance calories are {int(tdee)} kcal. Stick to this to maintain your current weight."
        
        # Calculate macros (40% carbs, 30% protein, 30% fat)
        protein = round(weight * 1.8)  # 1.8g per kg bodyweight
        fat = round((calorie_target * 0.25) / 9)  # 25% calories from fat
        carbs = round((calorie_target - (protein * 4) - (fat * 9)) / 4)
        
        # Sanity checks
        if calorie_target < 1200:
            response_msg = "Warning: Your calculated calorie target is very low. Consider consulting a healthcare professional. Setting minimum safe target of 1200 kcal."
            calorie_target = 1200
            carbs = 130
            protein = round(weight * 1.6)
            fat = 45
        
        return jsonify({
            "status": "OK",
            "response": response_msg,
            "daily_calories": int(calorie_target),
            "macro_goals": {
                "carbs": carbs,
                "protein": protein,
                "fat": fat
            },
            "weekly_progress": weekly_progress
        })
        
    except Exception as e:
        logger.error(f"Error in set_goals: {str(e)}")
        return jsonify({"status": "error", "error": str(e)}), 500


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
    print("  GET  /                  - API info")
    print("  GET  /test              - Health check")
    print("  POST /classify          - Classify food image")
    print("  POST /classify-nutrition - Classify + get nutrition info")
    print("  POST /set-goals         - Set user macro goals")
    print("  GET  /search-food?q=chicken%20rice&page=1&page_size=10 - Search food database")
    print("="*60)
    
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)