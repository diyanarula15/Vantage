import re

with open('/Users/apple/Desktop/vantage/Vantage/narrator.py', 'r') as f:
    content = f.read()

def inject_fast_pii():
    return '''    def redact_pii(self, rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
        return self._regex_redact_records(rows)'''

content = re.sub(r"def redact_pii\s*\(.*?\) -> list\[dict\[str, Any\]\]:[\s\S]*?return regex_cleaned", inject_fast_pii(), content)

with open('/Users/apple/Desktop/vantage/Vantage/narrator.py', 'w') as f:
    f.write(content)

