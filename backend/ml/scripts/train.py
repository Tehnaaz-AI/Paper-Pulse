import os
import argparse
import json
from datetime import datetime
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
import joblib

# Import custom modules
from preprocess import preprocess_data
from feature_engineering import engineer_features, add_target_and_clean

# Define feature columns
FEATURE_COLS = [
    'daily_return', 'price_change', 'high_low_range', 'open_close_change',
    'SMA_5', 'price_vs_sma5', 'SMA_10', 'price_vs_sma10', 'SMA_20', 'price_vs_sma20',
    'EMA_5', 'EMA_10', 'EMA_20', 'RSI_14', 'MACD', 'MACD_signal', 'MACD_histogram',
    'volatility_5', 'volatility_10', 'volatility_20', 'volume_change',
    'volume_sma_5', 'volume_sma_10', 'volume_ratio',
    'close_lag_1', 'return_lag_1', 'close_lag_2', 'return_lag_2',
    'close_lag_3', 'return_lag_3', 'close_lag_5', 'return_lag_5'
]

def train_model(symbol, datasets_dir, models_dir):
    """
    Runs the complete preprocessing, feature engineering, split, scaling, training,
    tuning, selection, evaluation, and serialization pipeline for a stock symbol.
    """
    csv_path = os.path.join(datasets_dir, f"{symbol}.csv")
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"No CSV file found for stock '{symbol}' at: {csv_path}")

    # 1. Load and clean data
    df_clean = preprocess_data(csv_path, symbol)
    # 2. Engineer features
    df_features = engineer_features(df_clean)
    # 3. Add target and drop final rows/NaNs
    df_final = add_target_and_clean(df_features)

    n_samples = len(df_final)
    if n_samples < 50:
        raise ValueError(f"Insufficient samples ({n_samples}) for training. Needs at least 50.")

    # Check for target presence in features (prevent data leakage)
    for col in FEATURE_COLS:
        if 'target' in col.lower() or 'future' in col.lower():
            raise ValueError(f"Data leakage detected! Feature column '{col}' contains target-like terms.")

    # 4. Chronological splitting (Time-Series Split: 70% Train, 15% Val, 15% Test)
    train_size = int(n_samples * 0.70)
    val_size = int(n_samples * 0.15)
    test_size = n_samples - train_size - val_size

    train_df = df_final.iloc[:train_size]
    val_df = df_final.iloc[train_size:train_size + val_size]
    test_df = df_final.iloc[train_size + val_size:]

    X_train, y_train = train_df[FEATURE_COLS], train_df['Target']
    X_val, y_val = val_df[FEATURE_COLS], val_df['Target']
    X_test, y_test = test_df[FEATURE_COLS], test_df['Target']

    print(f"\nTraining set size: {len(X_train)} (Positive class: {y_train.sum()})")
    print(f"Validation set size: {len(X_val)} (Positive class: {y_val.sum()})")
    print(f"Testing set size: {len(X_test)} (Positive class: {y_test.sum()})")
    print(f"Number of features: {len(FEATURE_COLS)}")

    # 5. Fit Scaler (fitted ONLY on training data to prevent leakage)
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled = scaler.transform(X_val)
    X_test_scaled = scaler.transform(X_test)

    # 6. Define Candidate Models & Hyperparameters
    # We will tune key parameters on the validation set to prevent overfitting
    candidates = [
        {
            'name': 'RandomForestClassifier',
            'model_class': RandomForestClassifier,
            'params': {'n_estimators': 200, 'class_weight': 'balanced', 'random_state': 42, 'max_depth': 5, 'min_samples_leaf': 4},
            'needs_scaled': False
        },
        {
            'name': 'RandomForestClassifier_tuned',
            'model_class': RandomForestClassifier,
            'params': {'n_estimators': 200, 'class_weight': 'balanced', 'random_state': 42, 'max_depth': 7, 'min_samples_leaf': 2},
            'needs_scaled': False
        },
        {
            'name': 'GradientBoostingClassifier',
            'model_class': GradientBoostingClassifier,
            'params': {'n_estimators': 100, 'learning_rate': 0.05, 'max_depth': 3, 'random_state': 42},
            'needs_scaled': False
        },
        {
            'name': 'GradientBoostingClassifier_tuned',
            'model_class': GradientBoostingClassifier,
            'params': {'n_estimators': 150, 'learning_rate': 0.02, 'max_depth': 4, 'random_state': 42},
            'needs_scaled': False
        },
        {
            'name': 'LogisticRegression',
            'model_class': LogisticRegression,
            'params': {'C': 0.1, 'class_weight': 'balanced', 'max_iter': 1000, 'random_state': 42},
            'needs_scaled': True
        },
        {
            'name': 'LogisticRegression_tuned',
            'model_class': LogisticRegression,
            'params': {'C': 1.0, 'class_weight': 'balanced', 'max_iter': 1000, 'random_state': 42},
            'needs_scaled': True
        }
    ]

    best_val_f1 = -1.0
    best_candidate = None
    best_model = None

    print("\n--- Tuning Models on Validation Set ---")
    
    results = {}

    for cand in candidates:
        name = cand['name']
        model = cand['model_class'](**cand['params'])
        
        # Select scaled or raw inputs
        X_tr = X_train_scaled if cand['needs_scaled'] else X_train
        X_va = X_val_scaled if cand['needs_scaled'] else X_val
        
        # Fit model
        model.fit(X_tr, y_train)
        
        # Predict on validation set
        val_preds = model.predict(X_va)
        
        # Compute metrics
        val_acc = accuracy_score(y_val, val_preds)
        val_prec = precision_score(y_val, val_preds, zero_division=0)
        val_rec = recall_score(y_val, val_preds, zero_division=0)
        val_f1 = f1_score(y_val, val_preds, zero_division=0)
        
        print(f"{name:<35} | Val Accuracy: {val_acc:.3f} | Val F1: {val_f1:.3f} | Val Recall: {val_rec:.3f}")
        
        results[name] = {
            'val_accuracy': val_acc,
            'val_precision': val_prec,
            'val_recall': val_rec,
            'val_f1': val_f1,
            'params': cand['params'],
            'needs_scaled': cand['needs_scaled']
        }
        
        # Prioritize F1 Score on the validation set for selection
        if val_f1 > best_val_f1:
            best_val_f1 = val_f1
            best_candidate = cand
            best_model = model

    # Fallback to accuracy if F1 is 0 for all models
    if best_val_f1 == 0:
        best_val_acc = -1
        for name, metrics in results.items():
            if metrics['val_accuracy'] > best_val_acc:
                best_val_acc = metrics['val_accuracy']
                # find candidate matching name
                best_candidate = next(c for c in candidates if c['name'] == name)
                # re-instantiate and fit
                best_model = best_candidate['model_class'](**best_candidate['params'])
                X_tr = X_train_scaled if best_candidate['needs_scaled'] else X_train
                best_model.fit(X_tr, y_train)

    print(f"\n[Selected Model] {best_candidate['name']}")

    # 7. Evaluate Selected Model on the Final Unseen Test Set
    X_te = X_test_scaled if best_candidate['needs_scaled'] else X_test
    test_preds = best_model.predict(X_te)
    
    # Check if predict_proba is supported to compute ROC-AUC
    test_roc_auc = 0.5
    try:
        test_probs = best_model.predict_proba(X_te)[:, 1]
        test_roc_auc = roc_auc_score(y_test, test_probs)
    except (AttributeError, IndexError):
        pass

    test_metrics = {
        'accuracy': float(accuracy_score(y_test, test_preds)),
        'precision': float(precision_score(y_test, test_preds, zero_division=0)),
        'recall': float(recall_score(y_test, test_preds, zero_division=0)),
        'f1': float(f1_score(y_test, test_preds, zero_division=0)),
        'roc_auc': float(test_roc_auc)
    }

    print("\n--- Selected Model Test Set Performance ---")
    print(f"Accuracy:  {test_metrics['accuracy']:.3f}")
    print(f"Precision: {test_metrics['precision']:.3f}")
    print(f"Recall:    {test_metrics['recall']:.3f}")
    print(f"F1 Score:  {test_metrics['f1']:.3f}")
    print(f"ROC-AUC:   {test_metrics['roc_auc']:.3f}")

    # Retrain on combined Train + Validation set to maximize data usage before saving (optional but recommended)
    print("\nRetraining selected model on combined Train + Validation dataset...")
    X_combined = pd.concat([X_train, X_val]).reset_index(drop=True)
    y_combined = pd.concat([y_train, y_val]).reset_index(drop=True)
    
    scaler_final = StandardScaler()
    X_combined_scaled = scaler_final.fit_transform(X_combined)
    
    X_comb_fit = X_combined_scaled if best_candidate['needs_scaled'] else X_combined
    final_model = best_candidate['model_class'](**best_candidate['params'])
    final_model.fit(X_comb_fit, y_combined)

    # 8. Save Artifacts
    os.makedirs(models_dir, exist_ok=True)
    model_path = os.path.join(models_dir, f"{symbol}_model.joblib")
    scaler_path = os.path.join(models_dir, f"{symbol}_scaler.joblib")
    metadata_path = os.path.join(models_dir, f"{symbol}_metadata.json")

    # Serialize model & scaler
    joblib.dump(final_model, model_path)
    joblib.dump(scaler_final, scaler_path)

    # Compute feature importances if supported (Random Forest / GBDT)
    feature_importances = {}
    if hasattr(final_model, 'feature_importances_'):
        importances = final_model.feature_importances_
        indices = np.argsort(importances)[::-1]
        for idx in indices:
            feature_importances[FEATURE_COLS[idx]] = float(importances[idx])

    # Save metadata JSON
    metadata = {
        'symbol': symbol,
        'model_version': '1.0.0',
        'model_type': best_candidate['model_class'].__name__,
        'selected_candidate': best_candidate['name'],
        'hyperparameters': best_candidate['params'],
        'features': FEATURE_COLS,
        'needs_scaling': best_candidate['needs_scaled'],
        'training_date': datetime.now().isoformat(),
        'dataset_size': n_samples,
        'train_samples': len(X_train),
        'val_samples': len(X_val),
        'test_samples': len(X_test),
        'metrics': test_metrics,
        'feature_importances': feature_importances
    }

    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)

    print(f"Saved trained model to: {model_path}")
    print(f"Saved scaler to: {scaler_path}")
    print(f"Saved metadata file to: {metadata_path}")
    print("Training process finished successfully!")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Train stock price prediction models.")
    parser.add_argument('--symbol', type=str, default='TCS', help="Stock symbol to train (or 'ALL' for all datasets)")
    args = parser.parse_args()

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    datasets_dir = os.path.normpath(os.path.join(base_dir, '..', 'data', 'csv'))
    models_dir = os.path.normpath(os.path.join(base_dir, 'models', 'trained'))

    symbol = args.symbol.upper()

    if symbol == 'ALL':
        print("Training models for ALL available stock datasets...")
        if not os.path.exists(datasets_dir):
            print(f"Error: Datasets folder not found at {datasets_dir}")
            exit(1)
        files = os.listdir(datasets_dir)
        csv_symbols = [os.path.splitext(f)[0] for f in files if f.lower().endswith('.csv')]
        
        if not csv_symbols:
            print("No CSV datasets found to train.")
            exit(0)
            
        print(f"Found datasets for symbols: {csv_symbols}")
        for sym in csv_symbols:
            try:
                print(f"\n==================== TRAINING {sym} ====================")
                train_model(sym, datasets_dir, models_dir)
            except Exception as e:
                print(f"[Failed] Failed to train model for {sym}: {e}")
    else:
        train_model(symbol, datasets_dir, models_dir)
