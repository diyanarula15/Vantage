import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, X, Loader2 } from 'lucide-react';

export function VoiceWidget({ onResult }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");

  const handleMicClick = () => {
    if (!isOpen) {
      setIsOpen(true);
      startListening();
    } else {
      setIsListening(false);
      setIsOpen(false);
    }
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setTranscript("Voice input not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    
    recognition.onstart = () => {
      setIsListening(true);
      setTranscript("Listening...");
    };
    
    recognition.onresult = (event) => {
      const current = event.results[event.results.length - 1][0].transcript;
      setTranscript(current);
    };

    recognition.onerror = () => {
      setIsListening(false);
      setTranscript("Error capturing audio.");
    };

    recognition.onend = () => {
      setIsListening(false);
      setTimeout(() => setIsOpen(false), 2000);
      
      // Pass the final dictated text back out to the parent dashboard!
      if (onResult && transcript && transcript !== "Listening..." && !transcript.includes("Error")) {
          onResult(transcript);
      }
    };

    recognition.start();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="bg-white/90 backdrop-blur-xl border border-slate-200/50 shadow-2xl rounded-2xl p-4 w-72 origin-bottom-right"
          >
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full uppercase tracking-wide">
                Voice Command
              </span>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
            <div className="text-slate-700 min-h-[60px] text-sm font-medium leading-relaxed italic border-l-2 border-indigo-200 pl-3">
              "{transcript}"
            </div>
            {isListening && (
              <div className="mt-3 flex items-center justify-center gap-1.5 text-indigo-500">
                <motion.div animate={{ height: [8, 16, 8] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1 bg-indigo-500 rounded-full" />
                <motion.div animate={{ height: [8, 20, 8] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }} className="w-1 bg-indigo-500 rounded-full" />
                <motion.div animate={{ height: [8, 12, 8] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }} className="w-1 bg-indigo-500 rounded-full" />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleMicClick}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-colors duration-300 ${
          isListening 
            ? 'bg-red-500 text-white shadow-red-500/40' 
            : 'bg-indigo-600 text-white shadow-indigo-600/40 hover:bg-indigo-500'
        }`}
      >
        <Mic size={24} className={isListening ? 'animate-pulse' : ''} />
      </motion.button>
    </div>
  );
}
