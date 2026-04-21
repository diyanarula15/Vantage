import datetime
import sys

def mock_handle_mentions():
    def generate_chart_bg(rows_data):
        try:
            if rows_data and len(rows_data) > 1:
                import pandas as pd
                df = pd.DataFrame(rows_data)
                num_cols = df.select_dtypes(include=["number"]).columns.tolist()
                cat_cols = df.select_dtypes(exclude=["number", "datetime"]).columns.tolist()
                print(f"Num: {num_cols}, Cat: {cat_cols}")
                if num_cols and cat_cols:
                    import matplotlib
                    matplotlib.use("Agg")
                    import matplotlib.pyplot as plt
                    import seaborn as sns
                    metric = num_cols[0]
                    dimension = cat_cols[0]
                    df_agg = df.groupby(dimension)[metric].sum().reset_index().sort_values(by=metric, ascending=False).head(15)
                    print(f"Agg:\n{df_agg}")
                    
                    chart_path = f"./vantage_chart_{datetime.datetime.now().strftime('%H%M%S')}.png" if 'datetime' in sys.modules else "./vantage_chart.png"
                    print(f"Saving to {chart_path}...")
                    plt.figure()
                    plt.plot([1,2,3])
                    plt.savefig(chart_path)
                    print("✅ Chart generated successfully")
                else:
                    print("Skipping chart generation, cols issue.")
        except Exception as chart_err:
            import traceback
            traceback.print_exc()
            print(f"⚠️ Could not generate chart: {chart_err}")
            
    safe_rows = [
        {"Category": "Food", "Amount": 100},
        {"Category": "Transport", "Amount": 50},
        {"Category": "Food", "Amount": 30}
    ]
    generate_chart_bg(safe_rows)

mock_handle_mentions()
