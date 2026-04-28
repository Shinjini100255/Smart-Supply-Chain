import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Zap, Navigation, Clock, Info } from 'lucide-react';
import { RouteOptimization, Shipment } from '../types';

interface OptimizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
  shipment: Shipment | null;
  optimization: RouteOptimization | null;
  isLoading: boolean;
}

export default function OptimizeModal({ isOpen, onClose, onApply, shipment, optimization, isLoading }: OptimizeModalProps) {

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-slate-900 border border-blue-200 dark:border-slate-800"
          >
            {/* Header */}
            <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Navigation className="h-5 w-5" />
                <span className="text-xs font-black uppercase tracking-widest">Dynamic Route Optimizer: #{shipment?.id}</span>
              </div>
              <button onClick={onClose} className="rounded-full p-1 text-blue-200 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Running Simulation Vector...</p>
                </div>
              ) : optimization ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest ${
                      optimization.suggestedAction === 'Reroute' ? 'bg-amber-100 text-amber-700' :
                      optimization.suggestedAction === 'Delay' ? 'bg-rose-100 text-rose-700' :
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {optimization.suggestedAction}
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <Clock size={16} />
                      <span className="text-xs font-bold">ETA: {optimization.optimizedETA}</span>
                    </div>
                  </div>

                  {/* Impact Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                      <p className="text-[9px] font-black text-emerald-600 uppercase tracking-tight">Risk Reduction</p>
                      <p className="text-lg font-black text-emerald-700 dark:text-emerald-400">-{optimization.riskReduction}</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30">
                      <p className="text-[9px] font-black text-blue-600 uppercase tracking-tight">Time Saved</p>
                      <p className="text-lg font-black text-blue-700 dark:text-blue-400">+{optimization.timeSaved}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <section>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-1 flex items-center gap-1">
                        <Info size={12} /> Optimization Logic
                      </p>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                        {optimization.reason}
                      </p>
                    </section>

                    <section className="bg-slate-900 dark:bg-black p-4 rounded-xl border border-slate-700">
                      <p className="text-[10px] font-bold text-blue-400 uppercase tracking-tight mb-2">Recommended Path Vector</p>
                      <p className="text-xs font-mono font-bold text-slate-100">
                        {optimization.alternativeRoute}
                      </p>
                    </section>
                  </div>
                </div>
              ) : (
                <p className="text-center text-slate-500 py-8">Optimization data unavailable.</p>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-black py-3 rounded uppercase tracking-widest hover:bg-slate-50 transition-colors"
              >
                Back to Monitor
              </button>
              <button
                onClick={onApply}
                disabled={!optimization}
                className="flex-1 bg-blue-600 text-white text-[10px] font-black py-3 rounded uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-50"
              >
                Execute Optimization
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
