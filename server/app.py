from flask import Flask, request, jsonify
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
import requests
from dotenv import load_dotenv
import os
from flask_cors import CORS
from handle_rag import ArbitrationRAGChroma
import logging

# ----------------------------
# load fine tuned model
# ----------------------------
MODEL_PATH = "C:/Users/Gabriel Kuek/Desktop/Side Stuff/food-for-thought/model/"
tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
model = AutoModelForCausalLM.from_pretrained(
    MODEL_PATH,
    device_map="auto",
    dtype="auto",
    offload_folder="offload",
    low_cpu_mem_usage=True
)
model.eval()

# ----------------------------
# config
# ----------------------------
load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ----------------------------
# flask
# ----------------------------
app = Flask(__name__)
CORS(app)

# ----------------------------
# endpoints
# ----------------------------
@app.route("/test", methods=["GET"])
def test_endpoint():
    data = request.get_json()
    return jsonify({
        "status": "OK",
        "response": "api is running"
        })

# ----------------------------
# Run server
# ----------------------------
if __name__ == "__main__":
    logger.info("Starting Flask app...")

    app.run(host="0.0.0.0", port=8080, debug=True)