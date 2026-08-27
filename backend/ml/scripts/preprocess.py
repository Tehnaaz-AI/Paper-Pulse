import os
import pandas as pd
import numpy as np

def preprocess_data(file_path, symbol):
    """
    Loads, cleans, and validates historical stock data from a CSV file.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Dataset file not found at {file_path}")
        
    print(f"Loading dataset for {symbol} from {file_path}...")
    df = pd.read_csv(file_path)
    
    # 1. Normalize column names (strip whitespace and title case)
    df.columns = [col.strip().title() for col in df.columns]
    
    # Ensure all required columns exist
    required_cols = ['Date', 'Open', 'High', 'Low', 'Close', 'Volume']
    missing_cols = [col for col in required_cols if col not in df.columns]
    if missing_cols:
        raise ValueError(f"Missing required columns in dataset: {missing_cols}")
        
    # 2. Parse Date correctly
    # Try standard DD/MM/YYYY HH:MM:SS format
    df['Date_Parsed'] = pd.to_datetime(df['Date'], format='%d/%m/%Y %H:%M:%S', errors='coerce')
    # For any dates that failed to parse (e.g. YYYY-MM-DD), try standard inference
    nan_dates = df['Date_Parsed'].isna()
    if nan_dates.any():
        df.loc[nan_dates, 'Date_Parsed'] = pd.to_datetime(df.loc[nan_dates, 'Date'], errors='coerce')
        
    # Drop rows where date could not be parsed
    invalid_dates_count = df['Date_Parsed'].isna().sum()
    if invalid_dates_count > 0:
        print(f"[Warning] {invalid_dates_count} rows dropped due to invalid Date format.")
        df = df.dropna(subset=['Date_Parsed'])
        
    df['Date'] = df['Date_Parsed']
    df = df.drop(columns=['Date_Parsed'])
    
    # 3. Sort chronologically
    df = df.sort_values(by='Date').reset_index(drop=True)
    
    # 4. Remove duplicate rows based on Date
    initial_len = len(df)
    df = df.drop_duplicates(subset=['Date']).reset_index(drop=True)
    dup_count = initial_len - len(df)
    if dup_count > 0:
        print(f"[Info] Removed {dup_count} duplicate rows by date.")
        
    # 5. Clean and convert numerical columns to numeric types
    for col in ['Open', 'High', 'Low', 'Close', 'Volume']:
        df[col] = pd.to_numeric(df[col], errors='coerce')
        
    # Drop rows with null values in core fields
    null_rows = df[required_cols].isna().any(axis=1)
    null_count = null_rows.sum()
    if null_count > 0:
        print(f"[Warning] Dropping {null_count} rows with missing numerical values.")
        df = df[~null_rows].reset_index(drop=True)
        
    # 6. Validate OHLCV logical relationships
    valid_mask = (
        (df['Open'] > 0) &
        (df['High'] > 0) &
        (df['Low'] > 0) &
        (df['Close'] > 0) &
        (df['Volume'] >= 0) &
        (df['High'] >= df['Open']) &
        (df['High'] >= df['Close']) &
        (df['Low'] <= df['Open']) &
        (df['Low'] <= df['Close'])
    )
    
    invalid_rows = df[~valid_mask]
    invalid_count = len(invalid_rows)
    if invalid_count > 0:
        print(f"[Warning] Found {invalid_count} malformed rows violating logical price boundaries.")
        # Log details of first few malformed records
        for idx, row in invalid_rows.head(3).iterrows():
            print(f"   Malformed Row [{row['Date']}]: Open={row['Open']}, High={row['High']}, Low={row['Low']}, Close={row['Close']}, Volume={row['Volume']}")
        df = df[valid_mask].reset_index(drop=True)
        
    print(f"Preprocessing complete for {symbol}. Clean records remaining: {len(df)}")
    return df

if __name__ == '__main__':
    # Simple CLI test
    import sys
    symbol = sys.argv[1] if len(sys.argv) > 1 else 'TCS'
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    file_path = os.path.join(base_dir, 'datasets', f'{symbol}.csv')
    try:
        df = preprocess_data(file_path, symbol)
        print(df.head())
    except Exception as e:
        print(f"Error: {e}")
