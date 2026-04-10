import pandas as pd
import json
import os

def convert_data():
    file_path = 'tabla boletines.xlsx'
    if not os.path.exists(file_path):
        print(f"Error: {file_path} not found.")
        return

    # Read the excel file
    df = pd.read_excel(file_path)
    
    # Normalize column names - the first one is likely Gnero
    # We'll rename it to 'Genero' for simplicity in JS
    cols = df.columns.tolist()
    rename_dict = {cols[0]: 'genero'}
    for col in cols:
        if 'Dependencia' in col:
            rename_dict[col] = 'dependencia'
        if 'Fecha' in col:
            rename_dict[col] = 'fecha'
            
    df = df.rename(columns=rename_dict)
    
    # Ensure date is datetime
    df['fecha'] = pd.to_datetime(df['fecha'])
    
    # Extract Month and Quarter
    df['mes_num'] = df['fecha'].dt.month
    df['year'] = df['fecha'].dt.year
    df['trimestre'] = (df['mes_num'] - 1) // 3 + 1
    
    # Month names in Spanish
    meses_es = {
        1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril',
        5: 'Mayo', 6: 'Junio', 7: 'Julio', 8: 'Agosto',
        9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre'
    }
    df['mes_nombre'] = df['mes_num'].map(meses_es)
    
    # Select only necessary columns to keep JSON small
    final_df = df[['fecha', 'genero', 'dependencia', 'mes_num', 'mes_nombre', 'trimestre', 'year']]
    
    # Drop rows with missing crucial data if any
    final_df = final_df.dropna(subset=['fecha', 'genero', 'dependencia'])
    
    # Convert to list of dicts
    data = final_df.to_dict(orient='records')
    
    # Custom serializer for dates
    data_json = json.dumps(data, default=lambda x: x.isoformat() if hasattr(x, 'isoformat') else str(x), ensure_ascii=False, indent=2)
    
    with open('data.json', 'w', encoding='utf-8') as f:
        f.write(data_json)
        
    print(f"Successfully converted {len(data)} records to data.json")
    print(f"Columns used: {list(final_df.columns)}")

if __name__ == "__main__":
    convert_data()
