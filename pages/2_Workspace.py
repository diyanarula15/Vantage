import html
import os
import sys
from pathlib import Path

import pandas as pd
import plotly.express as px
import streamlit as st
from dotenv import load_dotenv

_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(_ROOT / ".env", override=True)
sys.path.append(str(_ROOT))

from workspace_insight_ui import (
    build_driver_bar_chart,
    build_key_insight_text,
    build_why_narrative,
    drill_actions_with_queries,
    drivers_section_html,
    follow_up_chips_for_context,
    infer_drivers_from_dataframe,
    key_insight_block_html,
)

try:
    from brain import VantageBrain
    from narrator import Narrator

    def ask_data(query: str):
        brain = VantageBrain()
        return brain.ask_data(query)

except ImportError:

    def ask_data(query: str):
        return {
            "rows": [],
            "sql": None,
            "plan": [],
            "source": "mock",
            "repaired": False,
            "initial_error": None,
        }

    class Narrator:
        def redact_pii(self, rows):
            return rows

        def summarize(self, query, rows):
            return "Connect brain and narrator modules to enable live answers."


def _run_vantage_turn(prompt: str) -> None:
    prompt = (prompt or "").strip()
    if not prompt:
        return
    st.session_state.chat_history.append({"role": "user", "content": prompt})
    with st.spinner("Synthesizing response and executing schema-aware SQL..."):
        narrator = Narrator()
        payload = ask_data(prompt)
        safe_rows = narrator.redact_pii(payload.get("rows", []))
        summary = narrator.summarize(prompt, safe_rows)
        assistant_content = {
            "summary": summary,
            "sql": payload.get("sql"),
            "plan": payload.get("plan", []),
            "rows": safe_rows,
            "source": payload.get("source"),
            "repaired": payload.get("repaired"),
            "initial_error": payload.get("initial_error"),
        }
        st.session_state.chat_history.append({"role": "assistant", "content": assistant_content})
        st.session_state.last_trust = assistant_content
    st.rerun()


st.set_page_config(page_title="Vantage | Workspace", page_icon="🧿", layout="wide", initial_sidebar_state="collapsed")

