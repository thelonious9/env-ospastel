import pandas as pd
import json

def inspect_excel(file_path):
    df = pd.read_excel(file_path, sheet_name=0)
    print("Columns:", df.columns.tolist())
    print("\nFirst 5 rows:")
    print(df.head())
    
    # Save as JSON for the dashboard
    # We want to keep it simple, maybe a list of objects
    data = df.to_dict(orient='records')
    with open('data.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2, default=str)
    print("\nSaved to data.json")

if __name__ == "__main__":
    inspect_excel('tabla boletines.xlsx')
