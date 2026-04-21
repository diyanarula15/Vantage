import React, { useRef, useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Bar, LineChart, Line, XAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip,
} from 'recharts';
import { RefreshCw, ArrowRight, Sparkles,  Zap, Shield, Search, UploadCloud, CheckCircle, AlertCircle, Database, TerminalSquare, Activity, Table } from 'lucide-react';
import axios from 'axios';
import { DatabaseConnector } from './Sections';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94], delay: i * 0.12 },
  }),
};

/* ── Cursor-reactive Glow ── */
function CursorGlow({ containerRef }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 80, damping: 30 });
  const springY = useSpring(y, { stiffness: 80, damping: 30 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onMove = (e) => {
      const rect = container.getBoundingClientRect();
      x.set(e.clientX - rect.left);
      y.set(e.clientY - rect.top);
    };
    container.addEventListener('mousemove', onMove);
    return () => container.removeEventListener('mousemove', onMove);
  }, [containerRef, x, y]);

  return (
    <motion.div
      className="absolute w-[600px] h-[600px] rounded-full pointer-events-none -z-10"
      style={{
        x: springX,
        y: springY,
        translateX: '-50%',
        translateY: '-50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
      }}
    />
  );
}



// Timeline Overlay Component for Visual Process Transparency
const TimelineOverlay = ({ status, isQuery = false, inline = false }) => {
  const [step, setStep] = React.useState(0);

  React.useEffect(() => {
    let timers = [];
    if (status !== 'idle' && status !== false) {
      if (isQuery) {
         timers = [
           setTimeout(() => setStep(1), 50),
           setTimeout(() => setStep(2), 100),
           setTimeout(() => setStep(3), 150),
         ];
      } else {
         timers = [
           setTimeout(() => setStep(1), 50),
           setTimeout(() => setStep(2), 100),
           setTimeout(() => setStep(3), 150),
         ];
      }
    } else {
       setStep(0);
    }
    return () => timers.forEach(clearTimeout);
  }, [status, isQuery]);

  const querySteps = [
    { title: "Parsing Instruction", subtitle: "Interpreting semantic intent into parameters..." },
    { title: "Executing Database Selection", subtitle: "Translating to valid syntax and extracting segments..." },
    { title: "Generating Projections", subtitle: "Rendering mathematical bounds and graph visualization..." },
    { title: "Finalizing Output", subtitle: "Structuring final answer for console..." }
  ];

  const genericSteps = [
    { title: "Indexing Raw Data", subtitle: "Validating columns and ingesting rows into engine..." },
    { title: "Mapping Dimensionality", subtitle: "Discovering relationships between entities..." },
    { title: "Establishing Knowledge Graph", subtitle: "Training primary semantic vector space..." },
    { title: "Connecting Analytical Model", subtitle: "Loading initial predictions into dashboard..." }
  ];

  const steps = isQuery ? querySteps : genericSteps;

  return (
    <div className={`${inline ? 'w-full py-4' : 'absolute inset-0 z-50 rounded-3xl overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] backdrop-blur-md border border-slate-700/80'} flex items-center justify-center bg-slate-900/95`}>
      {!inline && (
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-500 rounded-full blur-[80px]" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-fuchsia-500 rounded-full blur-[80px]" />
        </div>
      )}

      <motion.div 
        key={status}
        initial={{ scale: 0.9, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative z-10 flex flex-col w-full p-8"
      >
        <div className="flex items-center gap-3 mb-8">
           {isQuery ? <TerminalSquare className="text-indigo-400" size={20} /> : <Database className="text-emerald-400" size={20} />}
           <h2 className="text-xl font-bold text-white tracking-tight">
             {isQuery ? 'Querying Knowledge Graph' : 'Ingesting Dataset'}
           </h2>
        </div>

        <div className="relative pl-6">
          <div className="absolute top-2 bottom-2 left-[11px] w-0.5 bg-slate-800" />
          
          <div className="space-y-6">
            {steps.map((s, idx) => {
              const active = step === idx;
              const complete = step > idx;
              const pending = step < idx;

              return (
                <div key={idx} className={`relative flex gap-4 ${pending ? 'opacity-40' : 'opacity-100'}`}>
                  <div className="relative z-10 w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 bg-slate-900 shadow-sm border border-slate-700">
                    {complete ? (
                      <div className="w-5 h-5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] flex items-center justify-center text-white">
                         <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      </div>
                    ) : active ? (
                      <div className="w-5 h-5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                    ) : (
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                    )}
                  </div>
                  <div className="flex flex-col">
                     <span className={`text-sm font-semibold ${active ? 'text-indigo-300' : complete ? 'text-slate-100' : 'text-slate-400'}`}>
                       {s.title}
                     </span>
                     <span className="text-xs text-slate-400 font-medium">
                       {s.subtitle}
                     </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {!inline && (
          <div className="mt-8 text-slate-400 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest px-4 py-2 opacity-50">
            <Activity size={12} className="animate-pulse" /> Process Running...
          </div>
        )}
      </motion.div>
    </div>
  );
};

/* ── Hero Section ── */
export default function Hero() {
  const containerRef = useRef(null);
  
  // App State
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle | uploading | success | error
  const [query, setQuery] = useState('');
  const [chatStatus, setChatStatus] = useState('idle'); // idle | loading | success | error
  const [chatResponse, setChatResponse] = useState(null);
  const [chatError, setChatError] = useState('');
  const [simLoading, setSimLoading] = useState(false);
  const [simResult, setSimResult] = useState(null);
  const [simInstruction, setSimInstruction] = useState('');

  // Derive dynamic prompts from analytical chat response
  const getDynamicPrompts = () => {
    if (!chatResponse || !chatResponse.rows || chatResponse.rows.length === 0) {
      return {
        sim: "Decrease manufacturing cost by 5%",
        ask: "e.g., What was our highest selling region?"
      };
    }
    const firstRow = chatResponse.rows[0];
    const keys = Object.keys(firstRow);
    const numericKeys = keys.filter(k => typeof firstRow[k] === 'number');
    const textKeys = keys.filter(k => typeof firstRow[k] !== 'number');
    
    // Choose sensible fallback names
    const numCol = numericKeys.length > 0 ? numericKeys[0] : "Amount";
    const txtCol = textKeys.length > 0 ? textKeys[0] : "Category";
    
    // Generate context-aware prompts
    const simPrompt = `Increase ${numCol} by 20% for top ${txtCol}s`;
    const askPrompt = `e.g., Show me the total ${numCol} by ${txtCol}`;
    
    return { sim: simPrompt, ask: askPrompt };
  };

  const dynamicPrompts = getDynamicPrompts();

  const handleSimulate = async () => {
    if (!simInstruction.trim()) return;
    setSimLoading(true);
    setSimResult(null);
    try {
      const res = await axios.post('http://localhost:8000/api/simulate', {
        query: query || "What are the total sales across categories?",
        scenario_instruction: simInstruction
      });
      setSimResult(res.data);
    } catch (e) {
      console.error(e);
      setSimResult({ error: 'Failed to run simulation. Ensure the backend is active and dataset is mapped.' });
    } finally {
      setSimLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    setUploadStatus('uploading');
    setChatStatus('idle'); // Prevent rendering before upload completes
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    try {
      await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // After successful upload, immediately fetch the initial contextual analysis
      setChatStatus('loading'); // Begin loading state immediately for the chat stream
      setUploadStatus('preparing');
      setChatError('');

      try {
        const initialQuery = "Give me a high-level summary of what this entire dataset is about and what specific information it contains. Explain the most important metrics or categories concisely. Make sure to query the data using an SQL GROUP BY statement for the most significant category so we can visualize its distribution.";
        const firstAnalysis = await axios.post('/api/chat', { query: initialQuery }, { timeout: 180000 });
        setChatResponse(firstAnalysis.data);
        setChatStatus('success');
        setUploadStatus('success');
        
      } catch (analyzeErr) {
        console.error("Could not fetch initial analysis", analyzeErr);
        setChatStatus('error');
        setUploadStatus('error');
        setChatError(analyzeErr.response?.data?.detail || analyzeErr.message || 'Unable to fetch initial analysis.');
        
      }
    } catch (err) {
      console.error(err);
      setUploadStatus('error');
      setChatStatus('error');
      setChatError(err.response?.data?.detail || err.message || 'Upload failed.');
      
    }
  };

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setChatStatus('loading');
    setChatError('');
    try {
      const res = await axios.post('/api/chat', { query }, { timeout: 180000 });
      setChatResponse(res.data);
      setChatStatus('success');
    } catch (err) {
      console.error(err);
      setChatStatus('error');
      setChatError(err.response?.data?.detail || err.message || 'Unable to process your question.');
    }
  };

  const handleSuggestedAsk = async (q) => {
    setQuery(q);
    setChatStatus('loading');
    setChatError('');
    try {
      const res = await axios.post('/api/chat', { query: q }, { timeout: 180000 });
      setChatResponse(res.data);
      setChatStatus('success');
    } catch (err) {
      console.error(err);
      setChatStatus('error');
      setChatError(err.response?.data?.detail || err.message || 'Unable to process your question.');
    }
  };

  return (
    <section ref={containerRef} className="relative pt-16 md:pt-24 pb-16 px-6 overflow-hidden">
      <div className="absolute inset-0 -z-20">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[700px] bg-gradient-to-b from-indigo-50/60 via-violet-50/30 to-transparent rounded-[50%] blur-3xl" />
        <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-cyan-50/40 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[300px] bg-violet-50/30 rounded-full blur-[80px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, #4f46e5 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>
      <CursorGlow containerRef={containerRef} />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12">
        
        {/* Left Side: Copy & Input Forms */}
        <motion.div initial="hidden" animate="visible" className="max-w-2xl pt-4">
          <div className="flex justify-between items-start mb-6">
              <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50/80 border border-indigo-100 text-indigo-600 text-sm font-medium mb-0 backdrop-blur-sm">
                <Sparkles size={14} />
                Live Product Demo
              </motion.div>
              
              <AnimatePresence>
              {(uploadStatus !== 'idle') && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => {
                    setFile(null);
                    setUploadStatus('idle');
                    setChatStatus('idle');
                    setChatResponse(null);
                    setChatError(null);
                    setSimResult(null);
                    setQuery('');
                  }}
                  className="px-4 py-1.5 bg-slate-900 shadow-md hover:bg-slate-800 active:bg-gradient-to-r active:from-indigo-600 active:via-violet-600 active:to-cyan-500 active:border-transparent text-white font-semibold rounded-full transition-all flex items-center justify-center gap-2 text-xs border border-slate-700 hover:shadow-lg ml-auto"
                >
                  <RefreshCw size={14} className="hover:animate-spin" /> Start Over
                </motion.button>
              )}
              </AnimatePresence>
            </div>

          <motion.h1 variants={fadeUp} custom={1} className="text-4xl sm:text-5xl md:text-6xl lg:text-[68px] font-extrabold tracking-tight leading-[1.08] mb-6">
            Insights at the{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500">
              speed of thought.
            </span>
          </motion.h1>

          <motion.p variants={fadeUp} custom={2} className="text-lg md:text-xl text-slate-600 mb-8 leading-relaxed max-w-lg">
            Experience it right here. Upload any CSV/Excel file, and ask questions in plain English. No SQL required.
          </motion.p>

          <motion.div variants={fadeUp} custom={3} className="space-y-6">
            
            {/* Step 1: Upload or What-If */}
            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-slate-200/60 shadow-lg shadow-slate-200/50 transition-all duration-500 relative overflow-hidden">
              {uploadStatus === 'success' ? (
                <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                       <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">✨</span>
                       What-If Prediction Sandbox
                    </h3>

                  </div>
                  
                  <p className="text-sm text-slate-500 mb-4">Simulate variables to instantly see predictive impacts on your dataset:</p>

                  {!simLoading && !simResult && (
                    <div className="flex flex-col gap-3">
                      <div className="relative">
                        <input 
                          placeholder={`e.g. ${dynamicPrompts.sim}`} 
                          value={simInstruction}
                          onChange={(e) => setSimInstruction(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSimulate()}
                          className="w-full pl-4 pr-24 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white shadow-sm"
                        />
                        <button 
                          onClick={handleSimulate}
                          disabled={!simInstruction.trim()}
                          className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-indigo-600 disabled:bg-slate-300 disabled:text-slate-500 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
                        >
                          Simulate
                        </button>
                      </div>
                    </div>
                  )}

                  {simLoading && (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="flex gap-2 mb-3">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wider">Modeling Alternative Realities...</p>
                    </div>
                  )}

                  {simResult && !simLoading && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 mt-2">
                       <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl border border-emerald-100 flex items-start gap-2 shadow-sm">
                         <CheckCircle size={16} className="flex-shrink-0 mt-0.5 text-emerald-500" />
                         <p className="text-sm font-medium leading-snug">{simResult.answer || simResult.error}</p>
                       </div>
                       
                       {simResult.rows && simResult.rows.length > 0 && (
                          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm h-64 mt-4">
                             <div className="flex justify-end gap-4 mb-2 pr-2">
                               <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-300"></div><span className="text-[10px] uppercase font-bold text-slate-500">Original</span></div>
                               <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-500"></div><span className="text-[10px] uppercase font-bold text-indigo-600">Simulated</span></div>
                             </div>
                             <ResponsiveContainer width="100%" height="85%">
                               <LineChart data={
                                 simResult.rows.slice(0, 15).map((row) => {
                                    const catKey = Object.keys(row)[0];
                                    const valKey = Object.keys(row)[1];
                                    let origVal = 0;
                                    if (chatResponse && chatResponse.rows && chatResponse.rows.length > 0) {
                                      const origCatKey = Object.keys(chatResponse.rows[0])[0];
                                      const origValKey = Object.keys(chatResponse.rows[0])[1];
                                      const matchedOrigRow = chatResponse.rows.find(r => String(r[origCatKey]) === String(row[catKey]));
                                      if (matchedOrigRow) {
                                        origVal = matchedOrigRow[origValKey];
                                      }
                                    }
                                    return {
                                      category: row[catKey],
                                      original: origVal || 0,
                                      simulated: row[valKey] || 0
                                    };
                                 })
                               }>
                                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                 <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                                 <RechartsTooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                                 <Line type="monotone" dataKey="original" stroke="#cbd5e1" strokeWidth={2} dot={{r: 3, strokeWidth: 2}} activeDot={{r: 5}} animationDuration={1500} />
                                 <Line type="monotone" dataKey="simulated" stroke="#8b5cf6" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} animationDuration={1500} />
                               </LineChart>
                             </ResponsiveContainer>
                          </div>
                        )}
                       
                       <button
                         onClick={() => { setSimResult(null); setSimInstruction(''); }}
                         className="text-xs font-medium text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-lg transition-colors border border-slate-200 w-max mx-auto mt-2"
                       >
                         Try another scenario
                       </button>
                    </motion.div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">1</span>
                      Upload your data
                    </h3>
                    {uploadStatus === 'error' && (
                      <span className="text-rose-500 text-sm font-medium flex items-center gap-1"><AlertCircle size={14}/> Error</span>
                    )}
                  </div>
                  
                  <label className={`block w-full border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                    uploadStatus === 'success' ? 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50' : 
                    'border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/30'
                  }`}>
                    <input type="file" className="hidden" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} />
                    <div className="flex flex-col items-center gap-3">
                      {uploadStatus === 'uploading' ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                          <Zap size={32} className="text-indigo-500" />
                        </motion.div>
                      ) : (
                        <UploadCloud size={32} className={uploadStatus === 'success' ? 'text-emerald-500' : 'text-indigo-500'} />
                      )}
                      <span className="text-base font-semibold text-slate-700">
                        {uploadStatus === 'uploading' ? 'Analyzing and indexing...' : 
                         'Select CSV or Excel to upload'}
                      </span>
                      <span className="text-xs text-slate-500">Drag and drop also not supported in this mockup :)</span>
                    </div>
                  </label>
                  

                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200/60 mb-12">
                <DatabaseConnector compact />
              </div>

              

              

          </motion.div>
        </motion.div>

        {/* Right Side: Output Window */}
        <div className="relative">
          <AnimatePresence>
            {(uploadStatus === 'uploading' || uploadStatus === 'preparing') && <TimelineOverlay status={uploadStatus} />}
          </AnimatePresence>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="bg-white rounded-3xl border border-slate-200/80 shadow-2xl shadow-slate-200/50 overflow-hidden min-h-[400px] h-full flex flex-col"
          >
            {/* Window Header */}
            <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-slate-300" />
                <div className="w-3 h-3 rounded-full bg-slate-300" />
                <div className="w-3 h-3 rounded-full bg-slate-300" />
              </div>
              <div className="font-medium text-xs text-slate-500 flex items-center gap-1.5 ml-2">
                <Database size={12} /> Live Console
              </div>
            </div>

            {/* Output Area */}
            <div className="p-6 pb-28 flex-1 bg-[linear-gradient(to_bottom,#f8fafc,#ffffff)] overflow-y-auto overflow-x-hidden break-words">
              {chatStatus === 'idle' && !chatResponse && uploadStatus === 'uploading' ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}>
                      <Sparkles size={32} className="text-slate-400 mb-3" />
                  </motion.div>
                  <p className="text-sm font-medium text-slate-500">Generating initial insights...</p>
                </div>
              ) : chatStatus === 'idle' && !chatResponse && (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                  <Sparkles size={32} className="text-slate-400 mb-3" />
                  <p className="text-sm font-medium text-slate-500">Your insights will appear here.</p>
                </div>
              )}

              {chatStatus === 'loading' && (
                <TimelineOverlay status={chatStatus} isQuery={true} inline={true} />
              )}

              {chatStatus === 'success' && chatResponse && (
                <AnimatePresence>
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 flex flex-col h-full w-full min-w-0">
                    {/* Answer Bubble */}
                    <div className="flex gap-3 flex-shrink-0">
                      <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Zap size={14} className="text-white" />
                      </div>
                      <div className="flex-1 space-y-3 min-w-0">
                        <div className="text-sm text-slate-800 leading-relaxed font-medium whitespace-pre-wrap break-words">
                          {chatResponse.answer}
                        </div>
                        
                        {/* Dynamic Questions (Always show a few quick follow-ups to explore the data further) */}
                        {chatResponse.follow_up_questions && chatResponse.follow_up_questions.length > 0 && (
                          <div className="pt-4 border-t border-slate-100 pb-2 flex flex-col gap-3">
                            <p className="text-xs font-semibold text-slate-500 flex items-center gap-1"><Sparkles size={12}/> SUGGESTED QUESTIONS</p>
                            <div className="flex flex-wrap gap-2">
                              {chatResponse.follow_up_questions.map((q, idx) => (
                                <button key={idx} onClick={() => setQuery(q)} className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition-colors border border-indigo-100 font-medium whitespace-normal text-left break-words max-w-full">
                                  {q}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Optional Error / Confidence warning */}
                        {chatResponse.data_quality?.confidence && (
                          <div className={`text-xs flex items-center gap-1.5 px-2 py-1 rounded inline-flex border ${chatResponse.data_quality.confidence < 80 ? 'text-amber-600 bg-amber-50 border-amber-100' : 'text-emerald-600 bg-emerald-50 border-emerald-100'}`}>
                            {chatResponse.data_quality.confidence < 80 ? <AlertCircle size={12} /> : <CheckCircle size={12}/>} Confidence: {chatResponse.data_quality.confidence}%
                          </div>
                        )}
                      </div>
                    </div>
                    



                    {/* Rows Debug Output & Auto-Generated Chart */}
                                         {chatResponse.rows?.length > 0 && (
                        <div className="pl-11 pb-4 flex-shrink-0 space-y-4 w-full overflow-hidden max-w-full">
                          
                          {/* Auto-Generated Visual */}
                          {Object.keys(chatResponse.rows[0]).length >= 2 && (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 h-64">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chatResponse.rows.slice(0, 10)}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                  <XAxis 
                                    dataKey={Object.keys(chatResponse.rows[0])[0]} 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 10, fill: '#64748b'}} 
                                  />
                                  <RechartsTooltip 
                                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                  />
                                  <Bar 
                                    dataKey={Object.keys(chatResponse.rows[0])[1]} 
                                    fill="url(#colorQueries)" 
                                    radius={[4, 4, 0, 0]} 
                                    animationDuration={1500}
                                  />
                                  <defs>
                                    <linearGradient id="colorQueries" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.9}/>
                                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.9}/>
                                    </linearGradient>
                                  </defs>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          )}

                          <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 border-b border-slate-100">
                              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 flex items-center gap-1.5">
                                <Table size={12} /> Raw Output Preview
                              </span>
                              <span className="text-[10px] text-indigo-500 font-bold bg-indigo-50 px-2 py-0.5 rounded flex items-center gap-1"><Shield size={10} /> PII Privacy Shield Active</span>
                            </div>
                            <div className="p-2 overflow-x-auto">
                              <table className="w-full text-left text-xs whitespace-nowrap">
                                <thead className="bg-slate-50 text-slate-500">
                                  <tr>
                                    {Object.keys(chatResponse.rows[0]).map(key => (
                                      <th key={key} className="px-3 py-1.5 font-medium">{key}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {chatResponse.rows.map((row, i) => (
                                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                                      {Object.values(row).map((val, j) => (
                                        <td key={j} className="px-3 py-1.5 text-slate-600">{String(val)}</td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                )}

              {chatStatus === 'error' && (
                <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 text-rose-700 text-sm space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={18} className="flex-shrink-0 mt-1" />
                    <p>An error occurred mapping or interpreting your data. Please check your file or try another question.</p>
                  </div>
                  {chatError && (
                    <div className="rounded-2xl bg-white border border-rose-200 px-3 py-2 text-rose-700 text-xs whitespace-pre-wrap">
                      {chatError}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    
      {/* Floating Ask Box */}
      <AnimatePresence>
        {uploadStatus === 'success' && (
          <motion.div 
            style={{ x: "-50%" }}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-8 left-1/2 w-[95%] md:w-[900px] z-[100]"
          >
            <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-3 border border-slate-200 shadow-2xl shadow-indigo-500/20">
              <form onSubmit={handleAsk} className="relative flex">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Search className="h-6 w-6 text-indigo-500" />
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={dynamicPrompts.ask}
                  className="block w-full pl-14 pr-44 py-5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium placeholder-slate-400 shadow-inner"
                  disabled={chatStatus === 'loading'}
                />
                <button
                  type="submit"
                  disabled={!query.trim() || chatStatus === 'loading'}
                  className="absolute inset-y-2 right-2 px-10 bg-indigo-600 text-white rounded-xl text-base font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-md hover:shadow-lg active:scale-95"
                >
                  {chatStatus === 'loading' ? 'Thinking...' : 'Ask Anything'} <ArrowRight size={18} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>


  );
}