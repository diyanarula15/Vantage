import re

with open('/Users/apple/Desktop/vantage/Vantage/api.py', 'r') as f:
    content = f.read()

# I am validating that caching is intact in api.py
print("Caching present:", "_query_cache" in content)