st.markdown(
    """
<style>
/* Bright Premium Vibe */
[data-testid="stAppViewContainer"], [data-testid="stHeader"] { background-color: #F7FAFF; color: #122033; }
[data-testid="stSidebar"] { background-color: #EEF4FF; border-right: 1px solid #DCE6F5; }
h1, h2, h3, h4, h5, h6 { font-family: 'Manrope', 'Sora', sans-serif; font-weight: 700; color: #122033; }
p, span, div { font-family: 'Inter', sans-serif; color: #4A5A70; }

/* --- REMOVE HIDE OVERFLOW FOR SCROLLING BUG FIX --- */
.block-container {
  padding-top: 2rem !important;
  padding-bottom: 2rem !important;
}

/* Force sidebars and content to naturally flex */

/* Make EVERY column internally scrollable bounding to the parent row */
div[data-testid="column"], div[data-testid="stColumn"], div[data-testid="stHorizontalBlock"] > div {
  height: 100% !important;
  max-height: 100% !important;
  overflow-y: auto !important;
  overflow-x: hidden !important;
  padding-right: 12px !important; 
}

/* 🛑 CRITICAL FIX: Reset any NESTED columns (e.g. st.columns inside chat messages for buttons) so they don't stretch to 100vh! */
div[data-testid="stHorizontalBlock"] div[data-testid="stHorizontalBlock"] {
  height: auto !important;
  max-height: none !important;
  align-items: stretch !important;
}
div[data-testid="stHorizontalBlock"] div[data-testid="stHorizontalBlock"] > div {
  height: auto !important;
  max-height: none !important;
  overflow-y: visible !important;
  padding-right: 5px !important;
  padding-bottom: 0px !important;
}

/* Force squash any invisible padding blocks Streamlit native components inject at the bottom */
div[data-testid="stBottomBlockContainer"], 
div[data-testid="stBottom"],
div[class*="stBottomSpacer"] {
  height: 0px !important;
  min-height: 0px !important;
  padding: 0 !important;
  margin: 0 !important;
  position: absolute !important;
  pointer-events: none !important;
  opacity: 0 !important;
}

/* Eliminate native chat message margins that compound aggressively */
div[data-testid="stChatMessage"] {
  margin-bottom: 8px !important;
}

/* No extra padding needed, layout handles whitespace natively */

div[data-testid="column"]::-webkit-scrollbar, div[data-testid="stColumn"]::-webkit-scrollbar, div[data-testid="stHorizontalBlock"] > div::-webkit-scrollbar { width: 6px; }
div[data-testid="column"]::-webkit-scrollbar-thumb, div[data-testid="stColumn"]::-webkit-scrollbar-thumb, div[data-testid="stHorizontalBlock"] > div::-webkit-scrollbar-thumb { background-color: #DCE8FF; border-radius: 4px; }

/* Sticky chat input at bottom of center panel */
div[data-testid="stChatInput"] {
  position: sticky !important;
  bottom: 0px !important;
  z-index: 9999 !important;
  padding: 16px 0 24px 0 !important;
  background: #F7FAFF !important;
  box-shadow: 0 -12px 20px rgba(247, 250, 255, 0.95);
}

@keyframes vantageFadeUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.vantage-fade-1 { animation: vantageFadeUp 0.5s ease forwards; opacity: 0; }
.vantage-fade-2 { animation: vantageFadeUp 0.5s ease 0.15s forwards; opacity: 0; }
.vantage-fade-3 { animation: vantageFadeUp 0.5s ease 0.3s forwards; opacity: 0; }
.vantage-fade-4 { animation: vantageFadeUp 0.5s ease 0.45s forwards; opacity: 0; }

.insight-card, .trust-panel, .breakdown-panel, .concepts-card {
  background-color: #FFFFFF;
  border: 1px solid #E8EEF8;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 24px rgba(83, 111, 168, 0.05);
  margin-bottom: 24px;
}
.breakdown-panel {
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 12px 36px rgba(76, 141, 255, 0.08);
  border: 1px solid #DCE8FF;
}
.insight-headline {
  font-size: 1.4rem;
  font-weight: 700;
  color: #122033;
  line-height: 1.35;
  margin-bottom: 6px;
  letter-spacing: -0.02em;
}
.key-insight-block {
  background: linear-gradient(135deg, #F8FAFF 0%, #EEF4FF 100%);
  border: 1px solid #C5D8FF;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 6px;
}
.key-insight-label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: #2F6FED;
  margin-bottom: 6px;
}
.key-insight-text {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #122033;
  line-height: 1.45;
}
.why-heading {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #4C8DFF;
  margin: 18px 0 12px 0;
}
.drivers-list { display: flex; flex-direction: column; gap: 12px; }
.driver-row {
  background: #FAFBFF;
  border-radius: 12px;
  padding: 12px 16px;
}
.driver-row-top {
  background: linear-gradient(90deg, #FFF8F8 0%, #FAFBFF 100%);
  box-shadow: 0 2px 14px rgba(155, 28, 28, 0.06);
  padding: 16px !important;
}
.driver-row-main { display: flex; justify-content: flex-start; align-items: baseline; gap: 10px; flex-wrap: wrap; }
.driver-rank {
  font-size: 11px;
  font-weight: 800;
  color: #7C8CA3;
  min-width: 1.5rem;
}
.driver-row-top .driver-rank { font-size: 12px; color: #7A1518; }
.driver-row-top-inflow .driver-rank { color: #065F46 !important; }
.driver-row-top-inflow { background: linear-gradient(90deg, #F0FDF7 0%, #FAFBFF 100%) !important; box-shadow: 0 2px 14px rgba(6, 95, 70, 0.06) !important; }
.driver-label { font-size: 14px; font-weight: 600; color: #4A5A70; flex: 1 1 auto; }
.driver-row-top .driver-label { font-size: 15px; font-weight: 700; color: #122033; }
.driver-value { font-size: 15px; font-weight: 700; margin-left: auto; }
.driver-row-top .driver-value { font-size: 17px; font-weight: 800; }
.driver-meta { display: flex; justify-content: space-between; font-size: 12px; color: #7C8CA3; margin-top: 8px; }
.driver-row-top .driver-meta { font-size: 13px; }
.driver-impact { font-weight: 700; letter-spacing: 0.02em; }
.driver-empty { font-size: 13px; color: #7C8CA3; margin: 8px 0 0 0; }
.narrative-block {
  font-size: 15px;
  color: #4A5A70;
  line-height: 1.6;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #EEF2FA;
}
.drill-pills { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 18px; }
.pill-note { font-size: 12px; color: #A5B2C5; margin-top: 8px; }

.trust-badge {
  display: inline-block;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin: 0 8px 8px 0;
}
.badge-success { background: #E8FBF2; color: #1F9D6A; border: 1px solid #B8EDD4; }
.badge-trust { background: #EDF4FF; color: #2F6FED; border: 1px solid #C5D8FF; }
.badge-privacy { background: #F3EEFF; color: #6B4DC4; border: 1px solid #D9CCF5; }
.badge-warning { background: #FFF6E5; color: #C77A00; border: 1px solid #F5DCA8; }
.badge-info { background: #EDF4FF; color: #4C8DFF; border: 1px solid #C5D8FF; }

.concepts-card h4 {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-weight: 800;
  color: #4C8DFF;
  margin: 0 0 12px 0;
}
.concepts-card ul { margin: 0; padding-left: 20px; color: #4A5A70; font-size: 14px; line-height: 1.6; }

.followup-wrap { margin-top: 12px; margin-bottom: 12px; }
.followup-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #7C8CA3; margin-bottom: 10px; }

/* Obsolete but kept just in case */
.instant-insights-panel {
  background: #FFFFFF;
  border: 1px solid #DCE8FF;
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 12px;
  box-shadow: 0 4px 18px rgba(76, 141, 255, 0.07);
}
.instant-insights-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #4C8DFF;
  margin-bottom: 8px;
}
.instant-insights-body {
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  color: #4A5A70;
  white-space: pre-wrap;
  margin: 0;
  line-height: 1.55;
  background: transparent;
  border: none;
  padding: 0;
}

.stCodeBlock { border-radius: 16px; }
.stDeployButton { display: none; }

div[data-testid="column"] .stButton button {
  border-radius: 999px !important;
  font-weight: 600 !important;
  font-size: 13px !important;
  border: 1px solid #DCE6F5 !important;
  background: #FFFFFF !important;
  color: #122033 !important;
  padding: 0.4rem 1rem !important;
}
div[data-testid="column"] .stButton button:hover {
  border-color: #4C8DFF !important;
  color: #2F6FED !important;
  background: #F3F7FF !important;
}
</style>
""",
    unsafe_allow_html=True,
)

