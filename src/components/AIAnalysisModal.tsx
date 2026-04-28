import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle, ShieldCheck, Zap, AlertCircle } from 'lucide-react';
import { AIAnalysis, Shipment } from '../types';

interface AIAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: Shipment | null;
  analysis: AIAnalysis | null;
  isLoading: boolean;
}

export default function AIAnalysisModal({ isOpen, onClose, shipment, analysis, isLoading }: AIAnalysisModalProps) {
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
            <div className="bg-blue-600 text-white p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white/20">
                  <Zap className="h-3.5 w-3.5 text-white fill-current" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest">Gemini AI Insights: #{shipment?.id}</span>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-1 text-blue-200 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="max-h-[70vh] overflow-y-auto p-5">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Neural Analysis in progress...</p>
                </div>
              ) : analysis ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <p className="text-[10px] font-black text-slate-400 uppercase">Risk Classification</p>
                      <h4 className={`text-sm font-black uppercase ${
                        analysis.riskLevel === 'Critical' ? 'text-rose-600' :
                        analysis.riskLevel === 'High' ? 'text-rose-500' :
                        analysis.riskLevel === 'Medium' ? 'text-amber-500' : 'text-emerald-500'
                      }`}>
                        {analysis.riskLevel} Priority
                      </h4>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase">System Confidence</p>
                      <p className="text-sm font-black text-blue-600">{(analysis.confidenceScore * 100).toFixed(0)}%</p>
                    </div>
                  </div>

                  <section>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-1">Decision Summary</p>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                      {analysis.riskExplanation}
                    </p>
                  </section>

                  {/* Impact Analysis */}
                  <section className="bg-slate-900 text-white p-4 rounded-xl border border-slate-700">
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-[10px] font-bold text-blue-400 uppercase">Network Impact Analysis</p>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                        analysis.impactAnalysis.score === 'High' ? 'bg-rose-500' :
                        analysis.impactAnalysis.score === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}>
                        {analysis.impactAnalysis.score} Impact
                      </span>
                    </div>
                    <p className="text-[11px] font-medium opacity-90 leading-relaxed mb-3">
                      {analysis.impactAnalysis.description}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-blue-300">
                      <AlertCircle size={12} />
                      {analysis.impactAnalysis.affectedPaths} downstream nodes affected
                    </div>
                  </section>

                  <section className="bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30">
                    <p className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-tight mb-2">Mitigation Strategy</p>
                    <ul className="space-y-1.5">
                      {analysis.mitigationStrategies.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-[11px] text-blue-800 dark:text-blue-300">
                          <span className="font-bold shrink-0">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mb-2">Disruption Vectors</p>
                    <div className="flex flex-wrap gap-2">
                      {analysis.possibleDisruptions.map((item, idx) => (
                        <span key={idx} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-bold text-slate-600 dark:text-slate-400">
                          {item}
                        </span>
                      ))}
                    </div>
                  </section>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs font-bold uppercase tracking-widest">
                  No vectors available.
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={onClose}
                className="w-full bg-slate-900 text-white text-[10px] font-black py-2.5 rounded uppercase tracking-widest hover:bg-black transition-colors"
              >
                Execute Recommended Actions
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
