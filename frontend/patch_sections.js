import fs from 'fs';

let content = fs.readFileSync('/Users/apple/Desktop/vantage/Vantage/frontend/src/landing/Sections.jsx', 'utf-8');

const oldHowItWorks = `export function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="how-it-works" ref={ref} className="py-24 px-6 bg-slate-50/50 relative overflow-hidden">
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
}`;

const splitPoint = content.indexOf('export function Comparison() {');
if (splitPoint === -1) {
  console.error("Could not find Comparison!");
  process.exit(1);
}

// Ensure framer motion layout features are imported at the top if needed.
if (!content.includes('useScroll')) {
  // It's probably importing motion, let's keep it simple with what's there
}

const newHowItWorks = `export function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-20%' });

  // Typewriter effect container
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.3 }
    }
  };

  const wordVariants = {
    hidden: { opacity: 0, y: 10, filter: 'blur(4px)' },
    visible: { opacity: 1, y: 0, filter: 'blur(0px)' }
  };

  return (
    <section id="how-it-works" ref={ref} className="py-32 px-6 bg-slate-50 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 rounded-full blur-[120px] -z-10" />

      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-28"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-sm font-medium mb-4 shadow-[0_0_15px_rgba(79,70,229,0.1)]">
            How it works
          </div>
          <h2 className="text-4xl md:text-6xl font-extrabold pb-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-900 via-blue-800 to-purple-900 mb-6">
            Three steps to data fluency
          </h2>
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            From raw data to narrated insights in under a minute — no engineering tickets required.
          </p>
        </motion.div>

        <div className="relative">
          {/* Dynamic SVG Animated Connector Line (desktop) */}
          <div className="hidden md:block absolute top-[52px] left-[16.67%] right-[16.67%] h-px flex items-center h-full z-0 overflow-visible mt-[-1px]">
            <svg width="100%" height="20" className="overflow-visible" preserveAspectRatio="none">
              <motion.path
                d="M 0 10 C 25% 10, 25% 10, 33% 10 C 50% 10, 50% 10, 66% 10 C 75% 10, 75% 10, 100% 10"
                fill="none"
                stroke="url(#gradientLine)"
                strokeWidth="3"
                strokeDasharray="10 15"
                initial={{ pathLength: 0 }}
                animate={inView ? { pathLength: 1 } : {}}
                transition={{ duration: 2.5, ease: "easeInOut", delay: 0.2 }}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="gradientLine" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity="0.2" />
                  <stop offset="50%" stopColor="#a78bfa" stopOpacity="1" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.2" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8 relative z-10">
            {steps.map((step, i) => {
              const Icon = stepIcons[step.num];
              const words = step.desc.split(" ");
              return (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 50, scale: 0.95 }}
                  animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
                  transition={{ duration: 0.7, delay: i * 0.4 + 0.2, ease: "easeOut" }}
                  className="relative text-center px-4"
                >
                  <motion.div 
                    whileHover={{ scale: 1.05, rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 0.3 }}
                    className="inline-flex items-center justify-center w-24 h-24 rounded-[32px] bg-white border border-indigo-50 shadow-xl shadow-indigo-100/50 mb-8 relative z-10"
                  >
                    <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm font-bold flex items-center justify-center shadow-lg shadow-indigo-200">
                      {step.num}
                    </div>
                    <Icon size={36} className="text-indigo-600" />
                  </motion.div>
                  
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">{step.title}</h3>
                  
                  {/* Slowly typing out the text description */}
                  <motion.p 
                    className="text-slate-600 leading-relaxed max-w-[280px] mx-auto text-base"
                    variants={containerVariants}
                    initial="hidden"
                    animate={inView ? "visible" : "hidden"}
                  >
                    {words.map((word, wordIndex) => (
                      <motion.span key={wordIndex} variants={wordVariants} className="inline-block mr-1">
                        {word}
                      </motion.span>
                    ))}
                  </motion.p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

`;

const replacedContent = content.replace(oldHowItWorks, newHowItWorks);
fs.writeFileSync('/Users/apple/Desktop/vantage/Vantage/frontend/src/landing/Sections.jsx', replacedContent);
console.log("Sections.jsx updated");
