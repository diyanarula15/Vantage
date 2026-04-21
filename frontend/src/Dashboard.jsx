import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Database, Code, CheckCircle, AlertTriangle, Command, TableProperties, UploadCloud, FileSpreadsheet, X, LayoutDashboard, FlaskConical, TrendingUp } from 'lucide-react';
import Plot from 'react-plotly.js';
import axios from 'axios';
import { VoiceWidget } from './landing/VoiceWidget';

// Fancy Interactive Overlay for Uploading/Indexing

// Premium Timeline Overlay — animated ring, live timer, shimmer steps
const TimelineOverlay = ({ status, isQuery = false, inline = false }) => {
  const [step, setStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  // Live elapsed-time counter
  useEffect(() => {
    if (status === false) { setElapsed(0); return; }
    const interval = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [status]);

  // Step auto-advance
  useEffect(() => {
    let timers = [];
    if (status !== false) {
      if (isQuery) {
        timers = [
          setTimeout(() => setStep(1), 600),
          setTimeout(() => setStep(2), 1800),
          setTimeout(() => setStep(3), 3200),
        ];
      } else {
        timers = [
          setTimeout(() => setStep(1), 1000),
          setTimeout(() => setStep(2), 2800),
          setTimeout(() => setStep(3), 5000),
        ];
      }
    } else {
      setStep(0);
    }
    return () => timers.forEach(clearTimeout);
  }, [status, isQuery]);

  const querySteps = [
    { icon: "🔍", title: "Semantic Parsing",       subtitle: "Translating natural language into analytical intent..." },
    { icon: "⚡", title: "SQL Synthesis",           subtitle: "Generating optimised SQLite query against your schema..." },
    { icon: "📊", title: "Parallel Visualisation", subtitle: "Building Plotly config and running PII redaction..." },
    { icon: "✨", title: "Narrative Generation",    subtitle: "Composing data-driven insights and follow-up questions..." },
  ];

  const uploadSteps = [
    { icon: "📂", title: "Indexing Raw Data",          subtitle: "Parsing columns and writing rows to the engine..." },
    { icon: "🕸️", title: "Building Knowledge Graph",  subtitle: "Mapping semantic relationships between entities..." },
    { icon: "🧠", title: "Generating Metric Library", subtitle: "Embedding SQL formulas into vector space..." },
    { icon: "🚀", title: "Activating Intelligence",   subtitle: "Wiring AI model to your personalised workspace..." },
  ];

  const steps    = isQuery ? querySteps : uploadSteps;
  const accent   = isQuery ? "indigo" : "emerald";
  const ringFrom = isQuery ? "#6366f1" : "#10b981";
  const ringTo   = isQuery ? "#a855f7" : "#06b6d4";

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`;

  if (inline) {
    return (
      <div className="w-full max-w-xl mx-auto py-5 px-5 bg-white rounded-2xl shadow-sm border border-slate-200 my-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-6 h-6 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
          <span className="text-sm font-semibold text-slate-700">{steps[step]?.title}</span>
          <span className="ml-auto font-mono text-xs text-slate-400">{formatTime(elapsed)}</span>
        </div>
        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
            animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>
        <p className="text-xs text-slate-400 mt-2">{steps[step]?.subtitle}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      style={{ background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(14px)" }}
    >
      {/* Ambient blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-[140px]"
          style={{ background: ringFrom + "55" }}
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-[120px]"
          style={{ background: ringTo + "44" }}
        />
      </div>

      {/* Card */}
      <motion.div
        initial={{ scale: 0.88, opacity: 0, y: 28 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="relative z-10 w-full max-w-md mx-4 rounded-3xl overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.97)",
          boxShadow: `0 32px 80px -12px ${ringFrom}55, 0 0 0 1px rgba(255,255,255,0.6)`,
        }}
      >
        {/* Top gradient bar */}
        <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${ringFrom}, ${ringTo})` }} />

        <div className="p-8">
          {/* Header with orbiting ring */}
          <div className="flex items-center gap-4 mb-8">
            <div className="relative w-12 h-12 flex-shrink-0">
              {/* Outer spinning ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                className="absolute inset-0 rounded-full border-2 border-transparent"
                style={{ borderTopColor: ringFrom, borderRightColor: ringTo }}
              />
              {/* Inner icon */}
              <div className="absolute inset-1.5 rounded-full flex items-center justify-center text-lg"
                style={{ background: `linear-gradient(135deg, ${ringFrom}22, ${ringTo}22)` }}>
                {isQuery ? "⚡" : "🧠"}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">
                {isQuery ? "AI is thinking…" : "Creating your workspace"}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                {isQuery ? "Running parallel analysis pipeline" : "Parallel ingestion & knowledge graph generation"}
              </p>
            </div>
            <span className="font-mono text-sm font-semibold px-3 py-1 rounded-full"
              style={{ background: `${ringFrom}15`, color: ringFrom }}>
              {formatTime(elapsed)}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1.5">
              <span>PROGRESS</span>
              <span>{Math.round(((step + 1) / steps.length) * 100)}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                style={{ background: `linear-gradient(90deg, ${ringFrom}, ${ringTo})` }}
              />
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            {steps.map((s, idx) => {
              const active   = step === idx;
              const complete = step > idx;
              const pending  = step < idx;

              return (
                <motion.div
                  key={idx}
                  initial={false}
                  animate={{ opacity: pending ? 0.35 : 1 }}
                  transition={{ duration: 0.3 }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                    active ? "shadow-sm" : ""
                  }`}
                  style={active ? {
                    background: `linear-gradient(135deg, ${ringFrom}12, ${ringTo}08)`,
                    border: `1px solid ${ringFrom}25`
                  } : {
                    border: "1px solid transparent"
                  }}
                >
                  {/* Status indicator */}
                  <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
                    {complete ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-5 h-5 rounded-full flex items-center justify-center bg-emerald-500 text-white"
                        style={{ boxShadow: "0 0 10px rgba(16,185,129,0.4)" }}
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </motion.div>
                    ) : active ? (
                      <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                        style={{ borderColor: `${ringFrom}44`, borderTopColor: ringFrom }} />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-slate-200 mx-auto" />
                    )}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-semibold truncate ${
                      active ? "text-slate-900" : complete ? "text-slate-500" : "text-slate-400"
                    }`}>
                      <span className="mr-1.5">{s.icon}</span>{s.title}
                    </div>
                    {active && (
                      <motion.p
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-slate-400 mt-0.5 truncate"
                      >
                        {s.subtitle}
                      </motion.p>
                    )}
                  </div>

                  {complete && (
                    <span className="text-[10px] font-mono text-emerald-500 flex-shrink-0">done</span>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-6 flex items-center justify-center gap-2 text-[10px] font-mono text-slate-300 uppercase tracking-widest">
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: ringFrom }}
            />
            vantage intelligence engine
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function Dashboard() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [metadata, setMetadata] = useState(null);
  
  // upload state: false, 'uploading', 'preparing'
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat', 'schema', 'prediction'
  const endRef = useRef(null);

  // Prediction Tab State
  const [simQuery, setSimQuery] = useState('');
  const [simInstruction, setSimInstruction] = useState('');
  const [simLoading, setSimLoading] = useState(false);
  const [simResult, setSimResult] = useState(null);

  const fetchMetadata = async () => {
    try {
      const res = await axios.get('http://localhost:8000/api/metadata');
      if (res.data && res.data.schema) {
        setMetadata(res.data);
      }
    } catch (e) {
      console.log('No metadata available yet');
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    
    setShowUploadModal(false);
    setIsUploading('uploading');
    
    try {
      await axios.post('http://localhost:8000/api/upload', formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 600000, // 10 minutes — ingestion can take a while for large files
      });
      setIsUploading('preparing');
      
      try {
        const initialQuery = "Give me a high-level summary of what this dataset is about. Identify the most important metric and query it so we can visualize its distribution.";
        
        // Execute both API calls in parallel to reduce loading speed by 50%
        const [_, firstAnalysis] = await Promise.all([
          fetchMetadata(),
          axios.post('http://localhost:8000/api/chat', { query: initialQuery })
        ]);
        
        setActiveTab('chat');
        const { answer, sql, data_quality, plotly_config, rows, follow_up_questions } = firstAnalysis.data;
        
        setMessages([{
          role: 'assistant',
          content: answer,
          sql,
          plotly_config,
          data_quality,
          rows,
          follow_up_questions: follow_up_questions || ["What is the primary trend in the data?", "Forecast the next 3 months", "Identify any anomalies."]
        }]);
      } catch (err) {
        console.error("Initial analysis failed:", err);
        setMessages([{
          role: 'assistant',
          content: "Successfully uploaded and indexed " + file.name + ", but could not generate the initial summary.",
          follow_up_questions: ["What is the primary trend in the data?", "Forecast the next 3 months", "Identify any anomalies."]
        }]);
      }
      
      setTimeout(() => setIsUploading(false), 2000);
    } catch (error) {
      alert("Failed to upload file");
      setTimeout(() => setIsUploading(false), 2000);
    }
  };

  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => scrollToBottom(), [messages]);

  const handleSend = async (textQ = query) => {
    if (!textQ.trim()) return;
    
    const userMsg = { role: 'user', content: textQ };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const res = await axios.post('http://localhost:8000/api/chat', { query: textQ });
      const { answer, sql, data_quality, plotly_config, rows, follow_up_questions } = res.data;
      
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: answer,
        sql,
        plotly_config,
        data_quality,
        rows,
        follow_up_questions
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Error: Could not reach the Vantage API. Ensure backend is running.', 
        isError: true 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleVoice = (transcript) => {
    if (transcript && transcript.trim()) {
      handleSend(transcript.trim());
    }
  };

  const handleSimulate = async (e) => {
    e.preventDefault();
    if (!simInstruction.trim()) return;

    setSimLoading(true);
    setSimResult(null);

    try {
      const res = await axios.post('http://localhost:8000/api/simulate', { 
        query: simQuery,
        scenario_instruction: simInstruction
      });
      setSimResult(res.data);
    } catch (err) {
      console.error(err);
      alert('Simulation failed. Ensure your base query is valid.');
    } finally {
      setSimLoading(false);
    }
  };

  // Generate truly dynamic simulation suggestions based on actual uploaded data columns
  const getDynamicPredictions = () => {
    if (!metadata || !metadata.schema || !metadata.schema.columns) {
      return ["Upload a dataset first to get intelligent scenario suggestions."];
    }

    const columns = metadata.schema.columns;
    const colNames = columns.map(c => c.name);
    const colNamesLower = colNames.map(n => n.toLowerCase());
    const numericCols = columns.filter(c => c.sqlite_type === 'INTEGER' || c.sqlite_type === 'REAL').map(c => c.name);
    const textCols = columns.filter(c => c.sqlite_type === 'TEXT').map(c => c.name);

    // Helper: find columns whose name contains any of the keywords
    const findCols = (keywords) => numericCols.filter(n => keywords.some(kw => n.toLowerCase().includes(kw)));

    const revenueCols = findCols(['revenue', 'sales', 'income', 'earning', 'amount', 'total']);
    const costCols    = findCols(['cost', 'expense', 'spend', 'cogs']);
    const priceCols   = findCols(['price', 'rate', 'fee', 'charge', 'mrp']);
    const qtyCols     = findCols(['quantity', 'qty', 'units', 'volume', 'count', 'orders']);
    const marginCols  = findCols(['margin', 'profit', 'markup', 'roi', 'ebitda']);
    const discountCols = findCols(['discount', 'rebate', 'off', 'promo']);
    const categoryCols = textCols.filter(n => ['category', 'segment', 'region', 'product', 'channel', 'type', 'group', 'department', 'brand'].some(kw => n.toLowerCase().includes(kw)));

    const suggestions = [];

    // Revenue / sales scenarios
    if (revenueCols.length > 0) {
      suggestions.push(`What if ${revenueCols[0]} increases by 20% across all segments?`);
      suggestions.push(`Simulate a 15% decline in ${revenueCols[0]} due to market downturn.`);
    }

    // Price scenarios
    if (priceCols.length > 0) {
      suggestions.push(`What if we raise ${priceCols[0]} by 10% — how does total revenue change?`);
      suggestions.push(`Simulate dropping ${priceCols[0]} by 8% to drive higher volume.`);
    }

    // Cost / expense scenarios
    if (costCols.length > 0) {
      suggestions.push(`What if we cut ${costCols[0]} by 12% through operational efficiency?`);
    }

    // Quantity scenarios
    if (qtyCols.length > 0 && suggestions.length < 5) {
      suggestions.push(`Simulate a 30% surge in ${qtyCols[0]} from a viral marketing campaign.`);
    }

    // Margin / profit scenarios
    if (marginCols.length > 0 && suggestions.length < 5) {
      suggestions.push(`What if ${marginCols[0]} improves by 5 percentage points?`);
    }

    // Discount scenarios
    if (discountCols.length > 0 && suggestions.length < 5) {
      suggestions.push(`What if we double ${discountCols[0]} during the holiday season?`);
    }

    // Category-based scenario
    if (categoryCols.length > 0 && suggestions.length < 5) {
      suggestions.push(`What if the top ${categoryCols[0]} grows 25% while others stay flat?`);
    }

    // Fallback with actual column names (never generic)
    if (suggestions.length === 0 && numericCols.length > 0) {
      suggestions.push(`What if ${numericCols[0]} increases by 20%?`);
      if (numericCols.length > 1) {
        suggestions.push(`Simulate a 10% drop in ${numericCols[1]}.`);
      }
    }

    // Also auto-set the base query to something relevant
    return suggestions.length > 0 ? suggestions : [`Explore how changes in ${colNames[0] || 'key metrics'} affect outcomes.`];
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* FULL SCREEN INDEXING OVERLAY */}
      <AnimatePresence>
        {isUploading && <TimelineOverlay status={isUploading} />}
      </AnimatePresence>

      {/* Sidebar */}
      <div className="w-64 bg-slate-900 flex-shrink-0 text-slate-300 p-6 hidden md:flex flex-col border-r border-slate-800 z-20 shadow-xl overflow-y-auto">
        <div className="flex items-center gap-2 text-white font-bold text-xl mb-8">
          <img src="/logo.png" alt="Vantage" className="w-6 h-6 object-contain drop-shadow-md" /> Vantage
        </div>
        
        <div className="flex flex-col gap-2 mb-6">
          <button 
            onClick={() => setActiveTab('chat')} 
            className={`flex items-center gap-2 p-3 rounded-xl transition-all ${activeTab === 'chat' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}
          >
            <LayoutDashboard size={16} className={activeTab === 'chat' ? 'text-white' : 'text-slate-400'} />
            <span className="text-sm font-medium">Analytics Agent</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('prediction')} 
            className={`flex items-center gap-2 p-3 rounded-xl transition-all ${activeTab === 'prediction' ? 'bg-fuchsia-600 text-white' : 'hover:bg-slate-800'}`}
          >
            <FlaskConical size={16} className={activeTab === 'prediction' ? 'text-white' : 'text-fuchsia-400'} />
            <span className="text-sm font-medium">What-If Simulation</span>
          </button>

          <button 
            onClick={() => setActiveTab('schema')} 
            className={`flex items-center gap-2 p-3 rounded-xl transition-all ${activeTab === 'schema' ? 'bg-slate-700 text-white' : 'hover:bg-slate-800'}`}
          >
            <Database size={16} className={activeTab === 'schema' ? 'text-emerald-400' : 'text-slate-400'} />
            <span className="text-sm font-medium">Data Dictionary</span>
          </button>
        </div>

        <div className="mt-auto">
          <button 
            onClick={() => setShowUploadModal(true)}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 p-3 rounded-xl transition-colors text-sm font-medium shadow-sm"
          >
            <UploadCloud size={16} /> New Dataset
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col h-full bg-white relative overflow-hidden">
        {/* Header */}
        <div className="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-white/80 backdrop-blur-sm z-10">
          <h2 className="font-semibold text-slate-800">
            {activeTab === 'chat' ? 'Analytics Agent' : activeTab === 'schema' ? 'Data Dictionary' : 'Simulation Engine'}
          </h2>
          {metadata && metadata.table_name && (
            <span className="text-xs bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full border border-emerald-100 font-medium">
              Active: {metadata.table_name} ({metadata.row_count?.toLocaleString()} rows)
            </span>
          )}
        </div>

        {/* Global tab navigation so users always see the prediction box */}
        <div className="flex bg-slate-50 border-b border-slate-200 shrink-0">
          <button 
            onClick={() => setActiveTab('chat')} 
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'chat' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'text-slate-500 hover:bg-slate-100 border-b-2 border-transparent'}`}
          >
            Analytics Agent
          </button>
          <button 
            onClick={() => setActiveTab('prediction')} 
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'prediction' ? 'text-fuchsia-600 border-b-2 border-fuchsia-600 bg-white' : 'text-slate-500 hover:bg-slate-100 border-b-2 border-transparent'}`}
          >
            What-If Projections (New!)
          </button>
          <button 
            onClick={() => setActiveTab('schema')} 
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === 'schema' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-white' : 'text-slate-500 hover:bg-slate-100 border-b-2 border-transparent'}`}
          >
            Data Dictionary
          </button>
        </div>

        {activeTab === 'schema' ? (
          // Schema / Data Dictionary View
          <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
            {metadata && metadata.schema ? (
              <div className="max-w-4xl mx-auto">
                <div className="mb-6 flex gap-8">
                   <div>
                     <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Source Table</p>
                     <p className="text-xl font-bold text-slate-800">{metadata.table_name || metadata.primary_table}</p>
                   </div>
                   <div>
                     <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Dimensions</p>
                     <p className="text-xl font-bold text-slate-800">{metadata.column_count || '?'}</p>
                   </div>
                   <div>
                     <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Records</p>
                     <p className="text-xl font-bold text-slate-800">{metadata.row_count?.toLocaleString() || '?'}</p>
                   </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 font-semibold text-slate-700 text-sm">Indexed Schema & Ontology</div>
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/50 text-xs text-slate-500 uppercase tracking-wider">
                        <th className="px-6 py-3 font-medium">Column Name</th>
                        <th className="px-6 py-3 font-medium">Data Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {(metadata.schema.columns || []).map((col, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-3 font-medium text-slate-800">{col.name}</td>
                          <td className="px-6 py-3"><span className="bg-slate-100 text-slate-600 px-2 py-1 rounded font-mono text-xs border border-slate-200">{col.sqlite_type}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Database size={48} className="text-slate-200 mb-4" />
                <p>No dataset indexed yet. Upload a CSV to view schema.</p>
                <button onClick={() => setShowUploadModal(true)} className="mt-4 text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-colors font-medium shadow-sm">
                  Upload file now
                </button>
              </div>
            )}
          </div>
        ) : activeTab === 'prediction' ? (
          // Simulation / Prediction View
          <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/50">
            <div className="max-w-5xl mx-auto flex flex-col gap-6">
              
              {/* Simulation Input Card */}
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-fuchsia-100 to-indigo-100 flex items-center justify-center border border-fuchsia-200/50">
                    <FlaskConical className="text-fuchsia-600" size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight">What-If Simulation Engine</h3>
                    <p className="text-slate-400 text-xs font-medium">Model scenarios against your live data and compare outcomes</p>
                  </div>
                </div>

                <form onSubmit={handleSimulate} className="flex flex-col gap-4 mt-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                       <label className="text-xs font-semibold text-slate-500 uppercase ml-1 mb-1.5 block">Base Metric Query</label>
                       <input 
                         className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-fuchsia-500 focus:ring-fuchsia-100 transition-all font-medium text-slate-800" 
                         value={simQuery}
                         onChange={e => setSimQuery(e.target.value)}
                         placeholder={metadata?.schema?.columns ? `e.g. Show total ${(metadata.schema.columns.find(c => c.sqlite_type === 'INTEGER' || c.sqlite_type === 'REAL') || {name: 'metric'}).name}` : 'e.g. Total Revenue'}
                       />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase ml-1 mb-1.5 block flex items-center justify-between">
                       Scenario Instruction
                       <span className="text-[10px] text-fuchsia-600 font-normal tracking-normal normal-case flex items-center gap-1 cursor-pointer hover:underline" onClick={() => setSimInstruction(getDynamicPredictions()[0])}>
                         <TrendingUp size={12} /> Auto-suggest from my data
                       </span>
                    </label>
                    <textarea 
                      className="w-full min-h-[72px] bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-fuchsia-500 focus:ring-fuchsia-100 resize-none font-medium text-slate-800" 
                      value={simInstruction}
                      onChange={e => setSimInstruction(e.target.value)}
                      placeholder={metadata?.schema?.columns ? `e.g. ${getDynamicPredictions()[0]}` : "e.g. What if we drop prices by 15%?"}
                    />
                  </div>

                  {/* Dynamic suggestion chips */}
                  <div className="flex flex-wrap gap-2">
                     {getDynamicPredictions().map((pred, i) => (
                       <button
                         key={i}
                         type="button"
                         onClick={() => setSimInstruction(pred)}
                         className="text-xs px-3 py-1.5 bg-fuchsia-50 text-fuchsia-700 rounded-full border border-fuchsia-100 hover:bg-fuchsia-100 hover:border-fuchsia-200 transition-all"
                       >
                         {pred}
                       </button>
                     ))}
                  </div>

                  <button
                    type="submit"
                    disabled={simLoading || !simInstruction.trim() || !simQuery.trim()}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white font-bold transition-all shadow-lg shadow-fuchsia-500/20 disabled:opacity-40 disabled:shadow-none"
                  >
                    {simLoading ? 'Running Simulation...' : '⚡ Run What-If Projection'}
                  </button>
                </form>
              </div>

              {/* Loading State */}
              {simLoading && (
                <div className="bg-white rounded-3xl p-12 shadow-sm border border-slate-200 flex flex-col items-center justify-center min-h-[280px]">
                  <div className="relative w-16 h-16 mb-6">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                      className="absolute inset-0 rounded-full border-2 border-transparent"
                      style={{ borderTopColor: '#d946ef', borderRightColor: '#6366f1' }}
                    />
                    <div className="absolute inset-2 rounded-full bg-gradient-to-br from-fuchsia-50 to-indigo-50 flex items-center justify-center text-xl">🧪</div>
                  </div>
                  <p className="text-slate-600 font-semibold text-sm">Modelling scenario against your data...</p>
                  <p className="text-slate-400 text-xs mt-1">Cloning dataset → Applying mutations → Querying outcomes</p>
                </div>
              )}

              {/* Results */}
              {!simLoading && simResult && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-6"
                >
                  {/* AI Insight Card */}
                  <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle size={18} className="text-emerald-500" />
                      <h4 className="font-bold text-lg text-slate-800">Simulation Complete</h4>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed">{simResult.answer}</p>

                    {/* Delta Insight Cards — compute from simulated rows */}
                    {simResult.rows && simResult.rows.length > 0 && (() => {
                      const keys = Object.keys(simResult.rows[0]);
                      const numericKeys = keys.filter(k => typeof simResult.rows[0][k] === 'number');
                      return numericKeys.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
                          {numericKeys.slice(0, 4).map(key => {
                            const values = simResult.rows.map(r => Number(r[key]) || 0);
                            const total = values.reduce((a, b) => a + b, 0);
                            const avg = total / values.length;
                            return (
                              <div key={key} className="bg-gradient-to-br from-slate-50 to-fuchsia-50/30 rounded-xl p-4 border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{key}</p>
                                <p className="text-xl font-bold text-slate-800 mt-1">
                                  {total >= 1000 ? `${(total/1000).toFixed(1)}K` : total.toFixed(1)}
                                </p>
                                <p className="text-[10px] text-fuchsia-600 font-medium mt-0.5">Simulated total</p>
                              </div>
                            );
                          })}
                        </div>
                      ) : null;
                    })()}
                  </div>

                  {/* Comparison Visualisation */}
                  {simResult.plotly_config && (
                    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-bold text-sm text-slate-700 uppercase tracking-wider">Projected Outcomes</h4>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-indigo-500 rounded"></span> Simulated</span>
                        </div>
                      </div>
                      <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                        <Plot
                          data={simResult.plotly_config.data || []}
                          layout={{
                            ...simResult.plotly_config.layout,
                            autosize: true,
                            margin: { t: 24, l: 50, r: 20, b: 50 },
                            paper_bgcolor: 'transparent',
                            plot_bgcolor: 'transparent',
                            font: { family: 'Inter, system-ui, sans-serif', size: 11, color: '#64748b' },
                            showlegend: true,
                            legend: { orientation: 'h', y: -0.15 },
                          }}
                          useResizeHandler={true}
                          style={{ width: '100%', minHeight: '380px' }}
                          config={{ displayModeBar: false }}
                        />
                      </div>
                    </div>
                  )}

                  {/* SQL Trace Comparison */}
                  <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2">
                      <div className="p-5 md:border-r border-b md:border-b-0 border-slate-100">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Code size={12} /> Original Query
                        </p>
                        <pre className="text-xs text-slate-600 font-mono whitespace-pre-wrap bg-slate-50 p-3 rounded-lg">{simResult.original_sql || 'N/A'}</pre>
                      </div>
                      <div className="p-5 bg-fuchsia-50/30">
                        <p className="text-[10px] text-fuchsia-500 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <FlaskConical size={12} /> Simulation Mutation
                        </p>
                        <pre className="text-xs text-fuchsia-800 font-mono whitespace-pre-wrap bg-white/60 p-3 rounded-lg border border-fuchsia-100">{simResult.simulated_sql || 'N/A'}</pre>
                      </div>
                    </div>
                  </div>

                  {/* Data Table */}
                  {simResult.rows && simResult.rows.length > 0 && (
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                      <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Simulated Data Preview</p>
                        <span className="text-[10px] text-slate-400 font-mono">{simResult.rows.length} rows</span>
                      </div>
                      <div className="overflow-x-auto max-h-64 overflow-y-auto">
                        <table className="min-w-full divide-y divide-slate-100 text-xs">
                          <thead className="bg-slate-50 sticky top-0">
                            <tr>
                              {Object.keys(simResult.rows[0]).map(key => (
                                <th key={key} className="px-4 py-2.5 text-left font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{key}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {simResult.rows.slice(0, 20).map((row, ri) => (
                              <tr key={ri} className="hover:bg-fuchsia-50/30 transition-colors">
                                {Object.values(row).map((val, ci) => (
                                  <td key={ci} className="px-4 py-2 whitespace-nowrap text-slate-600 font-mono">
                                    {val === null ? <span className="text-slate-300">null</span> : typeof val === 'number' ? val.toLocaleString() : val.toString()}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Follow-up Suggestions */}
                  {simResult.follow_up_questions && simResult.follow_up_questions.length > 0 && (
                    <div className="flex flex-wrap gap-2 justify-center">
                      {simResult.follow_up_questions.map((q, idx) => (
                        <button 
                          key={idx}
                          onClick={() => { setSimInstruction(q); }}
                          className="text-xs px-4 py-2 bg-white text-fuchsia-700 rounded-full border border-slate-200 hover:bg-fuchsia-50 hover:border-fuchsia-200 transition-all shadow-sm"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

            </div>
          </div>
        ) : (
          // Chat View
          <div className="flex-1 flex flex-col min-h-0 w-full">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <Command size={48} className="text-indigo-200 mb-4" />
              <p className="mb-2 text-slate-500 font-medium">Ask anything about your data.</p>
              <div className="text-xs text-indigo-500 font-medium bg-indigo-50 px-4 py-2 border border-indigo-100 rounded-full mb-4 shadow-sm flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                Pro Tip: Upload a new CSV dataset to experience the dynamic indexing animation!
              </div>
              <div className="flex gap-2 mt-4 flex-wrap justify-center max-w-lg">
                {getDynamicPredictions().slice(0, 2).map((q, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => handleSend(q)} 
                    className="bg-slate-50 hover:bg-indigo-50 px-4 py-2 rounded-full text-sm border border-slate-200 transition-colors text-slate-700 font-medium"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {messages.map((msg, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] rounded-2xl p-5 ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 rounded-tr-sm' 
                  : msg.isError 
                    ? 'bg-red-50 text-red-700 border border-red-100 rounded-tl-sm'
                    : 'bg-white border border-slate-200 shadow-sm rounded-tl-sm'
              }`}>
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    <img src="/logo.png" alt="Vantage AI" className="w-4 h-4 object-contain opacity-80" /> Vantage AI
                  </div>
                )}
                
                <p className={`text-sm leading-relaxed ${msg.role === 'user' ? 'text-white' : 'text-slate-700'}`}>
                  {msg.content}
                </p>

                {/* Plotly Graph rendering */}
                {msg.plotly_config && (
                  <div className="mt-4 p-2 bg-slate-50 rounded-xl border border-slate-100 overflow-hidden w-full max-w-2xl overflow-x-auto">
                    <Plot
                      data={msg.plotly_config.data || []}
                      layout={{
                        ...msg.plotly_config.layout,
                        autosize: true,
                        margin: { t: 30, l: 40, r: 10, b: 40 },
                        paper_bgcolor: 'transparent',
                        plot_bgcolor: 'transparent'
                      }}
                      useResizeHandler={true}
                      style={{ width: '100%', minHeight: '300px' }}
                      config={{ displayModeBar: false }}
                    />
                  </div>
                )}

                {/* SQL Trace / Trust View */}
                {msg.sql && (
                  <div className="mt-4">
                    <details className="group">
                      <summary className="text-xs font-medium text-indigo-500 cursor-pointer flex items-center gap-1 hover:text-indigo-700 outline-none list-none mb-2">
                        <Code size={14} /> View Raw SQL Trace & Data Quality
                      </summary>
                      <div className="mt-2 bg-slate-900 text-emerald-400 p-3 rounded-lg text-xs font-mono overflow-x-auto shadow-inner">
                        <div className="text-slate-500 mb-1">-- Executed Query:</div>
                        {msg.sql}
                        {msg.data_quality && msg.data_quality.error && (
                          <div className="mt-3 text-red-400 border-t border-slate-700/50 pt-2">
                            <AlertTriangle size={14} className="inline mr-1" /> {msg.data_quality.error}
                          </div>
                        )}
                      </div>
                    </details>
                  </div>
                )}

                {/* Raw Data Table Representation */}
                {msg.rows && msg.rows.length > 0 && (
                  <div className="mt-4">
                    <details className="group">
                      <summary className="text-xs font-medium text-slate-500 cursor-pointer flex items-center gap-1 hover:text-slate-700 outline-none list-none mb-2">
                        <TableProperties size={14} /> View Data Snapshot
                      </summary>
                      <div className="mt-2 text-xs font-mono overflow-x-auto bg-white border border-slate-200 rounded-lg max-h-60 overflow-y-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                          <thead className="bg-slate-50 sticky top-0 shadow-sm">
                            <tr>
                              {Object.keys(msg.rows[0]).map((key) => (
                                <th key={key} className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider whitespace-nowrap">
                                  {key}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-200">
                            {msg.rows.map((row, rowIdx) => (
                              <tr key={rowIdx} className="hover:bg-slate-50">
                                {Object.values(row).map((val, colIdx) => (
                                  <td key={colIdx} className="px-3 py-2 whitespace-nowrap text-slate-600">
                                    {val === null ? 'null' : val.toString()}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </details>
                  </div>
                )}

                {/* Suggest follow ups */}
                {msg.follow_up_questions && msg.follow_up_questions.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                    {msg.follow_up_questions.map((q, idx) => (
                      <button 
                        key={idx}
                        onClick={() => handleSend(q)}
                        className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100 hover:bg-indigo-100 transition-colors shadow-sm"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          {loading && <TimelineOverlay status={true} isQuery={true} inline={true} />}
          <div ref={endRef} className="pb-32" />
        </div>

        {/* Input Region — fixed centering strictly to the entire window viewport */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100vw-2rem)] max-w-4xl z-[60]">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex w-full gap-3 items-end shadow-2xl shadow-indigo-500/20 rounded-2xl bg-white border.5 border-slate-200/50 p-2 backdrop-blur-md"
          >
            <textarea
              className="flex-1 max-h-36 min-h-[52px] bg-slate-50/50 border border-transparent rounded-xl px-5 py-3.5 text-sm md:text-base focus:outline-none focus:ring-0 focus:bg-slate-50 resize-y transition-colors placeholder-slate-400 font-medium text-slate-700"
              placeholder="Ask a question about your data..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button 
              type="submit" 
              disabled={loading || !query.trim()}
              className="w-[52px] h-[52px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed hidden md:flex hover:shadow-lg shadow-indigo-600/30"
            >
              <Send size={20} className={loading && "opacity-0"} />
            </button>
            {/* Mobile send button */}
            <button 
              type="submit" 
              disabled={loading || !query.trim()}
              className="w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex md:hidden items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} className={loading && "opacity-0"} />
            </button>
          </form>
        </div>
        </div>
        )}
      </div>

      <VoiceWidget onResult={handleVoice} />

      {/* Upload Modal (Overlays App) */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative border border-slate-200"
            >
              <button 
                onClick={() => !isUploading && setShowUploadModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
                disabled={isUploading}
              >
                <X size={20} />
              </button>
              
              <div className="mb-6 flex items-center gap-3 text-indigo-600">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100">
                  <Database size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-xl text-slate-800">Connect Data Source</h3>
                  <p className="text-slate-500 text-sm">Upload a CSV to generate a neural catalog.</p>
                </div>
              </div>

              <div className="relative group cursor-pointer">
                <input 
                  type="file" 
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all bg-slate-50 ${
                    isUploading ? 'border-slate-200 bg-slate-50' : 'border-indigo-200 group-hover:border-indigo-400 group-hover:bg-indigo-50/50'
                }`}>
                  {isUploading ? (
                    <div className="flex justify-center mb-4">
                      <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <FileSpreadsheet size={40} className="text-indigo-400 mb-4 group-hover:scale-110 transition-transform duration-300" />
                  )}
                  <p className="text-slate-700 font-medium text-center">
                    {isUploading ? 'Indexing Neural Pathways...' : 'Drag & Drop CSV File'}
                  </p>
                  <p className="text-slate-400 text-sm mt-2 text-center max-w-[200px]">
                    {isUploading ? 'This may take a moment based on file size' : 'or click to browse from your computer'}
                  </p>
                </div>
              </div>
              
              <div className="mt-6 flex items-start gap-2 bg-amber-50 text-amber-800 p-3 rounded-xl border border-amber-100/50 text-xs">
                 <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
                 <p>Datasets are securely processed in your session and not trained on.</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
