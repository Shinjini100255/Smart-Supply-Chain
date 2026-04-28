import { motion, AnimatePresence } from 'motion/react';
import { X, MapPin, Navigation, Clock, AlertTriangle, ShieldCheck, Zap, TrendingUp, TrendingDown } from 'lucide-react';
import { Shipment } from '../types';
import { cn } from '../lib/utils';

interface ShipmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  shipment: Shipment | null;
  onOptimize: (shipment: Shipment) => void;
}

export function ShipmentDetailModal({ isOpen, onClose, shipment, onOptimize }: ShipmentDetailModalProps) {
  if (!shipment) return null;

  const calculateETA = (risk: number) => {
    const hours = Math.floor(2 + risk * 48);
    return `${hours}h ${Math.floor(Math.random() * 60)}m`;
  };

  const getRiskColor = (risk: number) => {
    if (risk > 0.7) return 'text-rose-600';
    if (risk > 0.4) return 'text-amber-500';
    return 'text-emerald-500';
  };

  const getDecision = (shipment: Shipment) => {
    if (shipment.risk > 0.7) return 'CRITICAL: Reroute advised immediately. Potential vehicle breakdown or extreme weather detected in path.';
    if (shipment.risk > 0.4) return 'WARNING: Slight delays expected due to congestion. Optimize route to regain schedule adherence.';
    return 'NOMINAL: Proceed with current schedule. System integrity verified.';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50/50 dark:bg-slate-800/30">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    Shipment #{shipment.id}
                  </h3>
                  {shipment.isOptimized && (
                    <span className="text-[10px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">
                      Optimized
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Vector Identification Log
                </p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors"
                id="close-modal-btn"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Route Section */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Origin Point</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{shipment.origin}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg">
                      <Navigation size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Current Vector</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{shipment.destination}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4 border-l border-slate-100 dark:border-slate-800 pl-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Live Status</p>
                    <p className="text-sm font-black text-blue-600 uppercase italic tracking-tight">{shipment.status}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Calculated ETA</p>
                    <div className="flex items-center gap-1.5 text-sm font-black text-slate-900 dark:text-white">
                      <Clock size={14} className="text-blue-500" />
                      {calculateETA(shipment.risk)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Flags */}
              {shipment.flags && shipment.flags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {shipment.flags.map(flag => (
                    <span key={flag} className={cn(
                      "text-[9px] font-black px-2 py-1 rounded uppercase flex items-center gap-1 shadow-sm",
                      flag === 'held' ? "bg-slate-900 text-white" :
                      flag === 'delayed' ? "bg-amber-500 text-white" :
                      flag === 'high_risk' ? "bg-rose-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    )}>
                      {flag === 'held' && "⛔ Held"}
                      {flag === 'delayed' && "⏳ Delayed"}
                      {flag === 'high_risk' && "🔴 High Risk"}
                      {!['held', 'delayed', 'high_risk'].includes(flag) && flag}
                    </span>
                  ))}
                </div>
              )}

              {/* Risk Analytics Card */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                {/* Route Progress */}
                {shipment.route && shipment.route.length > 0 && (
                  <div className="mb-6">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-3">Road Path Integrity</p>
                    <div className="flex items-center gap-1">
                      {shipment.route.map((city, idx) => (
                        <div key={city} className="flex-1 flex flex-col items-center gap-2 relative">
                          <div className={cn(
                            "w-2 h-2 rounded-full z-10",
                            idx === shipment.currentIndex ? "bg-blue-600 ring-4 ring-blue-100 dark:ring-blue-900/40" :
                            idx < (shipment.currentIndex ?? 0) ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                          )}></div>
                          <span className={cn(
                            "text-[8px] font-black uppercase text-center absolute -bottom-4 w-12",
                            idx === shipment.currentIndex ? "text-blue-600" : "text-slate-400"
                          )}>
                            {city}
                          </span>
                          {idx < shipment.route.length - 1 && (
                            <div className={cn(
                              "absolute w-full h-[2px] left-1/2 top-1",
                              idx < (shipment.currentIndex ?? 0) ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-800"
                            )}></div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-end mb-4 pt-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Impact Probability</p>
                    <div className="flex items-center gap-2">
                      <span className={cn("text-2xl font-black", getRiskColor(shipment.risk))}>
                        {(shipment.risk * 100).toFixed(0)}%
                      </span>
                      {shipment.trend === 'increasing' ? (
                        <TrendingUp size={16} className="text-rose-500" />
                      ) : shipment.trend === 'decreasing' ? (
                        <TrendingDown size={16} className="text-emerald-500" />
                      ) : null}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Priority Index</p>
                    <span className="text-lg font-black text-slate-900 dark:text-white">{shipment.priorityScore}/100</span>
                  </div>
                </div>

                <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 flex items-start gap-3">
                  <div className={cn("mt-0.5 p-1 rounded", shipment.risk > 0.4 ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600")}>
                    {shipment.risk > 0.4 ? <AlertTriangle size={14} /> : <ShieldCheck size={14} />}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Decision Engine Output</p>
                    <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 leading-relaxed">
                      {getDecision(shipment)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex gap-3">
              <button
                onClick={() => onOptimize(shipment)}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black py-3 rounded-xl uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]"
                id="optimize-modal-btn"
              >
                <Zap size={14} />
                Optimize Route
              </button>
              <button
                onClick={onClose}
                className="px-6 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                id="back-modal-btn"
              >
                Back
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
