import re

with open('interfaces.py', 'r') as f:
    content = f.read()

# Handle None values getting returned by SQLite which breaks sorting later
# `df_agg = df.groupby(dimension)[metric].sum().reset_index().sort_values(by=metric, ascending=False).head(15)`
# Dataframes will handle NA by default if we just fillna before grouping

replacement = """        if num_cols and cat_cols:
                            import matplotlib
                            matplotlib.use("Agg")
                            import matplotlib.pyplot as plt
                            import seaborn as sns
                            
                            metric = num_cols[0]
                            dimension = cat_cols[0]
                            
                            # Clean dataframe before plotting
                            df[metric] = df[metric].fillna(0)
                            
                            df_agg = df.groupby(dimension)[metric].sum().reset_index().sort_values(by=metric, ascending=False).head(15)"""

content = re.sub(
    r'        if num_cols and cat_cols:\n\s*import matplotlib\n\s*matplotlib\.use\("Agg"\)\n\s*import matplotlib\.pyplot as plt\n\s*import seaborn as sns\n\s*metric = num_cols\[0\]\n\s*dimension = cat_cols\[0\]\n\s*df_agg = df\.groupby\(dimension\)\[metric\]\.sum\(\)\.reset_index\(\)\.sort_values\(by=metric, ascending=False\)\.head\(15\)',
    replacement,
    content
)

with open('interfaces.py', 'w') as f:
    f.write(content)
