import pandas as pd

rows_data = [{'Category': 'Bank Charges', 'total_spending': 501.5}, {'Category': 'Debt Payment', 'total_spending': 990000.0}]

df = pd.DataFrame(rows_data)
num_cols = df.select_dtypes(include=["number"]).columns.tolist()
cat_cols = df.select_dtypes(exclude=["number", "datetime"]).columns.tolist()

print(f"Num cols: {num_cols}")
print(f"Cat cols: {cat_cols}")

if num_cols and cat_cols:
    print("Will draw chart!")
else:
    print("Won't draw chart")
