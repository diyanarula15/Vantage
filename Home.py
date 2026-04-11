import streamlit as st

st.set_page_config(page_title="Vantage | Home", page_icon="🧿", layout="wide", initial_sidebar_state="collapsed")

# Inject Bright Premium CSS
st.markdown("""
<style>
/* Bright Premium Vibe */
[data-testid="stAppViewContainer"], [data-testid="stHeader"] { background-color: #F7FAFF; color: #122033; }
[data-testid="stSidebar"] { background-color: #EEF4FF; border-right: 1px solid #DCE6F5; }

/* Typography */
h1, h2, h3, h4, h5, h6 { font-family: 'Manrope', 'Sora', sans-serif; font-weight: 700; color: #122033; }
p, span, div { font-family: 'Inter', sans-serif; color: #4A5A70; }

/* Buttons */
.stButton>button { background: linear-gradient(135deg, #4C8DFF 0%, #8A6CFF 100%); color: #FFFFFF; border-radius: 16px; font-weight: 600; border: none; transition: 0.3s; }
.stButton>button:hover { background: linear-gradient(135deg, #3C7CF2 0%, #7A5CE6 100%); color: white; transform: translateY(-1px); }

/* Insight Cards & Trust Panels */
.insight-card {
    background-color: #FFFFFF; border: 1px solid #E8EEF8; 
    border-radius: 24px; padding: 24px; box-shadow: 0 10px 30px rgba(83, 111, 168, 0.08); margin-bottom: 20px;
}
.insight-headline { font-size: 20px; font-weight: 700; color: #122033; margin-bottom: 8px; }

/* Hide Deploy btn */
.stDeployButton {display:none;}
</style>
""", unsafe_allow_html=True)

col1, col2, col3 = st.columns([1, 6, 1])
with col2:
    st.markdown("<h1 style='text-align: center; font-size: 3rem; margin-bottom: 0; color: #122033;'>Talk to your data.</h1>", unsafe_allow_html=True)
    st.markdown("<h3 style='text-align: center; color: #7C8CA3; font-weight: 400; margin-top: 0;'>Get verified answers, not dashboard chaos.</h3><br>", unsafe_allow_html=True)
    
    st.markdown("<div style='text-align: center; color: #4A5A70; margin-bottom: 40px;'>Vantage transforms your data into a structured intelligence layer with explainable, jargon-free insights.</div>", unsafe_allow_html=True)

    c1, c2, c3 = st.columns([1, 1, 1])
    with c2:
        if st.button("Start Onboarding", use_container_width=True):
            st.switch_page("pages/1_Onboarding.py")
    
    st.markdown("<br><br>", unsafe_allow_html=True)
    c1, c2, c3 = st.columns(3)
    with c1:
        st.markdown("<div class='insight-card'><h4 style='color:#122033;'>🧬 Understands Structure</h4><span style='color: #7C8CA3; font-size: 13px;'>Builds a context graph from tables, fields, and relationships instantly.</span></div>", unsafe_allow_html=True)
    with c2:
        st.markdown("<div class='insight-card'><h4 style='color:#122033;'>🩹 Self-Healing SQL</h4><span style='color: #7C8CA3; font-size: 13px;'>If a generated query fails, Vantage uses schema evidence to repair it.</span></div>", unsafe_allow_html=True)
    with c3:
        st.markdown("<div class='insight-card'><h4 style='color:#122033;'>💬 Explains Results</h4><span style='color: #7C8CA3; font-size: 13px;'>Every answer includes narrative, evidence, business meaning and privacy masking.</span></div>", unsafe_allow_html=True)
