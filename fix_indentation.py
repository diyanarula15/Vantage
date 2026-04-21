import re
import os

def fix_file(filename):
    if not os.path.exists(filename): return
    with open(filename, "r") as f:
        text = f.read()

    # Revert the double `with closing(...): \n with ...` 
    # to original: `with sqlite3.connect(...) as conn:`
    # Because my script might have run twice, it could look like:
    # with closing(sqlite3.connect(self.db_path)) as conn:
    #         with conn:
    
    if "from contextlib import closing\n" in text:
        text = text.replace("from contextlib import closing\n", "")
    
    # We will use regex to find with closing(sqlite3.connect(X)) as Y:\n            with Y:
    text = re.sub(r'with closing\(sqlite3\.connect\((.*?)\)\) as ([a-zA-Z_0-9]+):\s+with \2:', 
                  r'with sqlite3.connect(\1) as \2:', text)

    with open(filename, "w") as f:
        f.write(text)

for file in ["brain.py", "ingestor.py", "interfaces.py"]:
    fix_file(file)

print("done fixing.")
