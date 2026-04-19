with open('/Users/apple/Desktop/vantage/Vantage/narrator.py', 'r') as f:
    content = f.read()

content = content.replace("use_web=True", "use_web=False")

with open('/Users/apple/Desktop/vantage/Vantage/narrator.py', 'w') as f:
    f.write(content)
