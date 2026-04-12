import streamlit as st
import os
import time
import sys

# Need to properly import the local modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
try:
    from ingestor import VantageIngestor
except ImportError:
    pass

st.set_page_config(page_title="Vantage | Onboarding", page_icon="🧩", layout="wide")

st.markdown("""
<style>
[data-testid="stAppViewContainer"], [data-testid="stHeader"] { background-color: #F7FAFF; color: #122033; }
[data-testid="stSidebar"] { background-color: #EEF4FF; border-right: 1px solid #DCE6F5; }
h1, h2, h3, h4, h5, h6 { font-family: 'Manrope', 'Sora', sans-serif; font-weight: 700; color: #122033; }
p, span, div { font-family: 'Inter', sans-serif; color: #4A5A70; }
.upload-card {
    background: #FFFFFF; border: 1px solid #E8EEF8; border-radius: 24px;
    padding: 40px; text-align: center; transition: all 0.3s ease;
    box-shadow: 0 10px 30px rgba(83, 111, 168, 0.08);
}
.upload-card:hover { border-color: #BDD4FF; box-shadow: 0 16px 40px rgba(76, 141, 255, 0.12); transform: translateY(-2px); }
.stButton>button { background: linear-gradient(135deg, #4C8DFF 0%, #8A6CFF 100%); color: #FFFFFF; border-radius: 16px; font-weight: 600; border: none; transition: 0.3s; }
.stDeployButton {display:none;}
</style>
""", unsafe_allow_html=True)

col1, col2, col3 = st.columns([1, 6, 1])
with col2:
    st.markdown("<h2 style='text-align: center; color:#122033;'>Dataset Onboarding</h2>", unsafe_allow_html=True)
    st.markdown("<p style='text-align: center; color:#7C8CA3;'>Upload your data. We handle the profiling, semantic indexing, and mapping.</p>", unsafe_allow_html=True)
    
    if "is_indexing" not in st.session_state:
        st.session_state.is_indexing = False
        
    if not st.session_state.is_indexing:
        uploader = st.file_uploader("Drop your dataset here", type=["csv", "xlsx", "xls"])
        
        if uploader:
            os.makedirs("./data/uploads", exist_ok=True)
            local_path = os.path.join("./data/uploads", uploader.name)
            with open(local_path, "wb") as f:
                f.write(uploader.getbuffer())
            st.session_state.uploaded_file_path = local_path
            
            if st.button("Generate Intelligence Layer", use_container_width=True):
                st.session_state.is_indexing = True
                st.rerun()
    else:
        progress = st.progress(0)
        status_text = st.empty()
        
        status_text.markdown("#### 1. Profiling columns & patterns 🔎")
        progress.progress(25)
        time.sleep(1)
        
        status_text.markdown("#### 2. Constructing the Context Graph 🕸️")
        progress.progress(50)
        time.sleep(1)
        
        status_text.markdown("#### 3. Defining Metric Dictionary & Semantic Index 🧠<br><span style='color:#7C8CA3; font-size:12px;'>Calling Cohere...</span>", unsafe_allow_html=True)
        
        try:
            ingestor = VantageIngestor()
            result = ingestor.ingest(st.session_state.uploaded_file_path)
            st.session_state.dataset_meta = result
            progress.progress(100)
            st.success("Your dataset is ready. Fields analyzed, metrics defined, and meanings indexed.")
            time.sleep(1.5)
            st.session_state.is_indexing = False
            st.switch_page("pages/2_Workspace.py")
        except Exception as e:
            st.error(f"Ingestion failed: {e}")
            if st.button("Retry Onboarding"):
                st.session_state.is_indexing = False
                st.rerun()