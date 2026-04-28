import React from 'react';
import { Shipment } from '../types';
import { Bell, AlertCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

interface AlertsProps {
  shipments: Shipment[];
}

export default function Alerts({ shipments }: AlertsProps) {
  const criticalAlerts = shipments.filter(s => s.risk > 0.7 || (s.risk > 0.5 && s.trend === 'increasing'));
  const warningAlerts = shipments.filter(s => (s.risk > 0.4 && s.risk <= 0.7 && s.trend !== 'increasing') || (s.trend === 'increasing' && s.risk <= 0.5));

  return (
    <div className="p-6 space-y-8 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
          <Bell className="text-blue-600" />
          Neural Alert System
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Critical Alerts */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-rose-500 flex items-center gap-2 mb-4">
            <AlertCircle size={14} />
            Critical Interventions Needed ({criticalAlerts.length})
          </h3>
          {criticalAlerts.length === 0 ? (
            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-widest text-center py-12">
              No critical threats detected
            </div>
          ) : (
            criticalAlerts.map(s => (
              <div key={s.id} className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 p-4 rounded-xl">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">High Risk Detected</span>
                  <span className="text-[10px] font-mono font-bold text-rose-400">ID: #{s.id}</span>
                </div>
                <p className="text-sm font-bold text-rose-900 dark:text-rose-100 mb-2">Immediate action required for shipment to {s.destination}.</p>
                <p className="text-xs text-rose-700 dark:text-rose-300 opacity-80">Risk level reached {(s.risk * 100).toFixed(0)}%. Protocol Delta-7 initiated.</p>
              </div>
            ))
          )}
        </div>

        {/* Warning Alerts */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-amber-500 flex items-center gap-2 mb-4">
            <AlertTriangle size={14} />
            Monitoring Required ({warningAlerts.length})
          </h3>
          {warningAlerts.length === 0 ? (
            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-widest text-center py-12">
              All systems nominal
            </div>
          ) : (
            warningAlerts.map(s => (
              <div key={s.id} className="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 p-4 rounded-xl">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Elevated Risk Vector</span>
                  <span className="text-[10px] font-mono font-bold text-amber-400">ID: #{s.id}</span>
                </div>
                <p className="text-sm font-bold text-amber-900 dark:text-amber-100 mb-2">Monitor shipment movement to {s.destination}.</p>
                <p className="text-xs text-amber-700 dark:text-amber-300 opacity-80">Risk level is {(s.risk * 100).toFixed(0)}%. No immediate action but vigilance required.</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
