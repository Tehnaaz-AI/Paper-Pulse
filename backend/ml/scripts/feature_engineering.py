import pandas as pd
import numpy as np

def calculate_rsi(series, period=14):
    """
    Calculates standard RSI indicator using Wilder's smoothed method.
    """
    delta = series.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    
    avg_gain = gain.ewm(com=period - 1, adjust=False).mean()
    avg_loss = loss.ewm(com=period - 1, adjust=False).mean()
    
    # Handle division by zero
    rs = avg_gain / avg_loss.replace(0, np.nan)
    rsi = 100 - (100 / (1 + rs))
    return rsi.fillna(50) # Default to 50 for NaN/zero loss cases

def calculate_macd(series, fast=12, slow=26, signal=9):
    """
    Calculates MACD line, signal line, and MACD histogram.
    """
    ema_fast = series.ewm(span=fast, adjust=False).mean()
    ema_slow = series.ewm(span=slow, adjust=False).mean()
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal, adjust=False).mean()
    macd_hist = macd_line - signal_line
    return macd_line, signal_line, macd_hist

def engineer_features(df):
    """
    Calculates all technical indicators and lag features from OHLCV data.
    Ensures no look-ahead bias is introduced (all calculations use past or current data).
    """
    # Create a copy to avoid SettingWithCopy warnings
    data = df.copy()
    
    # 1. Price-based features
    data['daily_return'] = data['Close'].pct_change()
    data['price_change'] = data['Close'].diff()
    data['high_low_range'] = (data['High'] - data['Low']) / data['Close']
    data['open_close_change'] = (data['Close'] - data['Open']) / data['Open']
    
    # 2. Moving Averages (SMA)
    for w in [5, 10, 20]:
        data[f'SMA_{w}'] = data['Close'].rolling(window=w).mean()
        data[f'price_vs_sma{w}'] = (data['Close'] - data[f'SMA_{w}']) / data[f'SMA_{w}']
        
    # 3. Exponential Moving Averages (EMA)
    for w in [5, 10, 20]:
        data[f'EMA_{w}'] = data['Close'].ewm(span=w, adjust=False).mean()
        
    # 4. Momentum (RSI & MACD)
    data['RSI_14'] = calculate_rsi(data['Close'], period=14)
    macd_line, signal_line, macd_hist = calculate_macd(data['Close'])
    data['MACD'] = macd_line
    data['MACD_signal'] = signal_line
    data['MACD_histogram'] = macd_hist
    
    # 5. Volatility (Std Dev of Returns)
    for w in [5, 10, 20]:
        data[f'volatility_{w}'] = data['daily_return'].rolling(window=w).std()
        
    # 6. Volume-based features
    data['volume_change'] = data['Volume'].pct_change()
    data['volume_sma_5'] = data['Volume'].rolling(window=5).mean()
    data['volume_sma_10'] = data['Volume'].rolling(window=10).mean()
    data['volume_ratio'] = data['Volume'] / data['volume_sma_10']
    
    # 7. Lag features (1, 2, 3, 5 days)
    for lag in [1, 2, 3, 5]:
        data[f'close_lag_{lag}'] = data['Close'].shift(lag)
        data[f'return_lag_{lag}'] = data['daily_return'].shift(lag)
        
    return data

def add_target_and_clean(df):
    """
    Computes NEXT_DAY_DIRECTION target and cleans up NaN rows resulting from shifts/rollings.
    """
    data = df.copy()
    
    # Shift(-1) retrieves next day's Close
    future_close = data['Close'].shift(-1)
    data['Target'] = (future_close > data['Close']).astype(int)
    
    # Drop the final row because it doesn't have a future target
    data = data.iloc[:-1].reset_index(drop=True)
    
    # Drop rows with NaN values resulting from rolling window lookbacks (max window is 20)
    initial_len = len(data)
    data = data.dropna().reset_index(drop=True)
    dropped_count = initial_len - len(data)
    if dropped_count > 0:
        print(f"[Info] Dropped {dropped_count} rows containing NaN features at the beginning of the series.")
        
    return data

if __name__ == '__main__':
    # Simple CLI test
    from preprocess import preprocess_data
    import os
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    file_path = os.path.join(base_dir, 'datasets', 'TCS.csv')
    try:
        df_clean = preprocess_data(file_path, 'TCS')
        df_features = engineer_features(df_clean)
        df_final = add_target_and_clean(df_features)
        print(f"Final training-ready columns: {list(df_final.columns)}")
        print(f"Total rows ready for training: {len(df_final)}")
        print("Class distribution:\n", df_final['Target'].value_counts())
    except Exception as e:
        print(f"Error: {e}")
