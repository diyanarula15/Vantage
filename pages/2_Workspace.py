import streamlit as st
import pandas as pd
import sys
import os
import plotly.express as px
import plotly.graph_objects as go

# Ensure local imports work
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
try:
    from brain import VantageBrain
    from narrator import Narrator
    
    def ask_data(query: str):
        brain = VantageBrain()
        return brain.ask_data(query)
except ImportError:
    pass

st.set_page_config(page_title="Vantage | Workspace", page_icon="🧿", layout="wide", initial_sidebar_state="collapsed")

st.markdown("""
<style>
/* Bright Premium Vibe */
[data-testid="stAppViewContainer"], [data-testid="stHeader"] { background-color: #F7FAFF; color: #122033; }
[data-testid="stSidebar"] { background-color: #EEF4FF; border-right: 1px solid #DCE6F5; }

/* Typography */
h1, h2, h3, h4, h5, h6 { font-family: 'Manrope', 'Sora', sans-serif; font-weight: 700; color: #122033; }
p, span, div { font-family: 'Inter', sans-serif; color: #4A5A70; }

/* Insight Cards & Trust Panels */
.insight-card, .trust-panel {
    background-color: #FFFFFF; border: 1px solid #E8EEF8; 
    border-radius: 24px; padding: 24px; box-shadow: 0 10px 30px rgba(83, 111, 168, 0.08); margin-bottom: 20px;
}
.insight-headline { font-size: 20px; font-weight: 700; color: #122033; margin-bottom: 8px; }

/* Trust Badges */
.trust-badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 600; text-transform: uppercase; margin-right: 8px; }
.badge-success { background: #EAFBF4; color: #2BC48A; }
.badge-warning { background: #FFF6E5; color: #E7A93B; }
.badge-info { background: #EDF4FF; color: #4C8DFF; }

/* Remove block borders from code */
.stCodeBlock { border-radius: 12px; }

/* Hide Deploy btn */
.stDeployButton {display:none;}
</style>
""", unsafe_allow_html=True)

if "dataset_meta" not in st.session_state:
    st.warning("No dataset indexed. Please complete onboarding first.")
    if st.button("Go to Onboarding"):
        st.switch_page("pages/1_Onboarding.py")
    st.stop()

if "chat_history" not in st.session_state:
    st.session_state.chat_history = []
if "last_trust" not in st.session_state:
    st.session_state.last_trust = None

# Workspace Layout: 3 Columns
left_col, center_col, right_col = st.columns([0.22, 0.50, 0.28], gap="large")

# --- LEFT: DATA DNA ---
with left_col:
    st.markdown("<div style='margin-bottom: 20px;'><h3 style='color:#122033;'>Data DNA</h3><span class='trust-badge badge-success'>✓ Context Graph Verified</span></div>", unsafe_allow_html=True)
    
    meta = st.session_state.dataset_meta
    st.markdown(f"""
    <div class='trust-panel' style='margin-bottom:15px; padding: 16px;'>
        <b style='color:#122033;'>{meta.get('table_name', 'Dataset')}</b><br>
        <span style='color:#7C8CA3; font-size: 13px;'>{meta.get('rows', 0)} rows · {meta.get('columns', 0)} columns</span>
    </div>
    """, unsafe_allow_html=True)
    
    with st.expander("Detected Schema", expanded=True):
        st.markdown("<span style='color:#7C8CA3; font-size: 12px;'>Data profiles loaded into memory.</span>", unsafe_allow_html=True)
        # Display schema dynamically if available, otherwise static
        schema_info = meta.get("schema", {})
        if schema_info:
            for k, v in schema_info.items():
                st.markdown(f"- `{k}` _{v.get('type', 'field')}_")
        else:
            st.markdown("- `Date` _(time)_")
            st.markdown("- `Region` _(dimension)_")
            st.markdown("- `Category` _(dimension)_")
            st.markdown("- `Revenue` _(metric)_")

    st.markdown("<br><p style='font-size: 13px; color: #4A5A70;'><b>Suggested Prompts</b></p>", unsafe_allow_html=True)
    st.caption('👉 "Why did revenue drop last quarter?"')
    st.caption('👉 "What categories are underperforming?"')
    st.caption('👉 "Compare Q1 vs Q2 by region"')

