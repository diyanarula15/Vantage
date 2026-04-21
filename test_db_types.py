import sqlite3
import pandas as pd
with sqlite3.connect("data/vantage.db") as conn:
    df = pd.read_sql("SELECT * FROM vantage_data LIMIT 5", conn)
    print(df.dtypes)
