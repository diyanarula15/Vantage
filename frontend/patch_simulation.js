import fs from 'fs';

const component = `import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Settings2, RefreshCw, Send, CheckCircle2, ArrowRight } from 'lucide-react';

export function SimulationPlayground() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [simulationRun, setSimulationRun] = useState(false);
  
  // Baseline Data
  const baseData = [
    { month: 'Jan', baseline: 120, projected: 120 },
    { month: 'Feb', baseline: 132, projected: 132 },
    { month: 'Mar', baseline: 145, projected: 145 },
    { month: 'Apr', baseline: 160, projected: 160 },
    { month: 'May', baseline: 175, projected: 175 },
    { month: 'Jun', baseline: 190, projected: 190 },
  ];

  const [data, setData] = useState(baseData);
  const [insight, setInsight] = useState('');

  // Handle Simulation execution based on Natural Language Input
  const handleSimulate = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setSimulationRun(true);
    
    // Simulate Natural Language Parsing and Processing Delay
    setTimeout(() => {
      let multiplier = 1.0;
      let textLower = query.toLowerCase();
      
      // Super naive simulation parser just to look dynamic and magical
      if (textLower.includes('increase') || textLower.includes('growth')) multiplier = 1.25;
      else if (textLower.includes('decrease') || textLower.includes('drop')) multiplier = 0.8;
      else if (textLower.includes('double')) multiplier = 2.0;
      else multiplier = 1.15; // default positive simulation

      const simulatedData = baseData.map((item, index) => {
        // Compound effect over time
        const projectionFactor = 1 + ((multiplier - 1) * (index + 1) / baseData.length);
        return {
          ...item,
          projected: Math.round(item.baseline * projectionFactor)
        };
      });

      setData(simulatedData);
      setLoading(false);
      
      const change = Math.round((multiplier - 1) * 100);
      setInsight(
        change >= 0 
          ? \`Based on your scenario, projected Q2 revenue would increase by \${change}% by June, reaching $\${simulatedData[5].projected}M.\`
          : \`Based on your scenario, expected revenue will see a \${Math.abs(change)}% contraction by the end of Q2, dropping to $\${simulatedData[5].projected}M.\`
      );
      
    }, 1500); // 1.5s thinking time
  };

  return (
    <section className="py-32 px-6 bg-[#0B1120] border-t border-slate-800/50 relative overflow-hidden">
      {/* Immersive Dark Theme Background */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-indigo-900/20 via-purple-900/10 to-transparent pointer-events-none" />
      <div className="absolute -left-[500px] top-[10%] w-[1000px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -right-[500px] top-[40%] w-[1000px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-indigo-500/10 text-indigo-300 text-sm font-bold tracking-wide mb-6 border border-indigo-500/20 uppercase"
          >
            <Settings2 size={16} /> Live Simulation Engine
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 mb-6"
          >
            Interactive What-If Modeling
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed"
          >
            Don't just look at past data. Type out potential business scenarios in plain English and instantly visualize the projected downstream impacts across your key metrics.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Chat Input / Controls Panel */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-4 flex flex-col gap-6"
          >
            <div className="bg-slate-900/60 backdrop-blur-2xl border border-slate-700/50 rounded-[32px] p-8 shadow-2xl flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                  <Settings2 className="text-indigo-400" size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">Scenario Prompt</h3>
                  <p className="text-slate-400 text-xs">Natural Language Sandbox</p>
                </div>
              </div>
              
              <form onSubmit={handleSimulate} className="flex flex-col gap-4">
                <div className="relative">
                  <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g. What if we increase marketing spend by 25% starting in March?"
                    className="w-full h-32 bg-slate-950 border border-slate-800 rounded-2xl p-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-sm transition-all shadow-inner"
                    style={{ lineHeight: '1.6' }}
                  />
                  <div className="absolute bottom-3 py-1 px-3 right-3 bg-slate-800 rounded text-[10px] text-slate-400 font-mono tracking-wider border border-slate-700">
                    Ctrl + Enter
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-indigo-900/50 hover:shadow-indigo-500/25 border border-indigo-400/20"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="animate-spin" size={18} />
                      Synthesizing Model...
                    </>
                  ) : (
                    <>
                      <Settings2 size={18} />
                      Run Projection
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Smart Summary / Result Output Card */}
            <AnimatePresence>
              {simulationRun && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, scale: 0.9 }}
                  animate={{ opacity: 1, height: 'auto', scale: 1 }}
                  className="bg-indigo-950/40 backdrop-blur-md border border-indigo-500/20 rounded-[32px] p-6 shadow-xl"
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1 flex-shrink-0">
                      {loading ? (
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-ping" />
                        </div>
                      ) : (
                        <CheckCircle2 className="text-emerald-400" size={24} />
                      )}
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-2">
                        {loading ? 'Analyzing Impact...' : 'Simulation Complete'}
                      </h4>
                      <p className="text-sm text-indigo-200/80 leading-relaxed font-light">
                        {loading 
                          ? "Re-compiling semantic dictionary and adjusting forecast vectors..." 
                          : insight}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Right: Visual Chart Panel */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-8 bg-slate-900/40 backdrop-blur-3xl border border-slate-700/50 rounded-[40px] p-8 lg:p-10 shadow-2xl h-[550px] flex flex-col relative"
          >
            {/* Chart Header */}
            <div className="flex justify-between items-end mb-8">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Projected Revenue Impact</h3>
                <p className="text-slate-400 text-sm">Baseline vs Simulated Forecast (in $M)</p>
              </div>
              <div className="hidden sm:flex gap-4 text-xs font-semibold uppercase tracking-wider">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-600" />
                  <span className="text-slate-400">Baseline</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_10px_#6366f1]" />
                  <span className="text-indigo-300">Projected</span>
                </div>
              </div>
            </div>

            {/* The Chart */}
            <div className="flex-1 relative w-full h-full min-h-[300px]">
              {loading && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-white/5">
                  <RefreshCw className="animate-spin text-indigo-500 mb-4" size={32} />
                  <p className="text-indigo-300 font-medium">Recalculating vectors...</p>
                </div>
              )}
              
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorBaseline" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                  
                  <XAxis 
                    dataKey="month" 
                    stroke="#64748b" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 13 }}
                    dy={10}
                  />
                  
                  <YAxis 
                    stroke="#64748b" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 13 }}
                    tickFormatter={(value) => \`\${value}\`}
                    dx={-10}
                  />
                  
                  <Tooltip 
                    cursor={{ stroke: '#334155', strokeWidth: 1, strokeDasharray: '4 4' }}
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(51, 65, 85, 0.5)', 
                      borderRadius: '16px', 
                      color: '#fff',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                    }}
                    itemStyle={{ color: '#fff', fontWeight: 500 }}
                  />
                  
                  {/* Baseline Series */}
                  <Area 
                    type="monotone" 
                    dataKey="baseline" 
                    name="Baseline Revenue"
                    stroke="#475569" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorBaseline)" 
                    animationDuration={1500}
                    isAnimationActive={true}
                  />
                  
                  {/* Simulated Series */}
                  <Area 
                    type="monotone" 
                    dataKey="projected" 
                    name="Projected Revenue"
                    stroke="#818cf8" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorProjected)" 
                    animationDuration={1500}
                    isAnimationActive={!loading}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
          </motion.div>
        </div>
      </div>
    </section>
  );
}
`;

fs.writeFileSync('/Users/apple/Desktop/vantage/Vantage/frontend/src/landing/SimulationPlayground.jsx', component);
console.log("SimulationPlayground.jsx completely rewritten!");