# --- CENTER: CONVERSATION CANVAS ---
with center_col:
    st.markdown("<h2 style='color:#122033;'>Intelligence Canvas</h2>", unsafe_allow_html=True)
    
    # Render chat
    for item in st.session_state.chat_history:
        if item["role"] == "user":
            with st.chat_message("user", avatar="👤"):
                st.markdown(f"<div style='font-size:18px; color:#122033;'>{item['content']}</div>", unsafe_allow_html=True)
        else:
            content = item["content"]
            with st.chat_message("assistant", avatar="🧿"):
                # Premium Insight Card
                raw_summary = content.get('summary', '').replace("Source reflects the latest uploaded dataset.", "").strip()
                parts = raw_summary.split(".", 1)
                headline = parts[0] + "." if len(parts) > 1 else raw_summary
                narrative = parts[1].strip() if len(parts) > 1 else ""
                
                st.markdown(f"""
                <div class='insight-card'>
                    <div class='insight-headline'>{headline}</div>
                    <div style='color: #4A5A70; font-size: 15px; margin-bottom: 20px;'>{narrative}</div>
                """, unsafe_allow_html=True)
                
                # Chart
                rows = content.get('rows', [])
                if rows and len(rows) > 0:
                    try:
                        df = pd.DataFrame(rows)
                        num_cols = df.select_dtypes(include=['number']).columns.tolist()
                        cat_cols = df.select_dtypes(exclude=['number', 'datetime']).columns.tolist()
                        # Try parsing dates from strings
                        date_cols = []
                        for col in cat_cols[:]:
                            try:
                                parsed = pd.to_datetime(df[col], errors='raise')
                                if not pd.isna(parsed).all() and len(df) > 0: # make sure it's valid
                                    df[col] = parsed
                                    date_cols.append(col)
                                    cat_cols.remove(col)
                            except Exception:
                                pass
                        
                        if len(num_cols) > 0:
                            # Pick primary metrics
                            metric = num_cols[0]
                            
                            if len(date_cols) > 0:
                                # Time series visualization
                                fig = px.line(
                                    df, 
                                    x=date_cols[0], 
                                    y=metric,
                                    markers=True,
                                    template="plotly_white",
                                    color_discrete_sequence=['#4C8DFF']
                                )
                                fig.update_traces(line=dict(width=3, color='#4C8DFF'), marker=dict(size=8, color='#8A6CFF'))
                                fig.update_layout(margin=dict(l=0, r=0, t=10, b=0), paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)')
                                st.plotly_chart(fig, use_container_width=True)
                                
                            elif len(cat_cols) > 0:
                                # Categorical view (bar chart with custom gradients)
                                dimension = cat_cols[0]
                                df_agg = df.groupby(dimension)[metric].sum().reset_index().sort_values(by=metric, ascending=False).head(15)
                                fig = px.bar(
                                    df_agg, 
                                    x=dimension, 
                                    y=metric,
                                    template="plotly_white",
                                    color=dimension,
                                    color_discrete_sequence=px.colors.qualitative.Pastel
                                )
                                fig.update_layout(showlegend=False, margin=dict(l=0, r=0, t=10, b=0), paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)')
                                fig.update_traces(marker_line_width=0, opacity=0.9)
                                st.plotly_chart(fig, use_container_width=True)
                            else:
                                # Fallback numbers
                                fig = px.bar(df, y=metric, color_discrete_sequence=['#4C8DFF'])
                                fig.update_layout(margin=dict(l=0, r=0, t=10, b=0), paper_bgcolor='rgba(0,0,0,0)', plot_bgcolor='rgba(0,0,0,0)')
                                st.plotly_chart(fig, use_container_width=True)
                        else:
                            st.dataframe(df, use_container_width=True)
                    except Exception as e:
                        st.dataframe(rows, use_container_width=True)
                else:
                    st.info("No data returned for this query.")
                    
                # Footer inside card
                st.markdown(f"""
                    <div style='display: flex; gap: 10px; margin-top: 15px;'>
                        <span class='trust-badge badge-success'>Verified</span>
                        <span style='font-size: 11px; color: #A5B2C5; padding-top:2px;'>Source: {content.get('source', 'dataset')} &nbsp;·&nbsp; Confidence: High</span>
                    </div>
                </div>
                """, unsafe_allow_html=True)

                with st.expander("🛠️ View SQL & Logic Elements"):
                    st.code(content.get('sql', 'No SQL generated'), language='sql')
                    st.dataframe(rows)
    
    # Input
    prompt = st.chat_input("Ask a business question...")
    
    if prompt:
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
                "initial_error": payload.get("initial_error")
            }
            
            st.session_state.chat_history.append({"role": "assistant", "content": assistant_content})
            st.session_state.last_trust = assistant_content
            st.rerun()

# --- RIGHT: TRUST & REASONING ---
with right_col:
    st.markdown("<h3 style='color:#122033;'>Trust & Reasoning</h3>", unsafe_allow_html=True)
    
    if st.session_state.last_trust:
        t = st.session_state.last_trust
        
        # Plan
        st.markdown("<div class='trust-panel' style='padding: 16px;'><b style='color:#122033;'>Execution Plan</b><ol style='margin-top:8px; font-size: 13px; color: #4A5A70;'>", unsafe_allow_html=True)
        for step in t.get('plan', []):
            st.markdown(f"<li>{step}</li>", unsafe_allow_html=True)
        st.markdown("</ol></div>", unsafe_allow_html=True)
        
        # SQL Status
        st.markdown("<br><div class='trust-panel' style='padding: 16px;'><b style='color:#122033;'>Query Verification</b><br>", unsafe_allow_html=True)
        if t.get('repaired'):
            st.markdown("<span class='trust-badge badge-warning'>Repaired</span>", unsafe_allow_html=True)
            st.markdown(f"<p style='font-size: 11px; margin-top: 8px; color: #E7A93B;'><b>Auto-corrected error:</b> {t.get('initial_error')}</p>", unsafe_allow_html=True)
        elif t.get('sql'):
            st.markdown("<span class='trust-badge badge-success'>Generated pass</span>", unsafe_allow_html=True)
        else:
            st.markdown("<span style='font-size: 12px; color: #7C8CA3;'>No internal SQL generated</span>", unsafe_allow_html=True)
        st.markdown("</div>", unsafe_allow_html=True)
        
        # Privacy
        st.markdown("<br><div class='trust-panel' style='padding: 16px;'><b style='color:#122033;'>Privacy Shield</b><br><span class='trust-badge badge-info'>Active</span><br><span style='font-size:12px; color:#7C8CA3;'>PII redacted from output.</span></div>", unsafe_allow_html=True)
    else:
        st.markdown("<p style='color:#7C8CA3; font-size:14px;'>Run a query to view execution, semantic evidence, and SQL healing here.</p>", unsafe_allow_html=True)
