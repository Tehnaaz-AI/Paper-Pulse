# Paper Pulse - Machine Learning & Prediction Module

This module implements a Machine Learning classification pipeline in Python to predict the next-day price direction of stock prices based on historical technical indicators.

---

## 🎯 Prediction Target
- **Target (`NEXT_DAY_DIRECTION`):**
  - `1`: Next trading day's close price is higher than today's close price (UP).
  - `0`: Next trading day's close price is lower than or equal to today's close price (DOWN/FLAT).
  
> ⚠️ **No Data Leakage:** The target is generated using the shifted future close price, but this future price is strictly excluded from the feature set. All technical features utilize only information available up to the current trading day.

---

## 📊 Engineered Features (32 Indicators)
- **Price-Based Features:** Daily returns, price change, high-low range, and open-close change.
- **Simple Moving Averages (SMA):** SMA (5, 10, 20) and the percentage ratio of current close price to SMAs.
- **Exponential Moving Averages (EMA):** EMA (5, 10, 20).
- **Lags (Autoregressive):** Close price and daily returns lagged by 1, 2, 3, and 5 trading days.
- **Momentum Indicators:** RSI (14-day Wilder's smoothed method) and MACD (MACD line, signal line, histogram).
- **Volatility:** Rolling 5, 10, and 20-day standard deviation of returns.
- **Volume Features:** Volume change, SMA volume (5, 10), and the ratio of current volume to 10-day SMA volume.

---

## 🤖 Models Compared & Evaluated
The training pipeline automatically compares three classical ML classifiers:
1.  **Random Forest Classifier** (`class_weight='balanced'`)
2.  **Gradient Boosting Classifier**
3.  **Logistic Regression** (fitted with standard feature scaling)

Hyperparameter combinations are evaluated on a **chronologically separated Validation Set (15%)** after training on the **Training Set (70%)**. The best performing configuration (maximizing validation F1 Score) is saved as the final model, and is evaluated once on the **unseen Test Set (15%)**.

---

## ⚙️ How to Setup & Run

### 1. Prerequisites & Installation
Ensure Python 3.12+ is installed, create the virtual environment, and install dependencies:
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv ml/.venv

# Activate virtual environment
# On Windows (PowerShell):
.\ml\.venv\Scripts\Activate.ps1
# On Unix/macOS:
source ml/.venv/bin/activate

# Install requirements
pip install -r ml/requirements.txt
```

### 2. Seeding Data
Seed the cleaned datasets from the `backend/datasets/` folder into MongoDB:
```bash
npm run seed
```

### 3. Model Training
Train a model for a specific symbol or for ALL available symbols:
```bash
# Train a model for TCS
python ml/scripts/train.py --symbol TCS

# Train models for all datasets in the datasets folder (TCS, HDFC, INFOSYS, etc.)
python ml/scripts/train.py --symbol ALL
```
*Trained models, scalers, and JSON metadata are serialized into `backend/ml/models/trained/`.*

### 4. Model Evaluation
Print a detailed report of the model's structure, dataset splitting, testing set metrics, and key feature importances:
```bash
python ml/scripts/evaluate.py --symbol TCS
```

### 5. Prediction Inference Command
Get the next-day price direction prediction, probability, and trading signals directly on the CLI:
```bash
python ml/scripts/predict.py --symbol TCS
```

### 6. Signal Backtesting Simulator
Simulate trade execution over the historical test period (using capital ₹100,000) to measure win rate, drawdowns, and compare against a standard Buy & Hold benchmark:
```bash
python ml/scripts/backtest.py --symbol TCS
```

### 7. Run the Python FastAPI Prediction Server
Start the uvicorn prediction service:
```bash
# Runs the API on http://127.0.0.1:8000
python ml/api/ml_api.py
```

---

## 📡 Python FastAPI Endpoint Specifications

All endpoints return a consistent JSON response:

### 1. Health Status (`GET /health`)
- **Response:**
  ```json
  {
    "success": true,
    "message": "Python ML API service is online and active.",
    "disclaimer": "Educational stock prediction model. Not financial advice."
  }
  ```

### 2. Generate Prediction (`GET /predict/{symbol}`)
- **Response:**
  ```json
  {
    "success": true,
    "symbol": "TCS",
    "prediction": "UP",
    "signal": "BUY",
    "probability_up": 0.6842,
    "probability_down": 0.3158,
    "current_price": 2270.0,
    "trend": "POSITIVE",
    "model": "RandomForestClassifier",
    "reasons": [
      "Model prediction probability for NEXT-DAY PRICE INCREASE is 68.4%.",
      "Stock price (₹2270.00) is trading above its 20-day SMA (₹2245.50), confirming a bullish trend.",
      "RSI indicator is at a neutral level of 54.3."
    ],
    "generated_at": "2026-08-27T10:30:00"
  }
  ```

### 3. Model Details (`GET /model-info/{symbol}`)
- **Response:** Returns training details, validation sample sizes, testing set accuracy metrics, and exact feature importance coefficients.

---

## ⚠️ Educational Disclaimer
This software is built purely for **educational and simulation purposes**. Machine Learning models trained on historical stock prices predict statistical associations, not guarantees. Stock market trading carries significant financial risk. No real money is involved.