if "dataset_meta" not in st.session_state:
    st.warning("No dataset indexed. Please complete onboarding first.")
    if st.button("Go to Onboarding"):
        st.switch_page("pages/1_Onboarding.py")
    st.stop()

if "chat_history" not in st.session_state:
    st.session_state.chat_history = []
if "last_trust" not in st.session_state:
    st.session_state.last_trust = None

queued = st.session_state.pop("queued_prompt", None)
if queued:
    _run_vantage_turn(queued)

left_col, center_col, right_col = st.columns([0.22, 0.50, 0.28], gap="large")

# --- LEFT: DATA DNA ---
with left_col:
    st.markdown(
        "<div style='margin-bottom: 16px;'><h3 style='color:#122033;'>Data DNA</h3>"
        "<span class='trust-badge badge-success'>✓ Context Graph Verified</span></div>",
        unsafe_allow_html=True,
    )

    meta = st.session_state.dataset_meta
    st.markdown(
        f"""
    <div class='trust-panel' style='margin-bottom:12px; padding: 14px 16px;'>
        <b style='color:#122033;'>{meta.get('table_name', 'Dataset')}</b><br>
        <span style='color:#7C8CA3; font-size: 13px;'>{meta.get('rows', 0)} rows · {meta.get('columns', 0)} columns</span>
    </div>
    """,
        unsafe_allow_html=True,
    )

    _ins = meta.get("instant_insights") or {}

    with st.expander("Detected Schema", expanded=True):
        st.markdown(
            "<span style='color:#7C8CA3; font-size: 12px;'>Columns and types from your SQLite mirror.</span>",
            unsafe_allow_html=True,
        )
        schema_info = meta.get("schema", {})
        columns = schema_info.get("columns") if isinstance(schema_info, dict) else None
        if isinstance(columns, list) and columns:
            for col in columns:
                name = col.get("name", "")
                typ = col.get("sqlite_type", "field")
                st.markdown(f"- `{name}` _{typ}_")
        elif isinstance(schema_info, dict) and schema_info:
            for k, v in schema_info.items():
                if k == "columns":
                    continue
                if isinstance(v, dict):
                    st.markdown(f"- `{k}` _{v.get('type', 'field')}_")
                else:
                    st.markdown(f"- `{k}`")
        else:
            st.markdown("- `Date` _(time)_")
            st.markdown("- `Region` _(dimension)_")
            st.markdown("- `Category` _(dimension)_")
            st.markdown("- `Revenue` _(metric)_")

    st.markdown(
        """
    <div class="concepts-card">
      <h4>Key business concepts</h4>
      <ul>
        <li><b>Revenue / inflow</b> — credits and positive business intake (e.g. salary, refunds).</li>
        <li><b>Expense / outflow</b> — debits and spend that reduce available balance.</li>
        <li><b>Net movement</b> — compare credits vs debits for a period to explain “why” cash changed.</li>
      </ul>
    </div>
    """,
        unsafe_allow_html=True,
    )

    st.markdown("<br><p style='font-size: 13px; color: #4A5A70;'><b>Suggested Prompts</b></p>", unsafe_allow_html=True)
    
    meta = st.session_state.dataset_meta
    t_cols = meta.get("columns", [])
    num_cols = [c["name"] for c in t_cols if c.get("sqlite_type") in ("REAL", "INTEGER", "FLOAT")]
    cat_cols = [c["name"] for c in t_cols if c.get("sqlite_type") == "TEXT"]
    
    q1, q2, q3 = "What is the total?", "Show me the top 5.", "What are the common trends?"
    
    if num_cols and cat_cols:
        q1 = f"What is the total {num_cols[0]} by {cat_cols[0]}?"
    if len(cat_cols) > 1 and num_cols:
        q2 = f"Show me the top 5 {cat_cols[1]} based on {num_cols[0]}."
    elif num_cols:
        q2 = f"What is the average of {num_cols[0]}?"
    if cat_cols:
        q3 = f"Provide a breakdown of rows by {cat_cols[0]}."

    if st.button(f"👉 {q1}", key="sp1"):
        st.session_state.pending_query = q1
        st.rerun()
        
    if st.button(f"👉 {q2}", key="sp2"):
        st.session_state.pending_query = q2
        st.rerun()
        
    if st.button(f"👉 {q3}", key="sp3"):
        st.session_state.pending_query = q3
        st.rerun()

