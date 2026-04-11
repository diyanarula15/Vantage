import argparse
import sys
import os

def run_streamlit_ui() -> None:
    print("Vantage has been updated to a Multipage architecture!")
    print("Please run the app using:")
    print("  streamlit run Home.py")
    os.system("streamlit run Home.py")

def run_slack_listener() -> None:
    from slack_bolt import App
    from slack_bolt.adapter.socket_mode import SocketModeHandler
    from narrator import Narrator
    from brain import VantageBrain
    
    app = App(token=os.environ.get("SLACK_BOT_TOKEN"))
    
    @app.event("app_mention")
    def handle_mentions(event, say):
        query = event["text"]
        brain = VantageBrain()
        payload = brain.ask_data(query)
        
        narrator = Narrator()
        safe_rows = narrator.redact_pii(payload.get("rows", []))
        summary = narrator.summarize(query, safe_rows)
        
        say(summary)

    handler = SocketModeHandler(app, os.environ.get("SLACK_APP_TOKEN"))
    print("⚡️ Slack listener started in Background")
    handler.start()

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", default="streamlit", choices=["streamlit", "slack"])
    args = parser.parse_args()

    if args.mode == "slack":
        run_slack_listener()
    else:
        run_streamlit_ui()
