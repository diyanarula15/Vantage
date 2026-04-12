import React, { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { Database, MessageSquare, Sparkles, ArrowRight, X, Check } from 'lucide-react';
import { trustLogos, steps, beforeItems, afterItems, features, integrations } from './data';
import {
  GitBranch, Layers, RefreshCw, Zap, Shield, BookOpen,
} from 'lucide-react';

const iconMap = { GitBranch, Layers, RefreshCw, Zap, Shield, BookOpen };
const colorMap = {
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', glow: 'shadow-indigo-200/50' },
  violet: { bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-100', glow: 'shadow-violet-200/50' },
  cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-100', glow: 'shadow-cyan-200/50' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', glow: 'shadow-amber-200/50' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', glow: 'shadow-emerald-200/50' },
  rose: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', glow: 'shadow-rose-200/50' },
};

const stepIcons = { 1: Database, 2: MessageSquare, 3: Sparkles };

/* ── Logo Cloud / Trust Bar ── */
export function TrustBar() {
  return (
    <section className="py-14 border-y border-slate-100 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 mb-10">
          Trusted by data-driven teams at
        </p>
        {/* Marquee wrapper */}
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10" />
          <div className="flex gap-16 animate-marquee">
            {[...trustLogos, ...trustLogos].map((logo, i) => (
              <div
                key={`${logo}-${i}`}
                className="flex-shrink-0 flex items-center gap-2.5 opacity-40 hover:opacity-100 transition-opacity duration-300 cursor-default"
              >
                <div className="w-7 h-7 rounded-lg bg-slate-200/50" />
                <span className="text-base font-semibold text-slate-700 whitespace-nowrap">{logo}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── How It Works ── */
export function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="how-it-works" ref={ref} className="py-28 px-6 bg-slate-50/50 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-indigo-50/50 rounded-full blur-[120px] -z-10" />

      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-sm font-medium mb-4">
            How it works
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
            Three steps to data fluency
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            From raw data to narrated insights in under a minute — no engineering tickets required.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector line (desktop) */}
          <div className="hidden md:block absolute top-24 left-[16.67%] right-[16.67%] h-px bg-gradient-to-r from-indigo-200 via-violet-200 to-cyan-200" />

          {steps.map((step, i) => {
            const Icon = stepIcons[step.num];
            return (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: i * 0.2 }}
                className="relative text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-lg shadow-slate-200/50 mb-6 relative z-10">
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shadow-md">
                    {step.num}
                  </div>
                  <Icon size={24} className="text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                <p className="text-slate-600 leading-relaxed max-w-xs mx-auto">{step.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── Before vs After Comparison ── */
export function Comparison() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="py-28 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
            The before &amp; after
          </h2>
          <p className="text-lg text-slate-600">See what changes when data becomes a conversation.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Before */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-slate-50 rounded-3xl p-8 border border-slate-200/80 relative overflow-hidden group hover:bg-slate-100/80 transition-colors"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-200/30 rounded-full blur-2xl -z-0" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200/80 text-slate-600 text-xs font-semibold mb-6 uppercase tracking-wider">
                Before Vantage
              </div>
              <ul className="space-y-4">
                {beforeItems.map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.3 + i * 0.08 }}
                    className="flex items-start gap-3 text-slate-500"
                  >
                    <X size={18} className="text-slate-400 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* After */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-gradient-to-br from-indigo-50 to-violet-50/50 rounded-3xl p-8 border border-indigo-100 relative overflow-hidden group hover:shadow-lg hover:shadow-indigo-100/50 transition-all"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-200/20 rounded-full blur-2xl -z-0" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold mb-6 uppercase tracking-wider">
                With Vantage
              </div>
              <ul className="space-y-4">
                {afterItems.map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: 10 }}
                    animate={inView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.4 + i * 0.08 }}
                    className="flex items-start gap-3 text-slate-700 font-medium"
                  >
                    <Check size={18} className="text-indigo-600 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ── Features Grid ── */
export function FeaturesGrid() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section ref={ref} className="py-28 px-6 bg-slate-50/50 relative overflow-hidden">
      <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-violet-50/40 rounded-full blur-[120px] -z-10" />

      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-50 text-violet-600 text-sm font-medium mb-4">
            Why Vantage
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
            Enterprise intelligence, out of the box
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Every component is engineered for accuracy, privacy, and speed.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = iconMap[f.icon] || Sparkles;
            const c = colorMap[f.color] || colorMap.indigo;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 25 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                whileHover={{ y: -6, scale: 1.02 }}
                className={`bg-white p-7 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:${c.glow} transition-all duration-300 group cursor-default`}
              >
                <div className={`w-12 h-12 rounded-2xl ${c.bg} flex items-center justify-center ${c.text} mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon size={22} />
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">{f.title}</h4>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ── Integrations Grid ── */
export function IntegrationsGrid() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const categoryColors = {
    warehouse: 'from-blue-500/10 to-blue-500/5 border-blue-200/50',
    database: 'from-emerald-500/10 to-emerald-500/5 border-emerald-200/50',
    pipeline: 'from-orange-500/10 to-orange-500/5 border-orange-200/50',
    transform: 'from-violet-500/10 to-violet-500/5 border-violet-200/50',
    bi: 'from-cyan-500/10 to-cyan-500/5 border-cyan-200/50',
    crm: 'from-rose-500/10 to-rose-500/5 border-rose-200/50',
    payments: 'from-indigo-500/10 to-indigo-500/5 border-indigo-200/50',
    commerce: 'from-emerald-500/10 to-emerald-500/5 border-emerald-200/50',
    cdp: 'from-amber-500/10 to-amber-500/5 border-amber-200/50',
    messaging: 'from-violet-500/10 to-violet-500/5 border-violet-200/50',
  };

  return (
    <section id="integrations" ref={ref} className="py-28 px-6 bg-white relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-50/30 rounded-full blur-[120px] -z-10" />

      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-50 text-cyan-600 text-sm font-medium mb-4">
            Integrations
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
            Connects to your entire stack
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Warehouse, CRM, BI tool — Vantage builds a semantic layer on whatever data you have.
          </p>
        </motion.div>

        {/* Center hub */}
        <div className="relative">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {integrations.map((int, i) => (
              <motion.div
                key={int.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: i * 0.04, duration: 0.4 }}
                whileHover={{ y: -4, scale: 1.05 }}
                className={`bg-gradient-to-br ${categoryColors[int.category]} border rounded-2xl p-5 flex flex-col items-center gap-3 cursor-default transition-all duration-300 hover:shadow-lg`}
              >
                <div className="w-10 h-10 rounded-xl bg-white/80 shadow-sm flex items-center justify-center">
                  <Database size={18} className="text-slate-500" />
                </div>
                <span className="text-sm font-semibold text-slate-700">{int.name}</span>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">{int.category}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
