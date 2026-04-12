import React, { useRef, useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip,
} from 'recharts';
import { ArrowRight, Sparkles, Zap, Shield, Search, UploadCloud, CheckCircle, AlertCircle, Database, TerminalSquare, Table } from 'lucide-react';
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
      setUploadStatus('success');
      setChatStatus('loading'); // Begin loading state immediately for the chat stream
      setChatError('');

      try {
        const initialQuery = "Give me a high-level summary of what this entire dataset is about and what specific information it contains. Explain the most important metrics or categories concisely. Make sure to query the data using an SQL GROUP BY statement for the most significant category so we can visualize its distribution.";
        const firstAnalysis = await axios.post('/api/chat', { query: initialQuery }, { timeout: 180000 });
        setChatResponse(firstAnalysis.data);
        setChatStatus('success');
      } catch (analyzeErr) {
        console.error("Could not fetch initial analysis", analyzeErr);
        setChatStatus('error');
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
          <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50/80 border border-indigo-100 text-indigo-600 text-sm font-medium mb-6 backdrop-blur-sm">
            <Sparkles size={14} />
            Live Product Demo
          </motion.div>

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
            {/* Step 1: Upload */}
            <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-slate-200/60 shadow-lg shadow-slate-200/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">1</span>
                  Upload your data
                </h3>
                {uploadStatus === 'success' && (
                  <span className="text-emerald-600 text-sm font-medium flex items-center gap-1"><CheckCircle size={14}/> Indexed</span>
                )}
                {uploadStatus === 'error' && (
                  <span className="text-rose-500 text-sm font-medium flex items-center gap-1"><AlertCircle size={14}/> Error</span>
                )}
              </div>
              
              <label className={`block w-full border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                uploadStatus === 'success' ? 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50' : 
                'border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/30'
              }`}>
                <input type="file" className="hidden" accept=".csv,.xlsx,.xls" onChange={handleFileUpload} />
                <div className="flex flex-col items-center gap-2">
                  {uploadStatus === 'uploading' ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                      <Zap size={24} className="text-indigo-500" />
                    </motion.div>
                  ) : (
                    <UploadCloud size={24} className={uploadStatus === 'success' ? 'text-emerald-500' : 'text-indigo-500'} />
                  )}
                  <span className="text-sm font-medium text-slate-600">
                    {uploadStatus === 'uploading' ? 'Analyzing and indexing semantics...' : 
                     uploadStatus === 'success' ? `Uploaded: ${file?.name}` : 
                     'Click to upload CSV or Excel'}
                  </span>
                </div>
              </label>

              <div className="mt-6 pt-6 border-t border-slate-200">
                <DatabaseConnector compact />
              </div>
            </div>

            {/* Step 2: Search Bar */}
            <div className={`transition-opacity duration-500 ${uploadStatus === 'success' ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-slate-200/60 shadow-lg shadow-slate-200/50">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">2</span>
                  Ask anything
                </h3>
                <form onSubmit={handleAsk} className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g., What was our highest selling region?"
                    className="block w-full pl-11 pr-32 py-4 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                    disabled={chatStatus === 'loading'}
                  />
                  <button
                    type="submit"
                    disabled={!query.trim() || chatStatus === 'loading'}
                    className="absolute inset-y-1.5 right-1.5 px-4 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    {chatStatus === 'loading' ? 'Thinking...' : 'Ask'} <ArrowRight size={14} />
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Right Side: Output Window */}
        <div className="relative">
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
            <div className="p-6 flex-1 bg-[linear-gradient(to_bottom,#f8fafc,#ffffff)] overflow-y-auto">
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
                <div className="space-y-4">
                  <div className="flex gap-3 animate-pulse">
                    <div className="w-8 h-8 rounded bg-slate-200 flex-shrink-0" />
                    <div className="h-8 bg-slate-200 rounded w-1/3" />
                  </div>
                  <div className="pl-11 space-y-2">
                    <div className="h-4 bg-slate-100 rounded w-full" />
                    <div className="h-4 bg-slate-100 rounded w-4/5" />
                    <div className="h-24 bg-slate-50 rounded mt-4" />
                  </div>
                </div>
              )}

              {chatStatus === 'success' && chatResponse && (
                <AnimatePresence>
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 flex flex-col h-full">
                    {/* Answer Bubble */}
                    <div className="flex gap-3 flex-shrink-0">
                      <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Zap size={14} className="text-white" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div className="text-sm text-slate-800 leading-relaxed font-medium whitespace-pre-wrap">
                          {chatResponse.answer}
                        </div>
                        
                        {/* Dynamic Questions (Always show a few quick follow-ups to explore the data further) */}
                        <div className="pt-4 border-t border-slate-100 pb-2 flex flex-col gap-3">
                          <p className="text-xs font-semibold text-slate-500 flex items-center gap-1"><Sparkles size={12}/> SUGGESTED QUESTIONS</p>
                          <div className="flex flex-wrap gap-2">
                            <button onClick={() => handleSuggestedAsk("What is the highest value segment?")} className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full hover:bg-indigo-100 transition-colors border border-indigo-100 font-medium whitespace-nowrap">What is the highest value segment?</button>
                            <button onClick={() => handleSuggestedAsk("Break this down by category.")} className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full hover:bg-indigo-100 transition-colors border border-indigo-100 font-medium whitespace-nowrap">Break this down by category.</button>
                            <button onClick={() => handleSuggestedAsk("Show me the raw data.")} className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full hover:bg-indigo-100 transition-colors border border-indigo-100 font-medium whitespace-nowrap">Show me the raw data.</button>
                          </div>
                        </div>
                        
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
                      <div className="pl-11 pb-4 flex-shrink-0 space-y-4">
                        
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
    </section>
  );
}