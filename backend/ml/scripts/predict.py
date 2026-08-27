import os
import argparse
import json
import joblib
import pandas as pd
import numpy as np
from datetime import datetime

# Import custom modules
from preprocess import preprocess_data
from feature_engineering import engineer_features

# Feature names in exact order
FEATURE_COLS = [
    'daily_return', 'price_change', 'high_low_range', 'open_close_change',
    'SMA_5', 'price_vs_sma5', 'SMA_10', 'price_vs_sma10', 'SMA_20', 'price_vs_sma20',
    'EMA_5', 'EMA_10', 'EMA_20', 'RSI_14', 'MACD', 'MACD_signal', 'MACD_histogram',
    'volatility_5', 'volatility_10', 'volatility_20', 'volume_change',
    'volume_sma_5', 'volume_sma_10', 'volume_ratio',
    'close_lag_1', 'return_lag_1', 'close_lag_2', 'return_lag_2',
    'close_lag_3', 'return_lag_3', 'close_lag_5', 'return_lag_5'
]

# Configurable thresholds
BUY_THRESHOLD = float(os.getenv('BUY_THRESHOLD', '0.60'))
SELL_THRESHOLD = float(os.getenv('SELL_THRESHOLD', '0.60'))

def generate_prediction(symbol, datasets_dir, models_dir):
    """
    Loads model, processes latest data, performs inference, maps signal,
    applies trend confirmation, and returns a structured prediction report.
    """
    model_path = os.path.join(models_dir, f"{symbol}_model.joblib")
    scaler_path = os.path.join(models_dir, f"{symbol}_scaler.joblib")
    metadata_path = os.path.join(models_dir, f"{symbol}_metadata.json")

    if not os.path.exists(model_path) or not os.path.exists(metadata_path):
        raise FileNotFoundError(f"Trained model artifacts not found for symbol '{symbol}'. Train it first by running train.py.")

    # 1. Load model metadata & artifacts
    with open(metadata_path, 'r') as f:
        meta = json.load(f)
    
    model = joblib.load(model_path)
    scaler = joblib.load(scaler_path)

    # 2. Preprocess dataset & engineer features
    csv_path = os.path.join(datasets_dir, f"{symbol}.csv")
    df_clean = preprocess_data(csv_path, symbol)
    df_features = engineer_features(df_clean)

    # 3. Retrieve the latest available data row for prediction
    latest_row = df_features.iloc[-1]
    latest_date = latest_row['Date']
    latest_close = float(latest_row['Close'])
    latest_volume = int(latest_row['Volume'])
    
    # Validate that features are complete
    nan_features = [col for col in FEATURE_COLS if pd.isna(latest_row[col])]
    if nan_features:
        raise ValueError(f"Cannot generate prediction: latest data row contains missing feature values: {nan_features}")

    # Prepare feature vector
    X_latest = pd.DataFrame([latest_row[FEATURE_COLS]])

    # 4. Scale features if required
    if meta['needs_scaling']:
        X_latest_scaled = scaler.transform(X_latest)
        X_infer = X_latest_scaled
    else:
        X_infer = X_latest

    # 5. Run prediction
    pred_dir = int(model.predict(X_infer)[0])
    
    # Calculate probabilities
    if hasattr(model, 'predict_proba'):
        probs = model.predict_proba(X_infer)[0]
        prob_down = float(probs[0])
        prob_up = float(probs[1])
    else:
        # Fallback if model doesn't support predict_proba
        prob_up = 1.0 if pred_dir == 1 else 0.0
        prob_down = 1.0 - prob_up

    # 6. Signal Mapping Layer (configurable probability thresholds)
    raw_signal = 'HOLD'
    if prob_up >= BUY_THRESHOLD:
        raw_signal = 'BUY'
    elif prob_down >= SELL_THRESHOLD:
        raw_signal = 'SELL'

    # 7. Trend Confirmation (Disagreement Check)
    sma20 = float(latest_row['SMA_20'])
    trend_state = 'NEUTRAL'
    if latest_close > sma20:
        trend_state = 'POSITIVE'
    elif latest_close < sma20:
        trend_state = 'NEGATIVE'

    final_signal = raw_signal
    # Apply SMA20 trend filters to filter out weak signals
    if raw_signal == 'BUY' and latest_close <= sma20:
        final_signal = 'HOLD' # Overruled: ML says UP, but price is below SMA20 trend
    elif raw_signal == 'SELL' and latest_close >= sma20:
        final_signal = 'HOLD' # Overruled: ML says DOWN, but price is above SMA20 trend

    # 8. Dynamic reasons generation based on actual features
    reasons = []
    reasons.append(f"Model prediction probability for NEXT-DAY PRICE INCREASE is {prob_up * 100:.1f}%.")
    
    if trend_state == 'POSITIVE':
        reasons.append(f"Stock price (Rs. {latest_close:.2f}) is trading above its 20-day SMA (Rs. {sma20:.2f}), confirming a bullish trend.")
    else:
        reasons.append(f"Stock price (Rs. {latest_close:.2f}) is trading below its 20-day SMA (Rs. {sma20:.2f}), confirming a bearish trend.")
        
    if raw_signal != final_signal:
        reasons.append(f"Primary ML signal was {raw_signal}, but was overruled to HOLD due to trend confirmation checks (disagreement with 20-day SMA trend).")
        
    rsi = float(latest_row['RSI_14'])
    if rsi > 70:
        reasons.append(f"RSI indicator is at {rsi:.1f}, signaling overbought conditions.")
    elif rsi < 30:
        reasons.append(f"RSI indicator is at {rsi:.1f}, signaling oversold conditions.")
    else:
        reasons.append(f"RSI indicator is at a neutral level of {rsi:.1f}.")

    vol_ratio = float(latest_row['volume_ratio'])
    if vol_ratio > 1.5:
        reasons.append(f"Recent volume is unusually high ({vol_ratio:.1f}x the 10-day average), indicating strong market interest.")

    return {
        'success': True,
        'symbol': symbol,
        'prediction': 'UP' if pred_dir == 1 else 'DOWN',
        'signal': final_signal,
        'probability_up': round(prob_up, 4),
        'probability_down': round(prob_down, 4),
        'current_price': latest_close,
        'trend': trend_state,
        'model': meta['model_type'],
        'reasons': reasons,
        'generated_at': datetime.now().isoformat()
    }

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Predict next trading day price direction.")
    parser.add_argument('--symbol', type=str, default='TCS', help="Stock symbol to predict")
    args = parser.parse_args()
    
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    datasets_dir = os.path.normpath(os.path.join(base_dir, '..', 'data', 'csv'))
    models_dir = os.path.normpath(os.path.join(base_dir, 'models', 'trained'))
    
    symbol = args.symbol.upper()
    
    try:
        res = generate_prediction(symbol, datasets_dir, models_dir)
        print(f"\n====================================")
        print(f"{symbol} ML PREDICTION")
        print(f"====================================\n")
        print(f"Current Price:   Rs. {res['current_price']:.2f}")
        print(f"Prediction:      {res['prediction']}")
        print(f"Probability UP:  {res['probability_up']*100:.1f}%")
        print(f"Probability DN:  {res['probability_down']*100:.1f}%")
        print(f"Signal:          {res['signal']}")
        print(f"Model:           {res['model']}")
        print(f"Trend:           {res['trend']}")
        print("\nKey Factors:")
        for r in res['reasons']:
            print(f"- {r}")
        print("\n====================================")
    except Exception as e:
        print(f"Error: {e}")
