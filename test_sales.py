import traceback
from ingestor import VantageIngestor

try:
    print("Testing sales.csv...")
    ingestor = VantageIngestor()
    ingestor.ingest('./sales.csv')
    print("Success")
except Exception as e:
    print("Error during ingestion!")
    traceback.print_exc()
