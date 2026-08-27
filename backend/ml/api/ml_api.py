import os
import sys
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Dynamically add scripts folder to PYTHONPATH to allow importing helper modules
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'scripts'))

try:
    from predict import generate_prediction
except ImportError as e:
    print(f"Error importing helper scripts in ml_api.py: {e}")

app = FastAPI(
    title="Paper Pulse ML API",
    description="Python prediction service using trained classification models.",
    version="1.0.0"
)

# Enable CORS for communication from Express.js or React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
datasets_dir = os.path.normpath(os.path.join(base_dir, '..', 'data', 'csv'))
models_dir = os.path.normpath(os.path.join(base_dir, 'models', 'trained'))

@app.get("/health")
def health_check():
    return {
        "success": True,
        "message": "Python ML API service is online and active.",
        "disclaimer": "Educational stock prediction model. Not financial advice."
    }

@app.get("/predict/{symbol}")
def predict_stock(symbol: str):
    sym = symbol.upper()
    try:
        prediction_result = generate_prediction(sym, datasets_dir, models_dir)
        return prediction_result
    except FileNotFoundError as fnf_err:
        raise HTTPException(status_code=404, detail=str(fnf_err))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.get("/model-info/{symbol}")
def get_model_info(symbol: str):
    sym = symbol.upper()
    metadata_path = os.path.join(models_dir, f"{sym}_metadata.json")
    
    if not os.path.exists(metadata_path):
        raise HTTPException(
            status_code=404, 
            detail=f"No trained model metadata found for stock '{sym}'. Train it first by running train.py."
        )
        
    try:
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
        return {
            "success": True,
            "data": metadata
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to read model metadata: {str(e)}")

if __name__ == '__main__':
    # Default port 8000
    uvicorn.run("ml_api:app", host="127.0.0.1", port=8000, reload=True)
