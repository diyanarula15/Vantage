import fs from 'fs';

const updatedDashboard = `import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Database, Code, CheckCircle, AlertTriangle, Command, TableProperties, UploadCloud, FileSpreadsheet, X, LayoutDashboard, Activity, TerminalSquare, FlaskConical, TrendingUp } from 'lucide-react';
import Plot from 'react-plotly.js';
import axios from 'axios';
import { VoiceWidget } from './landing/VoiceWidget';

// Fancy Interactive Overlay for Uploading/Indexing
const IndexingOverlay = ({ status }) => {
  // Random heights for bars
  const [bars, setHeights] = useState([20, 40, 60, 30, 80]);
  
  useEffect(() => {
    if (status !== false) {
      const interval = setInterval(() => {
        setHeights(prev => prev.map(() => Math.floor(Math.random() * 80) + 10));
      }, 400);
      return () => clearInterval(interval);
    }
  }, [status]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-md overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-600 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        key={status}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative z-10 flex flex-col items-center max-w-md w-full text-center"
      >
        <div className="mb-8 relative w-32 h-32 flex items-end justify-center gap-2">
          {bars.map((h, i) => (
            <motion.div
              key={i}
              animate={{ height: \\\`\${h}%\\\` }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="w-4 bg-indigo-500 rounded-t-sm shadow-[0_0_15px_rgba(99,102,241,0.5)]"
            />
          ))}
          {status === 'preparing' && (
             <motion.div 
               initial={{ opacity: 0, scale: 0 }}
               animate={{ opacity: 1, scale: 1 }}
               className="absolute inset-0 flex items-center justify-center bg-slate-900/40 rounded-full backdrop-blur-sm"
             >
                <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
             </motion.div>
          )}
        </div>

        <h2 className="text-2xl font-bold text-white mb-3">
          {status === 'uploading' ? 'Analyzing & Indexing Data...' : 'Preparing Predictive Insights...'}
        </h2>
        <p className="text-slate-400 text-sm">
          {status === 'uploading' 
            ? 'We are mapping semantic relations and building the vector space.' 
            : 'Generating baseline models and surfacing hidden trends from your dataset.'}
        </p>

        <div className="mt-8 text-indigo-400 flex items-center gap-2 font-mono text-xs uppercase tracking-widest bg-indigo-500/10 px-4 py-2 rounded-full border border-indigo-500/20">
          <Activity size={14} className="animate-pulse" />
          Neural Engine Active
        </div>
      </motion.div>
    </div>
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
  const [simQuery, setSimQuery] = useState('Show monthly revenue');
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
        headers: { "Content-Type": "multipart/form-data" }
      });
      setIsUploading('preparing');
      await fetchMetadata();
      
      // Simulate insight preparation lag
      await new Promise(r => setTimeout(r, 2500));
      
      setActiveTab('chat');
      setMessages([{
        role: 'assistant',
        content: \\\`Successfully uploaded and indexed \${file.name}. Your neural insights are ready.\\\`,
        follow_up_questions: ["What is the primary trend in the data?", "Forecast the next 3 months", "Identify any anomalies."]
      }]);
      
      setIsUploading(false);
    } catch (error) {
      alert("Failed to upload file");
      setIsUploading(false);
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

  // Generate dynamic simulation suggestions based on columns
  const getDynamicPredictions = () => {
    if (!metadata || !metadata.schema) return ["What if we increase sales by 20%?"];
    const cols = metadata.schema.columns.map(c => c.name.toLowerCase());
    const numericCols = metadata.schema.columns.filter(c => c.sqlite_type === 'INTEGER' || c.sqlite_type === 'REAL').map(c => c.name);
    
    const suggestions = [];
    if (numericCols.length > 0) {
      const target = numericCols[0];
      suggestions.push(\\\`What if we boost \${target} by 15% next quarter?\\\`);
      suggestions.push(\\\`Simulate a 10% drop in \${target} due to seasonality.\\\`);
    } else {
      suggestions.push("What if transaction volume doubles?");
    }
    
    if (cols.some(c => c.includes('price') || c.includes('cost'))) {
      suggestions.push("What if we reduce prices by 5%?");
    }
    
    return suggestions.length > 0 ? suggestions : ["What if we increase output by 20%?"];
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* FULL SCREEN INDEXING OVERLAY */}
      <AnimatePresence>
        {isUploading && <IndexingOverlay status={isUploading} />}
      </AnimatePresence>

      {/* Sidebar */}
      <div className="w-64 bg-slate-900 flex-shrink-0 text-slate-300 p-6 hidden md:flex flex-col border-r border-slate-800 z-20 shadow-xl overflow-y-auto">
        <div className="flex items-center gap-2 text-white font-bold text-xl mb-8">
          <Command className="text-indigo-500" /> Vantage
        </div>
        
        <div className="flex flex-col gap-2 mb-6">
          <button 
            onClick={() => setActiveTab('chat')} 
            className={\\\`flex items-center gap-2 p-3 rounded-xl transition-all \${activeTab === 'chat' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}\\\`}
          >
            <LayoutDashboard size={16} className={activeTab === 'chat' ? 'text-white' : 'text-slate-400'} />
            <span className="text-sm font-medium">Analytics Agent</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('prediction')} 
            className={\\\`flex items-center gap-2 p-3 rounded-xl transition-all \${activeTab === 'prediction' ? 'bg-fuchsia-600 text-white' : 'hover:bg-slate-800'}\\\`}
          >
            <FlaskConical size={16} className={activeTab === 'prediction' ? 'text-white' : 'text-fuchsia-400'} />
            <span className="text-sm font-medium">What-If Simulation</span>
          </button>

          <button 
            onClick={() => setActiveTab('schema')} 
            className={\\\`flex items-center gap-2 p-3 rounded-xl transition-all \${activeTab === 'schema' ? 'bg-slate-700 text-white' : 'hover:bg-slate-800'}\\\`}
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
          <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
            <div className="max-w-5xl mx-auto flex flex-col gap-6">
              
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-fuchsia-100 flex items-center justify-center border border-fuchsia-200">
                    <FlaskConical className="text-fuchsia-600" size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800 tracking-tight">Interactive Modeled Projections</h3>
                    <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Manipulate Baseline Factors</p>
                  </div>
                </div>

                <form onSubmit={handleSimulate} className="flex flex-col gap-4 mt-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                       <label className="text-xs font-semibold text-slate-500 uppercase ml-1 mb-1 block">Base Metric to Model</label>
                       <input 
                         className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-fuchsia-500 focus:ring-fuchsia-100" 
                         value={simQuery}
                         onChange={e => setSimQuery(e.target.value)}
                         placeholder="e.g. Total Revenue by Month"
                       />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase ml-1 mb-1 block flex items-center justify-between">
                       Scenario Instruction
                       <span className="text-[10px] text-fuchsia-600 font-normal tracking-normal normal-case flex items-center gap-1 cursor-pointer hover:underline" onClick={() => setSimInstruction(getDynamicPredictions()[0])}>
                         <TrendingUp size={12} /> Suggest Scenario based on my data
                       </span>
                    </label>
                    <textarea 
                      className="w-full min-h-[80px] bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-fuchsia-500 focus:ring-fuchsia-100 resize-none font-medium text-indigo-900" 
                      value={simInstruction}
                      onChange={e => setSimInstruction(e.target.value)}
                      placeholder="e.g. What if we drop prices by 15% which increases volume by 30%?"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 mb-2 mt-1">
                     {getDynamicPredictions().map((pred, i) => (
                       <button
                         key={i}
                         type="button"
                         onClick={() => setSimInstruction(pred)}
                         className="text-xs px-3 py-1.5 bg-fuchsia-50 text-fuchsia-700 rounded-full border border-fuchsia-100 hover:bg-fuchsia-100 transition-colors"
                       >
                         {pred}
                       </button>
                     ))}
                  </div>

                  <button
                    type="submit"
                    disabled={simLoading || !simInstruction.trim() || !simQuery.trim()}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 text-white font-bold transition-all shadow-md shadow-fuchsia-500/25 disabled:opacity-50"
                  >
                    {simLoading ? 'Simulating Quantum Space...' : 'Run Projection Model'}
                  </button>
                </form>
              </div>

              {simLoading && (
                <div className="bg-white rounded-3xl p-12 shadow-sm border border-slate-200 flex flex-col items-center justify-center min-h-[300px]">
                  <div className="w-12 h-12 border-4 border-fuchsia-100 border-t-fuchsia-600 rounded-full animate-spin mb-4" />
                  <p className="text-slate-500 font-medium text-sm">Running Multi-Variable Analysis...</p>
                </div>
              )}

              {!simLoading && simResult && (
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
                  <h4 className="font-bold text-lg text-slate-800 mb-2 items-center flex gap-2">
                     <CheckCircle size={18} className="text-emerald-500" />
                     Projection Complete
                  </h4>
                  <p className="text-slate-600 text-sm leading-relaxed mb-6">{simResult.answer}</p>
                  
                  {simResult.plotly_config && (
                    <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden w-full overflow-x-auto">
                      <Plot
                        data={simResult.plotly_config.data || []}
                        layout={{
                          ...simResult.plotly_config.layout,
                          autosize: true,
                          margin: { t: 30, l: 40, r: 10, b: 40 },
                          paper_bgcolor: 'transparent',
                          plot_bgcolor: 'transparent'
                        }}
                        useResizeHandler={true}
                        style={{ width: '100%', minHeight: '350px' }}
                        config={{ displayModeBar: false }}
                      />
                    </div>
                  )}

                  <div className="mt-6 flex flex-col md:flex-row gap-4">
                     <div className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Original Query Trace</p>
                        <pre className="text-xs text-slate-600 font-mono whitespace-pre-wrap">{simResult.original_sql}</pre>
                     </div>
                     <div className="flex-1 bg-fuchsia-50 p-4 rounded-xl border border-fuchsia-100">
                        <p className="text-[10px] text-fuchsia-400 font-bold uppercase tracking-wider mb-2">Simulated Execution Trace</p>
                        <pre className="text-xs text-fuchsia-800 font-mono whitespace-pre-wrap">{simResult.simulated_sql}</pre>
                     </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        ) : (
          // Chat View
          <div className="flex-1 flex flex-col min-h-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <Command size={48} className="text-indigo-200 mb-4" />
              <p>Ask anything about your data.</p>
              <div className="flex gap-2 mt-4 flex-wrap justify-center max-w-lg">
                <button onClick={() => handleSend("What was our revenue by region last quarter?")} className="bg-slate-50 hover:bg-indigo-50 px-4 py-2 rounded-full text-sm border border-slate-200 transition-colors">What was our revenue by region last quarter?</button>
                <button onClick={() => handleSend("Show me the top 5 performing segments")} className="bg-slate-50 hover:bg-indigo-50 px-4 py-2 rounded-full text-sm border border-slate-200 transition-colors">Show me the top 5 performing segments</button>
              </div>
            </div>
          )}
          
          {messages.map((msg, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={\\\`flex \${msg.role === 'user' ? 'justify-end' : 'justify-start'}\\\`}
            >
              <div className={\\\`max-w-[85%] rounded-2xl p-5 \${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 rounded-tr-sm' 
                  : msg.isError 
                    ? 'bg-red-50 text-red-700 border border-red-100 rounded-tl-sm'
                    : 'bg-white border border-slate-200 shadow-sm rounded-tl-sm'
              }\\\`}>
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    <Command size={14} className="text-indigo-500" /> Vantage AI
                  </div>
                )}
                
                <p className={\\\`text-sm leading-relaxed \${msg.role === 'user' ? 'text-white' : 'text-slate-700'}\\\`}>
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
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce delay-100" />
                  <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce delay-200" />
                </div>
                <span className="text-xs text-slate-500 font-medium">Synthesizing insight from neural space...</span>
              </div>
            </motion.div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input Region */}
        <div className="p-6 bg-white border-t border-slate-100 flex-shrink-0 z-10 w-full relative -bottom-1 drop-shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex gap-3 max-w-4xl mx-auto items-end shadow-md shadow-indigo-100/30 rounded-2xl"
          >
            <textarea
              className="flex-1 max-h-32 min-h-[44px] bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none resize-y transition-shadow shadow-sm hover:border-slate-300"
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
              className="w-11 h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 hover:shadow-lg hover:shadow-indigo-500/30 transition-shadow duration-200"
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
                <div className={\\\`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all bg-slate-50 \${
                    isUploading ? 'border-slate-200 bg-slate-50' : 'border-indigo-200 group-hover:border-indigo-400 group-hover:bg-indigo-50/50'
                }\\\`}>
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
`;

fs.writeFileSync('/Users/apple/Desktop/vantage/Vantage/frontend/src/Dashboard.jsx', updatedDashboard);
