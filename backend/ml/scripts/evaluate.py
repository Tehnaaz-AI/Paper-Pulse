import os
import argparse
import json

def evaluate_model(symbol, models_dir):
    """
    Loads model training metadata and outputs a structured evaluation report.
    """
    metadata_path = os.path.join(models_dir, f"{symbol}_metadata.json")
    
    if not os.path.exists(metadata_path):
        raise FileNotFoundError(f"No trained model metadata found for symbol '{symbol}'. Please train the model first by running train.py.")
        
    with open(metadata_path, 'r') as f:
        meta = json.load(f)
        
    print("====================================")
    print("MODEL EVALUATION")
    print("====================================")
    print(f"Dataset: {meta['symbol']}")
    print(f"Model Type: {meta['model_type']} ({meta['selected_candidate']})")
    print(f"Training Date: {meta['training_date'].split('T')[0]}")
    print(f"Total Preprocessed Rows: {meta['dataset_size']}")
    print(f"Number of Features: {len(meta['features'])}")
    print("\nSamples:")
    print(f"Training: {meta['train_samples']}")
    print(f"Validation: {meta['val_samples']}")
    print(f"Testing: {meta['test_samples']}")
    print("------------------------------------")
    print(f"Test Set Performance Metrics:")
    print(f"Accuracy:  {meta['metrics']['accuracy']:.3f}")
    print(f"Precision: {meta['metrics']['precision']:.3f}")
    print(f"Recall:    {meta['metrics']['recall']:.3f}")
    print(f"F1 Score:  {meta['metrics']['f1']:.3f}")
    print(f"ROC-AUC:   {meta['metrics']['roc_auc']:.3f}")
    
    # Feature importances (Random Forest / GBDT specific)
    if 'feature_importances' in meta and meta['feature_importances']:
        print("------------------------------------")
        print("Top 5 Key Drivers (Feature Importance):")
        sorted_imp = sorted(meta['feature_importances'].items(), key=lambda x: x[1], reverse=True)
        for feat, val in sorted_imp[:5]:
            print(f" - {feat:<20} : {val:.4f}")
            
    print("====================================")

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Evaluate stock models.")
    parser.add_argument('--symbol', type=str, default='TCS', help="Stock symbol to evaluate")
    args = parser.parse_args()
    
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    models_dir = os.path.normpath(os.path.join(base_dir, 'models', 'trained'))
    
    try:
        evaluate_model(args.symbol.upper(), models_dir)
    except Exception as e:
        print(f"Error: {e}")
