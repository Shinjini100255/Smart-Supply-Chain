import React from 'react';
import { Shipment, ShipmentStatus } from '../types';
import { ShipmentCard } from '../components/ShipmentCard';
import { Ship, ChevronRight, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface LiveShipmentsProps {
  shipments: Shipment[];
  onAnalyze: (s: Shipment) => void;
  onOptimize: (s: Shipment) => void;
  onView: (s: Shipment) => void;
}

const STAGES: { status: ShipmentStatus; label: string; icon: React.ReactNode }[] = [
  { status: 'Processing', label: 'Processing', icon: <Clock size={14} /> },
  { status: 'Ready for Dispatch', label: 'Ready', icon: <CheckCircle2 size={14} /> },
  { status: 'Dispatched', label: 'Dispatched', icon: <Ship size={14} /> },
  { status: 'In Transit', label: 'In Transit', icon: <motion.div animate={{ x: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 2 }}><ChevronRight size={14} /></motion.div> },
  { status: 'At Hub', label: 'At Hub', icon: <AlertCircle size={14} /> },
  { status: 'Out for Delivery', label: 'Out for Delivery', icon: <ChevronRight size={14} /> },
  { status: 'Delivered', label: 'Delivered', icon: <CheckCircle2 size={14} /> },
];

export default function LiveShipments({ shipments, onAnalyze, onOptimize, onView }: LiveShipmentsProps) {
  const getShipmentsByStatus = (status: ShipmentStatus) => {
    return shipments.filter(s => s.status === status);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
      <div className="p-6 shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
              <Ship className="text-blue-600" />
              Logistics Pipeline
            </h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time Stage Monitoring</p>
          </div>
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 dark:bg-rose-900/20 rounded-full border border-rose-100 dark:border-rose-900/30">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
              <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase">
                {shipments.filter(s => s.risk > 0.7).length} Critical Exceptions
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-6 h-full min-w-max pb-4">
          {STAGES.map((stage, idx) => {
            const stageShipments = getShipmentsByStatus(stage.status);
            return (
              <div 
                key={stage.status} 
                className="w-80 flex flex-col h-full bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800"
              >
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded bg-white dark:bg-slate-800 text-blue-600 border border-slate-200 dark:border-slate-700 shadow-sm">
                      {stage.icon}
                    </span>
                    <h3 className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">{stage.label}</h3>
                  </div>
                  <span className="text-[10px] font-black bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-400">
                    {stageShipments.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-4">
                  {stageShipments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl opacity-40">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">No Shipments</p>
                    </div>
                  ) : (
                    stageShipments.map(s => (
                      <div key={s.id} className="relative">
                        {s.risk > 0.7 && (
                          <div className="absolute -top-1 -right-1 z-10 flex items-center gap-1 bg-rose-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-lg shadow-rose-600/20 uppercase tracking-tighter ring-2 ring-white dark:ring-slate-900 animate-bounce">
                            Critical
                          </div>
                        )}
                        <ShipmentCard 
                          shipment={s} 
                          onAnalyze={onAnalyze}
                          onOptimize={onOptimize}
                          onView={onView}
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
