import os
import re

for filename in ["interfaces.py", "brain.py", "ingestor.py"]:
    if not os.path.exists(filename): continue
    with open(filename, "r") as f:
        text = f.read()
    
    if filename == "interfaces.py" and "import datetime" not in text:
        text = "import datetime\n" + text

    text = "from contextlib import closing\n" + text
    text = re.sub(r'with sqlite3\.connect\((.*?)\) as ([a-zA-Z_0-9]+):', r'with closing(sqlite3.connect(\1)) as \2:\n            with \2:', text)

    with open(filename, "w") as f:
        f.write(text)
print("Finished setting fixed.")
