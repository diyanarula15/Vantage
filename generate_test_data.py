import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def generate_large_csv(filename="data/massive_sales_data.csv", num_rows=50000):
    print(f"Generating {num_rows} rows of data...")
    
    np.random.seed(42)
    
    # Generate dates across the last 2 years
    base_date = datetime.today() - timedelta(days=730)
    dates = [base_date + timedelta(days=np.random.randint(0, 730)) for _ in range(num_rows)]
    
    products = ['Enterprise License', 'Pro Tier', 'Basic Tier', 'Consulting Package', 'Hardware Add-on']
    regions = ['North America', 'EMEA', 'APAC', 'LATAM']
    
    # Generate values with some planned missing data (nulls) and skewness (for Data Quality testing)
    revenue = np.random.exponential(scale=5000, size=num_rows)
    discount = np.random.uniform(0, 0.4, size=num_rows)
    
    df = pd.DataFrame({
        'Transaction_ID': [f"TRX-{10000 + i}" for i in range(num_rows)],
        'Date': dates,
        'Product_Category': np.random.choice(products, num_rows, p=[0.1, 0.3, 0.4, 0.1, 0.1]),
        'Region': np.random.choice(regions, num_rows),
        'Revenue_USD': revenue,
        'Discount_Applied': discount,
        'Customer_Satisfaction_Score': np.random.choice([1, 2, 3, 4, 5, np.nan], num_rows, p=[0.05, 0.05, 0.1, 0.3, 0.4, 0.1]) # 10% nulls
    })
    
    # Introduce some artificial outliers and skewness for testing
    df.loc[np.random.choice(df.index, 50), 'Revenue_USD'] = np.random.uniform(100000, 500000, 50)
    
    df.to_csv(filename, index=False)
    print(f"Successfully generated {filename} with shape {df.shape}")

if __name__ == "__main__":
    generate_large_csv()
