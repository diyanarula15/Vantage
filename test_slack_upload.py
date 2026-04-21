import os
import datetime
from slack_bolt import App
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from dotenv import load_dotenv
load_dotenv()

app = App(token=os.environ.get("SLACK_BOT_TOKEN"))

chart_path = "test_chart.png"
plt.figure()
plt.plot([1,2,3])
plt.savefig(chart_path)
plt.close()

try:
    print("Uploading to slack...")
    res = app.client.conversations_list(types="public_channel")
    channel_id = res['channels'][0]['id']
    print(f"Uploading to {channel_id}...")
    
    app.client.files_upload_v2(
        channel=channel_id,
        file=chart_path,
        initial_comment="Testing upload"
    )
    print("Uploaded!")
except Exception as e:
    import traceback
    traceback.print_exc()
    print(f"Error: {e}")

