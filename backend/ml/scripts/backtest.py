import os
import argparse
import json
import joblib
import pandas as pd
import numpy as np

# Import custom modules
from preprocess import preprocess_data
from feature_engineering import engineer_features, add_target_and_clean

# Feature list in exact order
FEATURE_COLS = [
    'daily_return', 'price_change', 'high_low_range', 'open_close_change',
    'SMA_5', 'price_vs_sma5', 'SMA_10', 'price_vs_sma10', 'SMA_20', 'price_vs_sma20',
    'EMA_5', 'EMA_10', 'EMA_20', 'RSI_14', 'MACD', 'MACD_signal', 'MACD_histogram',
    'volatility_5', 'volatility_10', 'volatility_20', 'volume_change',
    'volume_sma_5', 'volume_sma_10', 'volume_ratio',
    'close_lag_1', 'return_lag_1', 'close_lag_2', 'return_lag_2',
    'close_lag_3', 'return_lag_3', 'close_lag_5', 'return_lag_5'
]

BUY_THRESHOLD = float(os.getenv('BUY_THRESHOLD', '0.60'))
SELL_THRESHOLD = float(os.getenv('SELL_THRESHOLD', '0.60'))

def run_backtest(symbol, datasets_dir, models_dir, initial_capital=100000.0):
    """
    Simulates paper trading on the test set using signals from the trained model.
    """
    model_path = os.path.join(models_dir, f"{symbol}_model.joblib")
    scaler_path = os.path.join(models_dir, f"{symbol}_scaler.joblib")
    metadata_path = os.path.join(models_dir, f"{symbol}_metadata.json")

    if not os.path.exists(model_path) or not os.path.exists(metadata_path):
        raise FileNotFoundError(f"Trained model not found for symbol '{symbol}'. Please train it first.")

    with open(metadata_path, 'r') as f:
        meta = json.load(f)

    model = joblib.load(model_path)
    scaler = joblib.load(scaler_path)

    # 1. Load, clean, and build features
    csv_path = os.path.join(datasets_dir, f"{symbol}.csv")
    df_clean = preprocess_data(csv_path, symbol)
    df_features = engineer_features(df_clean)
    df_final = add_target_and_clean(df_features)

    # 2. Extract Test portion chronologically (using the exact same test index)
    n_samples = len(df_final)
    train_size = int(n_samples * 0.70)
    val_size = int(n_samples * 0.15)
    test_size = n_samples - train_size - val_size

    # The test set represents the latest unseen historical period
    test_df = df_final.iloc[train_size + val_size:].copy().reset_index(drop=True)
    
    if len(test_df) == 0:
        raise ValueError("Empty test set. Cannot backtest.")

    print(f"Backtesting over {len(test_df)} trading days...")

    # 3. Simulate trading day-by-day
    capital = initial_capital
    position = 0 # 0 = no position, >0 = quantity of shares owned
    avg_buy_price = 0.0
    trades_executed = 0
    wins = 0
    losses = 0
    
    capital_history = [capital]
    peaks = [capital]

    # For benchmark (Buy & Hold)
    bh_position = int(initial_capital / test_df.iloc[0]['Close'])
    bh_cash = initial_capital - (bh_position * test_df.iloc[0]['Close'])

    for idx, row in test_df.iterrows():
        close_price = float(row['Close'])
        sma20 = float(row['SMA_20'])

        # Create feature vector
        X_day = pd.DataFrame([row[FEATURE_COLS]])
        
        # Scale if required
        if meta['needs_scaling']:
            X_day_scaled = scaler.transform(X_day)
            X_infer = X_day_scaled
        else:
            X_infer = X_day

        # Get ML prediction probabilities
        probs = model.predict_proba(X_infer)[0]
        prob_down = float(probs[0])
        prob_up = float(probs[1])

        # Signal mapping
        raw_signal = 'HOLD'
        if prob_up >= BUY_THRESHOLD:
            raw_signal = 'BUY'
        elif prob_down >= SELL_THRESHOLD:
            raw_signal = 'SELL'

        # Trend confirmation
        final_signal = raw_signal
        if raw_signal == 'BUY' and close_price <= sma20:
            final_signal = 'HOLD'
        elif raw_signal == 'SELL' and close_price >= sma20:
            final_signal = 'HOLD'

        # Execute Trading Decisions
        if final_signal == 'BUY' and position == 0:
            # Buy maximum possible shares with available capital
            position = int(capital / close_price)
            if position > 0:
                avg_buy_price = close_price
                cost = position * close_price
                capital -= cost
                trades_executed += 1
                print(f"   Trade #{trades_executed}: BUY {position} shares @ Rs. {close_price:.2f} on {row['Date'].strftime('%Y-%m-%d')}")
        
        elif final_signal == 'SELL' and position > 0:
            # Sell all holdings
            revenue = position * close_price
            capital += revenue
            pnl = (close_price - avg_buy_price) * position
            
            if pnl > 0:
                wins += 1
            else:
                losses += 1
                
            trades_executed += 1
            print(f"   Trade #{trades_executed}: SELL {position} shares @ Rs. {close_price:.2f} on {row['Date'].strftime('%Y-%m-%d')} | PnL: Rs. {pnl:.2f}")
            
            position = 0
            avg_buy_price = 0.0

        # Track account equity (Cash + Portfolio Value)
        portfolio_val = position * close_price
        current_equity = capital + portfolio_val
        capital_history.append(current_equity)
        
        # Drawdown calculation
        peak = max(capital_history)
        peaks.append(peak)

    # Liquidation of any remaining position on final day
    final_close = float(test_df.iloc[-1]['Close'])
    if position > 0:
        revenue = position * final_close
        capital += revenue
        pnl = (final_close - avg_buy_price) * position
        if pnl > 0:
            wins += 1
        else:
            losses += 1
        trades_executed += 1
        print(f"   Final Liquidation: SELL {position} shares @ Rs. {final_close:.2f} on final day | PnL: Rs. {pnl:.2f}")
        position = 0

    final_equity = capital
    total_return = ((final_equity - initial_capital) / initial_capital) * 100
    
    # Calculate Drawdown
    drawdowns = []
    for eq, pk in zip(capital_history, peaks):
        dd = (pk - eq) / pk
        drawdowns.append(dd)
    max_drawdown = max(drawdowns) * 100

    # Calculate Win Rate
    win_rate = (wins / (wins + losses)) * 100 if (wins + losses) > 0 else 0.0

    # Calculate Buy and Hold Benchmark
    bh_final_equity = bh_cash + (bh_position * final_close)
    bh_return = ((bh_final_equity - initial_capital) / initial_capital) * 100

    print("\n====================================")
    print("BACKTESTING RESULTS")
    print("====================================")
    print(f"Stock Symbol:          {symbol}")
    print(f"Initial Capital:       Rs. {initial_capital:,.2f}")
    print(f"Final Model Equity:    Rs. {final_equity:,.2f}")
    print(f"Model Total Return:    {total_return:.2f}%")
    print(f"Buy & Hold Return:     {bh_return:.2f}% (Benchmark)")
    print("------------------------------------")
    print(f"Total Trades Closed:   {wins + losses}")
    print(f"Winning Trades:        {wins}")
    print(f"Losing Trades:         {losses}")
    print(f"Win Rate:              {win_rate:.2f}%")
    print(f"Maximum Drawdown:      {max_drawdown:.2f}%")
    print("====================================")
    
    return {
        'symbol': symbol,
        'initial_capital': initial_capital,
        'final_equity': final_equity,
        'total_return': total_return,
        'benchmark_return': bh_return,
        'trades': wins + losses,
        'win_rate': win_rate,
        'max_drawdown': max_drawdown
    }

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Backtest stock models.")
    parser.add_argument('--symbol', type=str, default='TCS', help="Stock symbol to backtest")
    args = parser.parse_args()
    
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    datasets_dir = os.path.normpath(os.path.join(base_dir, '..', 'data', 'csv'))
    models_dir = os.path.normpath(os.path.join(base_dir, 'models', 'trained'))
    
    try:
        run_backtest(args.symbol.upper(), datasets_dir, models_dir)
    except Exception as e:
        print(f"Error: {e}")
