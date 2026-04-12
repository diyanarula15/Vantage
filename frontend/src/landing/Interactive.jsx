import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { BarChart, Bar, XAxis, ResponsiveContainer, CartesianGrid } from 'recharts';
import { CheckCircle, MessageSquare, Zap, Hash, Sparkles } from 'lucide-react';
import { personas, analyticsDataSets } from './data';

const personaKeys = Object.keys(personas);

/* ── Persona / Use-Case Tabs ── */
export function PersonaTabs() {
  const [active, setActive] = useState('RevOps');
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const persona = personas[active];

  return (
    <section id="personas" ref={ref} className="py-24 px-6 bg-slate-50/50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-violet-50/30 rounded-full blur-[120px] -z-10" />

      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-50 text-violet-600 text-sm font-medium mb-4">
            Use Cases
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
            Built for every team
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            The semantic layer translates your data for any business function — no training required.
          </p>
        </motion.div>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {personaKeys.map((key) => (
            <motion.button
              key={key}
              onClick={() => setActive(key)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                active === key
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/25'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {key}
            </motion.button>
          ))}
        </div>

        {/* Content */}
        <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative overflow-hidden min-h-[420px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
            >
              {/* Left: Text */}
              <div>
                <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
                  {persona.title}
                </h3>
                <p className="text-slate-600 mb-6 text-lg leading-relaxed">
                  {persona.answer}
                </p>
                <ul className="space-y-3">
                  {persona.bullets.map((b, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                      <CheckCircle size={18} className="text-violet-500 flex-shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right: Mock chat */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/60 relative">
                <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-slate-500">
                  <MessageSquare size={16} /> Slack Conversation
                </div>

                {/* User question */}
                <div className="bg-white rounded-xl px-4 py-3 text-sm text-slate-700 border border-slate-100 mb-4 ml-8 shadow-sm">
                  {persona.question}
                </div>

                {/* AI response */}
                <div className="relative">
                  <div className="absolute -left-1 top-4 w-5 h-5 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 border-2 border-white shadow-md z-10" />
                  <div className="bg-violet-50 rounded-xl px-4 py-3 text-sm text-violet-900 border border-violet-100 ml-4">
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      Generating verified SQL… ✓
                    </motion.span>
                    {/* Mini bar chart */}
                    <div className="mt-3 h-16 bg-white rounded-lg border border-violet-100/50 flex items-end p-1.5 gap-1.5 justify-between">
                      {[40, 65, 30, 80, 55].map((h, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ delay: 0.5 + i * 0.1, duration: 0.6, ease: 'easeOut' }}
                          className="flex-1 bg-gradient-to-t from-violet-500 to-indigo-400 rounded-sm"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

/* ── Slack Conversation Showcase ── */
export function SlackShowcase() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const t1 = setTimeout(() => setStage(1), 800);
    const t2 = setTimeout(() => setStage(2), 2000);
    const t3 = setTimeout(() => setStage(3), 3200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [inView]);

  const chartData = [
    { region: 'NA', revenue: 1800 },
    { region: 'EMEA', revenue: 1100 },
    { region: 'APAC', revenue: 680 },
    { region: 'LATAM', revenue: 380 },
    { region: 'ANZ', revenue: 240 },
  ];

  return (
    <section ref={ref} className="py-24 px-6 bg-white relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-gradient-to-b from-indigo-50/40 to-transparent rounded-[50%] blur-[80px] -z-10" />

      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-sm font-medium mb-4">
            <Sparkles size={14} /> AI in Action
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
            Watch the magic happen
          </h2>
          <p className="text-lg text-slate-600 max-w-xl mx-auto">
            A real conversation between your team and Vantage AI in Slack.
          </p>
        </motion.div>

        {/* Slack Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden"
        >
          {/* Slack header bar */}
          <div className="bg-[#3F0E40] px-6 py-3.5 flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
              <div className="w-3 h-3 rounded-full bg-green-400/80" />
            </div>
            <div className="flex-1 text-center">
              <span className="text-white/80 text-sm font-medium flex items-center justify-center gap-1.5">
                <Hash size={14} /> analytics-data
              </span>
            </div>
          </div>

          {/* Messages */}
          <div className="p-6 md:p-8 space-y-6 min-h-[400px]">
            {/* User message */}
            {stage >= 0 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="flex gap-3"
              >
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-sm font-bold text-orange-700 flex-shrink-0">
                  AK
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm font-bold text-slate-900">Alex Kim</span>
                    <span className="text-xs text-slate-400">11:42 AM</span>
                  </div>
                  <div className="text-sm text-slate-700 leading-relaxed">
                    What was our revenue by region last quarter?
                  </div>
                </div>
              </motion.div>
            )}

            {/* Thinking indicator */}
            {stage === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-500/25">
                  <Zap size={16} className="text-white" />
                </div>
                <div className="flex items-center gap-2 bg-slate-50 px-4 py-3 rounded-2xl rounded-tl-md border border-slate-100">
                  <div className="flex gap-1.5">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="w-2 h-2 rounded-full bg-indigo-400"
                        animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                        transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-slate-400 ml-2">Analyzing data…</span>
                </div>
              </motion.div>
            )}

            {/* AI step indicators */}
            {stage >= 2 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="flex gap-3"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-500/25">
                  <Zap size={16} className="text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-bold text-slate-900">Vantage AI</span>
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-semibold">APP</span>
                    <span className="text-xs text-slate-400">11:42 AM</span>
                  </div>

                  {/* Steps */}
                  <div className="space-y-1.5 mb-4">
                    {[
                      'Intent classified: FACTUAL',
                      'TAG plan generated (3 steps)',
                      'SQL synthesized & validated ✓',
                      'PII scan: Clean',
                    ].map((step, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.15 }}
                        className="text-xs text-slate-400 flex items-center gap-2"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        {step}
                      </motion.div>
                    ))}
                  </div>

                  {/* Answer */}
                  {stage >= 3 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="text-sm text-slate-700 leading-relaxed mb-4">
                        Total revenue last quarter was <strong className="text-slate-900">$4.2M</strong> across 5 regions.
                        North America led with <strong className="text-emerald-600">$1.8M (43%)</strong>, followed by EMEA at $1.1M (26%).
                        APAC showed the strongest growth at <strong className="text-emerald-600">+34% QoQ</strong>, reaching $680K.
                      </div>

                      {/* Embedded chart */}
                      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/50">
                        <div className="text-xs font-semibold text-slate-500 mb-3">Revenue by Region ($K)</div>
                        <div className="h-[140px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} barSize={28}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="region" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                              <defs>
                                <linearGradient id="slackBar" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#6366f1" />
                                  <stop offset="100%" stopColor="#8b5cf6" />
                                </linearGradient>
                              </defs>
                              <Bar dataKey="revenue" fill="url(#slackBar)" radius={[6, 6, 0, 0]} animationDuration={1200} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Reactions */}
                      <div className="flex gap-2 mt-3">
                        <div className="bg-indigo-50 px-2.5 py-1 rounded-full text-xs flex items-center gap-1 border border-indigo-100 cursor-default hover:bg-indigo-100 transition-colors">
                          👍 3
                        </div>
                        <div className="bg-slate-50 px-2.5 py-1 rounded-full text-xs flex items-center gap-1 border border-slate-100 cursor-default hover:bg-slate-100 transition-colors">
                          🎯 1
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
