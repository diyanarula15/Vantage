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
    
    # Initialize these ONCE outside the handler to prevent ChromaDB threading/initialization crashes
    bot_brain = VantageBrain()
    bot_narrator = Narrator()

    @app.event("app_mention")
    def handle_mentions(event, say):
        print(f"🔔 Received mention event! Text: {event.get('text')}")
        say("⏳ I'm crunching the numbers and gathering market context! One moment...")
        try:
            import json
            query = event["text"]
            payload = bot_brain.ask_data(query)
            
            safe_rows = bot_narrator.redact_pii(payload.get("rows", []))
            summary = bot_narrator.summarize(query, safe_rows)
            
            blocks = []
            
            # 1. Header & Summary Feature
            blocks.append({
                "type": "header",
                "text": {"type": "plain_text", "text": "✨ Vantage Insight", "emoji": True}
            })
            
            blocks.append({
                "type": "section",
                "text": {"type": "mrkdwn", "text": f"{summary}"}
            })
            
            blocks.append({"type": "divider"})
            
            # 2. Beautiful Data View Feature (No JSON)
            if safe_rows:
                preview_count = min(5, len(safe_rows))
                preview_data = safe_rows[:preview_count]
                
                formatted_rows = []
                for row in preview_data:
                    row_items = [f"*{k}*: `{v}`" for k, v in row.items()]
                    formatted_rows.append(f"• {'  |  '.join(row_items)}")
                
                data_str = "\n".join(formatted_rows)
                
                blocks.append({
                    "type": "section",
                    "text": {"type": "mrkdwn", "text": f"*📊 Data Snapshot (Top {preview_count})*\n{data_str}"}
                })
            else:
                blocks.append({
                    "type": "context",
                    "elements": [{"type": "mrkdwn", "text": "📭 _No data returned_"}]
                })
                
            blocks.append({"type": "divider"})
            
            # 3. SQL Section
            sql_query = payload.get("sql", "")
            if sql_query:
                blocks.append({
                    "type": "section",
                    "text": {"type": "mrkdwn", "text": f"*🛠️ Synthesized SQL*\n```sql\n{sql_query}\n```"}
                })
            
            # 4. Trust & Context Section
            plan_steps = payload.get("plan", [])
            plan_text = " ➔ ".join(plan_steps) if plan_steps else "Direct execution"
            repaired_text = "⚠️ Self-Healed" if payload.get("repaired") else "✅ Verified"
            
            blocks.append({
                "type": "context",
                "elements": [
                    {"type": "mrkdwn", "text": f"*⚙️ Plan:* {plan_text}"},
                    {"type": "mrkdwn", "text": f"*Trust:* {repaired_text}"}
                ]
            })
            
            say(text="Vantage Insight Ready", blocks=blocks)
            print("✅ Reply sent successfully")
            
            # --- Optional Chart Generation ---
            try:
                if safe_rows and len(safe_rows) > 1:
                    import pandas as pd
                    df = pd.DataFrame(safe_rows)
                    num_cols = df.select_dtypes(include=["number"]).columns.tolist()
                    cat_cols = df.select_dtypes(exclude=["number", "datetime"]).columns.tolist()
                    
                    if num_cols and cat_cols:
                        import matplotlib
                        matplotlib.use("Agg")
                        import matplotlib.pyplot as plt
                        import seaborn as sns
                        
                        metric = num_cols[0]
                        dimension = cat_cols[0]
                        
                        df_agg = df.groupby(dimension)[metric].sum().reset_index().sort_values(by=metric, ascending=False).head(15)
                        
                        # Premium Cyberpunk Dark Theme
                        plt.style.use('dark_background')
                        fig, ax = plt.subplots(figsize=(10, 6), facecolor='#090d14')
                        ax.set_facecolor('#090d14')
                        
                        bars = sns.barplot(
                            data=df_agg, x=dimension, y=metric, 
                            ax=ax, hue=dimension, palette="cool", 
                            edgecolor='#00F0FF', linewidth=1.5, legend=False
                        )
                        
                        # Add value labels on top of bars
                        for p in bars.patches:
                            if p.get_height() > 0:
                                ax.annotate(f'{int(p.get_height()):,}', 
                                    (p.get_x() + p.get_width() / 2., p.get_height()), 
                                    ha='center', va='bottom', color='#e2e8f0', 
                                    fontweight='bold', fontsize=9,
                                    xytext=(0, 4), textcoords='offset points')
                                    
                        # Minimalist Neon Styling
                        plt.title(f"A N A L Y S I S  //  {metric.upper()} BY {dimension.upper()}", 
                                  fontsize=14, fontweight='900', color="#ffffff", pad=20)
                        plt.xlabel("")
                        plt.ylabel(metric.upper(), fontweight='bold', color="#64748b", labelpad=10)
                        
                        plt.xticks(rotation=45, ha='right', color='#94a3b8', fontsize=10)
                        plt.yticks(color='#94a3b8', fontsize=10)
                        
                        ax.grid(axis='y', color='#1e293b', linestyle='--', linewidth=0.5)
                        ax.spines['top'].set_visible(False)
                        ax.spines['right'].set_visible(False)
                        ax.spines['left'].set_color('#1e293b')
                        ax.spines['bottom'].set_color('#334155')
                        
                        plt.tight_layout()
                        
                        chart_path = "./vantage_chart.png"
                        plt.savefig(chart_path, dpi=150, bbox_inches='tight')
                        plt.close()
                        
                        app.client.files_upload_v2(
                            channel=event["channel"],
                            thread_ts=event.get("thread_ts"),
                            file=chart_path,
                            initial_comment="📊 *Visual Insight Generated*"
                        )
                        print("✅ Chart generated and uploaded successfully")
            except Exception as chart_err:
                print(f"⚠️ Could not generate chart: {chart_err}")
                
        except Exception as e:
            import traceback
            traceback.print_exc()
            say(f"⚠️ Oops, I hit an internal error: {e}")

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