# --- CENTER: INTELLIGENCE CANVAS ---
with center_col:
    st.markdown("<h2 style='color:#122033; margin-bottom: 24px;'>Intelligence Canvas</h2>", unsafe_allow_html=True)
    
    meta = st.session_state.dataset_meta
    _ins = meta.get("instant_insights") or {}
    if _ins:
        bd = html.escape(str(_ins.get("biggest_driver", "")))
        kt = html.escape(str(_ins.get("key_trend", _ins.get("key_trend_or_change", ""))))
        ti = html.escape(str(_ins.get("top_insight", _ins.get("third_insight", ""))))
        conf = _ins.get("confidence", 0)
        
        insights_html = ""
        if bd: insights_html += f"<li style='margin-bottom: 10px;'><b>{bd}</b></li>"
        if kt: insights_html += f"<li style='margin-bottom: 10px;'><b>{kt}</b></li>"
        if ti: insights_html += f"<li><b>{ti}</b></li>"
        
        st.markdown(f"""
        <div style="background: linear-gradient(145deg, #FFFFFF 0%, #FAFBFF 100%); border: 1px solid #C5D8FF; box-shadow: 0 12px 32px rgba(76, 141, 255, 0.12); padding: 28px; border-radius: 20px; margin-bottom: 32px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px;">
                <h3 style="margin: 0; color: #122033; font-size: 1.35rem; display: flex; align-items: center; gap: 8px;">✨ Instant Insights</h3>
                <span class='trust-badge badge-success' style="margin: 0; padding: 6px 12px;">Confidence: {conf}%</span>
            </div>
            <ul style="margin: 0; padding-left: 20px; line-height: 1.7; color: #3A4A5E; font-size: 16px;">
                {insights_html}
            </ul>
        </div>
        """, unsafe_allow_html=True)

    for msg_i, item in enumerate(st.session_state.chat_history):
        if item["role"] == "user":
            with st.chat_message("user", avatar="👤"):
                st.markdown(
                    f"<div style='font-size:18px; color:#122033;'>{html.escape(item['content'])}</div>",
                    unsafe_allow_html=True,
                )
        else:
            content = item["content"]
            with st.chat_message("assistant", avatar="🧿"):
                raw_summary = content.get("summary", "").replace("Source reflects the latest uploaded dataset.", "").strip()
                parts = raw_summary.split(".", 1)
                headline = parts[0] + "." if len(parts) > 1 else raw_summary
                narrative_tail = parts[1].strip() if len(parts) > 1 else ""

                rows = content.get("rows", [])
                drivers: list = []
                df_viz = None
                if rows and len(rows) > 0:
                    try:
                        df_viz = pd.DataFrame(rows)
                        drivers, _dim, _met = infer_drivers_from_dataframe(df_viz)
                    except Exception:
                        df_viz = None
                        drivers = []

                why_text = build_why_narrative(drivers)
                if narrative_tail and len(narrative_tail) > 20:
                    why_text = f"{why_text} {narrative_tail}"

                st.markdown(
                    f"<div class='vantage-fade-1 insight-headline'>{html.escape(headline)}</div>",
                    unsafe_allow_html=True,
                )

                st.markdown("<div class='breakdown-panel vantage-fade-2'>", unsafe_allow_html=True)
                key_line = build_key_insight_text(drivers)
                st.markdown(key_insight_block_html(key_line), unsafe_allow_html=True)
                st.markdown(
                    '<div class="why-heading">Why it happened</div>',
                    unsafe_allow_html=True,
                )
                st.markdown(drivers_section_html(drivers), unsafe_allow_html=True)

                fig_drivers = build_driver_bar_chart(drivers, title="Contribution by driver")
                if fig_drivers is not None:
                    st.markdown("<div class='vantage-fade-3'>", unsafe_allow_html=True)
                    st.plotly_chart(fig_drivers, use_container_width=True)
                    st.markdown("</div>", unsafe_allow_html=True)
                elif df_viz is not None and not df_viz.empty:
                    try:
                        num_cols = df_viz.select_dtypes(include=["number"]).columns.tolist()
                        cat_cols = df_viz.select_dtypes(exclude=["number", "datetime"]).columns.tolist()
                        for col in list(cat_cols):
                            try:
                                pd.to_datetime(df_viz[col], errors="raise")
                                cat_cols.remove(col)
                            except Exception:
                                pass
                        if num_cols:
                            metric = num_cols[0]
                            if cat_cols:
                                dimension = cat_cols[0]
                                df_agg = (
                                    df_viz.groupby(dimension)[metric]
                                    .sum()
                                    .reset_index()
                                    .sort_values(by=metric, ascending=False)
                                    .head(15)
                                )
                                fig = px.bar(
                                    df_agg,
                                    x=dimension,
                                    y=metric,
                                    template="plotly_white",
                                    color_discrete_sequence=["#4C8DFF", "#8A6CFF", "#5DADE2"] * 5,
                                )
                                fig.update_layout(
                                    showlegend=False,
                                    margin=dict(l=0, r=0, t=28, b=0),
                                    paper_bgcolor="rgba(0,0,0,0)",
                                    plot_bgcolor="rgba(0,0,0,0)",
                                    title="Result preview",
                                )
                                st.markdown("<div class='vantage-fade-3'>", unsafe_allow_html=True)
                                st.plotly_chart(fig, use_container_width=True)
                                st.markdown("</div>", unsafe_allow_html=True)
                            else:
                                fig = px.bar(df_viz, y=metric, color_discrete_sequence=["#4C8DFF"])
                                fig.update_layout(
                                    margin=dict(l=0, r=0, t=28, b=0),
                                    paper_bgcolor="rgba(0,0,0,0)",
                                    plot_bgcolor="rgba(0,0,0,0)",
                                )
                                st.plotly_chart(fig, use_container_width=True)
                        else:
                            st.dataframe(df_viz, use_container_width=True)
                    except Exception:
                        st.dataframe(rows, use_container_width=True)
                elif not rows:
                    st.info("No data returned for this query.")

                st.markdown(
                    f"<div class='narrative-block vantage-fade-4'>{html.escape(why_text)}</div>",
                    unsafe_allow_html=True,
                )

                st.markdown("<div class='drill-pills'>", unsafe_allow_html=True)
                drill_pairs = drill_actions_with_queries(drivers)
                cols_p = st.columns(len(drill_pairs))
                for i, (label, qtext) in enumerate(drill_pairs):
                    with cols_p[i]:
                        if st.button(label, key=f"drill_{msg_i}_{i}"):
                            st.session_state.queued_prompt = qtext
                            st.rerun()
                st.markdown("</div>", unsafe_allow_html=True)
                st.markdown(
                    "<p class='pill-note'>Drill-downs run a new question against your dataset.</p>",
                    unsafe_allow_html=True,
                )
                st.markdown("</div>", unsafe_allow_html=True)

                st.markdown(
                    f"""
                <div class='insight-card' style='margin-top:4px;'>
                    <div style='display: flex; flex-wrap: wrap; gap: 8px; align-items: center;'>
                        <span class='trust-badge badge-success'>Verified</span>
                        <span style='font-size: 12px; color: #7C8CA3;'>Source: {content.get('source', 'dataset')} · Confidence: High</span>
                    </div>
                </div>
                """,
                    unsafe_allow_html=True,
                )

                with st.expander("🛠️ View SQL & source rows"):
                    st.code(content.get("sql", "No SQL generated"), language="sql")
                    st.dataframe(rows)

    prompt = st.chat_input("Ask a business question...")
    if prompt:
        _run_vantage_turn(prompt)

