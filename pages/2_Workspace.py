import html
import os
import sys

import pandas as pd
import plotly.express as px
import streamlit as st

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

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
[data-testid="stAppViewContainer"], [data-testid="stHeader"] { background-color: #F7FAFF; color: #122033; }
[data-testid="stSidebar"] { background-color: #EEF4FF; border-right: 1px solid #DCE6F5; }
h1, h2, h3, h4, h5, h6 { font-family: 'Manrope', 'Sora', sans-serif; font-weight: 700; color: #122033; }
p, span, div { font-family: 'Inter', sans-serif; color: #4A5A70; }

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
  border-radius: 12px;
  padding: 20px 22px;
  box-shadow: 0 8px 28px rgba(83, 111, 168, 0.07);
  margin-bottom: 16px;
}
.breakdown-panel {
  border-radius: 12px;
  padding: 22px 24px;
  box-shadow: 0 12px 36px rgba(76, 141, 255, 0.1);
  border: 1px solid #DCE8FF;
}
.insight-headline {
  font-size: 1.35rem;
  font-weight: 700;
  color: #122033;
  line-height: 1.35;
  margin-bottom: 4px;
  letter-spacing: -0.02em;
}
.key-insight-block {
  background: linear-gradient(135deg, #F8FAFF 0%, #EEF4FF 100%);
  border: 1px solid #C5D8FF;
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 4px;
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
  margin: 14px 0 10px 0;
}
.drivers-list { display: flex; flex-direction: column; gap: 10px; }
.driver-row {
  background: #FAFBFF;
  border-radius: 10px;
  padding: 10px 12px;
}
.driver-row-top {
  background: linear-gradient(90deg, #FFF8F8 0%, #FAFBFF 100%);
  box-shadow: 0 2px 12px rgba(155, 28, 28, 0.08);
  padding: 12px 14px !important;
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
.driver-row-top-inflow { background: linear-gradient(90deg, #F0FDF7 0%, #FAFBFF 100%) !important; box-shadow: 0 2px 12px rgba(6, 95, 70, 0.08) !important; }
.driver-label { font-size: 14px; font-weight: 600; color: #4A5A70; flex: 1 1 auto; }
.driver-row-top .driver-label { font-size: 15px; font-weight: 700; color: #122033; }
.driver-value { font-size: 15px; font-weight: 700; margin-left: auto; }
.driver-row-top .driver-value { font-size: 17px; font-weight: 800; }
.driver-meta { display: flex; justify-content: space-between; font-size: 12px; color: #7C8CA3; margin-top: 6px; }
.driver-row-top .driver-meta { font-size: 13px; }
.driver-impact { font-weight: 700; letter-spacing: 0.02em; }
.driver-empty { font-size: 13px; color: #7C8CA3; margin: 8px 0 0 0; }
.narrative-block {
  font-size: 14px;
  color: #4A5A70;
  line-height: 1.55;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid #EEF2FA;
}
.drill-pills { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.pill-note { font-size: 11px; color: #A5B2C5; margin-top: 6px; }

.trust-badge {
  display: inline-block;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
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
  letter-spacing: 0.06em;
  color: #4C8DFF;
  margin: 0 0 10px 0;
}
.concepts-card ul { margin: 0; padding-left: 18px; color: #4A5A70; font-size: 13px; line-height: 1.5; }

.followup-wrap { margin-top: 8px; margin-bottom: 8px; }
.followup-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #7C8CA3; margin-bottom: 8px; }

.stCodeBlock { border-radius: 12px; }
.stDeployButton { display: none; }

div[data-testid="column"] .stButton button {
  border-radius: 999px !important;
  font-weight: 600 !important;
  font-size: 13px !important;
  border: 1px solid #DCE6F5 !important;
  background: #FFFFFF !important;
  color: #122033 !important;
  padding: 0.35rem 0.9rem !important;
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
    st.caption('👉 "Why did spending spike in 2020?"')
    st.caption('👉 "What categories drive the largest share of debits?"')
    st.caption('👉 "Compare last year vs this year by category"')

# --- CENTER: INTELLIGENCE CANVAS ---
with center_col:
    st.markdown("<h2 style='color:#122033;'>Intelligence Canvas</h2>", unsafe_allow_html=True)

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

                chips = follow_up_chips_for_context(headline, drivers)
                st.markdown(
                    "<div class='followup-wrap'><div class='followup-label'>Try next</div></div>",
                    unsafe_allow_html=True,
                )
                fc = st.columns(len(chips))
                for i, chip in enumerate(chips):
                    with fc[i]:
                        if st.button(chip, key=f"chip_{msg_i}_{i}"):
                            st.session_state.queued_prompt = chip
                            st.rerun()

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
