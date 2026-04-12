import traceback
from ingestor import VantageIngestor
import os

os.makedirs("./data/uploads", exist_ok=True)

try:
    with open('./data/uploads/test.csv', 'w') as f:
        f.write('id,name,value\n1,Apples,10\n2,Oranges,20\n')
    
    print("Starting ingestion...")
    ingestor = VantageIngestor()
    ingestor.ingest('./data/uploads/test.csv')
    print("Success")
except Exception as e:
    traceback.print_exc()