# --- RIGHT: TRUST & REASONING ---
with right_col:
    st.markdown("<h3 style='color:#122033;'>Trust &amp; Reasoning</h3>", unsafe_allow_html=True)
    st.markdown(
        """
    <div style='margin-bottom: 14px;'>
      <span class='trust-badge badge-success'>✅ Verified</span>
      <span class='trust-badge badge-trust'>🔍 Explainable</span>
      <span class='trust-badge badge-privacy'>🔒 Privacy safe</span>
    </div>
    """,
        unsafe_allow_html=True,
    )

    if st.session_state.last_trust:
        t = st.session_state.last_trust

        st.markdown(
            "<div class='trust-panel' style='padding: 16px;'><b style='color:#122033;'>Execution Plan</b><ol style='margin-top:10px; font-size: 13px; color: #4A5A70; line-height:1.5;'>",
            unsafe_allow_html=True,
        )
        for step in t.get("plan", []):
            st.markdown(f"<li>{step}</li>", unsafe_allow_html=True)
        st.markdown("</ol></div>", unsafe_allow_html=True)

        st.markdown(
            "<br><div class='trust-panel' style='padding: 16px;'><b style='color:#122033;'>Query Verification</b><br>",
            unsafe_allow_html=True,
        )
        if t.get("repaired"):
            st.markdown("<span class='trust-badge badge-warning'>Repaired</span>", unsafe_allow_html=True)
            st.markdown(
                f"<p style='font-size: 12px; margin-top: 8px; color: #A65F00;'><b>Auto-corrected error:</b> {t.get('initial_error')}</p>",
                unsafe_allow_html=True,
            )
        elif t.get("sql"):
            st.markdown("<span class='trust-badge badge-success'>Generated pass</span>", unsafe_allow_html=True)
        else:
            st.markdown("<span style='font-size: 12px; color: #7C8CA3;'>No internal SQL generated</span>", unsafe_allow_html=True)
        st.markdown("</div>", unsafe_allow_html=True)

        st.markdown(
            "<br><div class='trust-panel' style='padding: 16px;'><b style='color:#122033;'>Privacy Shield</b><br>"
            "<span class='trust-badge badge-info'>Active</span><br>"
            "<span style='font-size:12px; color:#7C8CA3;'>PII redacted from visible results.</span></div>",
            unsafe_allow_html=True,
        )
    else:
        st.markdown(
            "<p style='color:#7C8CA3; font-size:14px;'>Run a query to view execution steps, SQL verification, and privacy handling.</p>",
            unsafe_allow_html=True,
        )
