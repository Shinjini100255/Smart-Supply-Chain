import React from 'react';
import { motion } from 'motion/react';
import { MapPin, AlertCircle, TrendingUp, TrendingDown, Eye } from 'lucide-react';
import { Shipment } from '../types';
import { cn } from '../lib/utils';

interface ShipmentCardProps {
  shipment: Shipment;
  onAnalyze: (shipment: Shipment) => void | Promise<void>;
  onOptimize: (shipment: Shipment) => void | Promise<void>;
  onView: (shipment: Shipment) => void;
}

export const ShipmentCard: React.FC<ShipmentCardProps> = ({ shipment, onAnalyze, onOptimize, onView }) => {
  const getRiskBorder = (risk: number) => {
    if (risk < 0.4) return 'border-l-emerald-500';
    if (risk < 0.7) return 'border-l-amber-500';
    return 'border-l-rose-500';
  };

  const getRiskBadge = (risk: number) => {
    if (risk < 0.4) return 'bg-emerald-100 text-emerald-700';
    if (risk < 0.7) return 'bg-amber-100 text-amber-700';
    return 'bg-rose-100 text-rose-700';
  };

  const calculateETA = (risk: number) => {
    const base = 24; // 24 hours base
    const delay = risk * 12; // up to 12 hours risk delay
    return `${(base + delay).toFixed(1)}h`;
  };

  const getTrendIcon = (trend?: string) => {
    if (trend === 'increasing') return <TrendingUp size={12} className="text-rose-500" />;
    if (trend === 'decreasing') return <TrendingDown size={12} className="text-emerald-500" />;
    return null;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={() => onView(shipment)}
      className={cn(
        "group relative overflow-hidden rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-all hover:border-blue-300 cursor-pointer dark:border-slate-800 dark:bg-slate-900 border-l-4",
        getRiskBorder(shipment.risk),
        shipment.isOptimized && "ring-2 ring-emerald-500/20"
      )}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight">ID: #{shipment.id}</span>
            {getTrendIcon(shipment.trend)}
            {shipment.isOptimized && (
              <span className="text-[8px] font-black bg-emerald-500 text-white px-1 rounded uppercase">Optimized</span>
            )}
            {shipment.flags?.map(flag => (
              <span key={flag} className={cn(
                "text-[8px] font-black px-1 rounded uppercase flex items-center gap-0.5 shadow-sm",
                flag === 'held' ? "bg-slate-800 text-white" :
                flag === 'delayed' ? "bg-amber-500 text-white" :
                flag === 'high_risk' ? "bg-rose-600 text-white" : "bg-slate-100 text-slate-600"
              )}>
                {flag === 'held' && "⛔ Held"}
                {flag === 'delayed' && "⏳ Delayed"}
                {flag === 'high_risk' && "🔴 High Risk"}
                {!['held', 'delayed', 'high_risk'].includes(flag) && flag}
              </span>
            ))}
          </div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate max-w-[140px]">
            {shipment.destination}
          </h4>
        </div>
        <div className="flex flex-col items-end">
          <span className={cn("px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase", getRiskBadge(shipment.risk))}>
            RISK {shipment.risk.toFixed(2)}
          </span>
          {shipment.priorityScore !== undefined && (
            <span className="text-[8px] font-bold text-slate-400 mt-0.5">P-SCORE: {shipment.priorityScore}</span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-1">
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Impact: <span className="font-bold text-slate-700 dark:text-slate-300">{shipment.impactScore || 'Low'}</span>
        </p>
        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 rounded dark:bg-blue-900/30">
          ETA: {calculateETA(shipment.risk)}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <div className={cn(
            "h-1.5 w-1.5 rounded-full shrink-0",
            shipment.status === 'Delivered' ? "bg-emerald-500" : "bg-blue-500 animate-pulse"
          )}></div>
          <span className="text-[10px] text-slate-400 italic font-medium tracking-tight truncate">
            {shipment.status} {shipment.status !== 'Delivered' && "• Moving..."} • {shipment.origin}
          </span>
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAnalyze(shipment);
            }}
            className="text-[9px] font-bold text-blue-600 border border-blue-600 px-2 py-0.5 rounded hover:bg-blue-50 transition-colors uppercase tracking-tight dark:text-blue-400 dark:border-blue-400 dark:hover:bg-blue-900/30"
          >
            Info
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOptimize(shipment);
            }}
            className="text-[9px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded hover:bg-blue-700 transition-colors uppercase tracking-tight shadow-sm"
          >
            Optimize
          </button>
        </div>
      </div>
    </motion.div>
  );
};

function Zap({ size, className }: { size: number, className: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}
