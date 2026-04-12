import React, { useState, useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { analyticsDataSets } from './data';

const tabs = ['RevOps', 'Sales', 'Marketing', 'Finance'];

/* ── Animated Counter ── */
function AnimatedCounter({ end, suffix = '', decimals = 0, duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const startTime = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3);

    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = ease(progress);
      setCount(start + (end - start) * easedProgress);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [inView, end, duration]);

  return (
    <span ref={ref}>
      {decimals > 0 ? count.toFixed(decimals) : Math.floor(count)}
      {suffix}
    </span>
  );
}

/* ── Custom Tooltip ── */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white px-4 py-3 rounded-xl shadow-xl shadow-slate-200/50 border border-slate-100 text-sm">
      <div className="text-slate-500 text-xs mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="font-semibold text-slate-800">
          {p.name}: {typeof p.value === 'number' && p.value > 100 ? p.value.toLocaleString() : p.value}
        </div>
      ))}
    </div>
  );
}

/* ── KPI Card ── */
function KPICard({ label, value, suffix, change, delay = 0 }) {
  const isPositive = change > 0;
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-indigo-100/30 transition-all duration-300"
    >
      <div className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">{label}</div>
      <div className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
        <AnimatedCounter end={value} suffix={suffix} decimals={suffix === '%' ? 1 : 0} />
      </div>
      <div className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-emerald-600' : 'text-rose-500'}`}>
        {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {Math.abs(change)}%
        <span className="text-slate-400 font-normal ml-1">vs last quarter</span>
      </div>
    </motion.div>
  );
}

/* ── Analytics Section ── */
export default function Analytics() {
  const [activeTab, setActiveTab] = useState('RevOps');
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const data = analyticsDataSets[activeTab];

  return (
    <section id="analytics" ref={ref} className="py-24 px-6 bg-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-50/30 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-50/20 rounded-full blur-[100px] -z-10" />

      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-sm font-medium mb-4">
            Live Analytics
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
            Stop waiting for dashboards
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Vantage accelerates decision velocity by delivering presentation-ready insights instantly.
          </p>
        </motion.div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {tabs.map((tab) => (
            <motion.button
              key={tab}
              onClick={() => setActiveTab(tab)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                activeTab === tab
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab}
            </motion.button>
          ))}
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {data.kpis.map((kpi, i) => (
            <KPICard key={`${activeTab}-${kpi.label}`} {...kpi} delay={i * 0.1} />
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Line Chart - Span 2 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-shadow duration-500"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{data.lineLabel}</h3>
                <p className="text-sm text-slate-500">6-month trend</p>
              </div>
              <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                <TrendingUp size={12} /> Improving
              </div>
            </div>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.line} key={activeTab + '-line'}>
                  <defs>
                    <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#4f46e5" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dx={-10} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="url(#lineGrad)"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: '#4f46e5' }}
                    animationDuration={1500}
                    animationEasing="ease-in-out"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Bar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-shadow duration-500"
          >
            <h3 className="text-lg font-bold text-slate-900 mb-1">{data.barLabel}</h3>
            <p className="text-sm text-slate-500 mb-6">Current vs Previous</p>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.bar} key={activeTab + '-bar'} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="previous" fill="#e2e8f0" radius={[4, 4, 0, 0]} animationDuration={1200} name="Previous" />
                  <Bar dataKey="current" fill="#4f46e5" radius={[4, 4, 0, 0]} animationDuration={1500} name="Current" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Area Chart Full Width */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4 }}
          className="mt-6 bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px]" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-[60px]" />

          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">{data.areaLabel}</h3>
                <p className="text-sm text-slate-400">Growing adoption curve</p>
              </div>
              <div className="bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 backdrop-blur-sm">
                <TrendingUp size={12} /> +{data.kpis[2]?.change || 0}%
              </div>
            </div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.area} key={activeTab + '-area'}>
                  <defs>
                    <linearGradient id="areaGradDark" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#818cf8" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e1b4b', border: 'none', borderRadius: '12px', color: '#e2e8f0' }} />
                  <Area
                    type="monotone"
                    dataKey="queries"
                    stroke="#818cf8"
                    strokeWidth={3}
                    fill="url(#areaGradDark)"
                    animationDuration={1800}
                    animationEasing="ease-in-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
