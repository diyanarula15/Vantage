import re
with open("interfaces.py", "r") as f:
    content = f.read()

# Log the exact error when chart fails in slack
content = content.replace('print(f"⚠️ Could not generate chart: {chart_err}")', 'import traceback; traceback.print_exc(); print(f"⚠️ Could not generate chart: {chart_err}")')
with open("interfaces.py", "w") as f:
    f.write(content)
