import React from 'react';
import { ShipmentHistoryEntry } from '../types';
import { History, Clock, MapPin, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { format } from 'date-fns';

interface ShipmentHistoryProps {
  history: ShipmentHistoryEntry[];
}

export default function ShipmentHistory({ history }: ShipmentHistoryProps) {
  return (
    <div className="p-6 space-y-8 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
          <History className="text-blue-600" />
          Shipment Immutable Ledger
        </h2>
      </div>

      <div className="space-y-4">
        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Clock size={48} className="mb-4 opacity-20" />
            <p className="font-bold text-sm uppercase tracking-widest">No historical vectors found</p>
          </div>
        ) : (
          history.map((entry) => (
            <div key={entry.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-6">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
                entry.risk > 0.7 ? 'bg-rose-50 text-rose-600' : 
                entry.risk > 0.4 ? 'bg-amber-50 text-amber-600' : 
                'bg-emerald-50 text-emerald-600'
              }`}>
                <AlertCircle size={24} />
              </div>

              <div className="flex-1 grid grid-cols-4 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Shipment ID</p>
                  <p className="text-sm font-black text-slate-800 dark:text-slate-100">#{entry.shipmentId}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Status Update</p>
                  <p className="text-sm font-bold text-blue-600">{entry.actionTaken ? `Optimized: ${entry.actionTaken}` : entry.status}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Risk Vector</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-mono font-bold">{(entry.risk * 100).toFixed(0)}%</p>
                    {entry.trend === 'increasing' && <TrendingUp size={12} className="text-rose-500" />}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Timestamp</p>
                  <p className="text-xs font-medium text-slate-500">
                    {entry.timestamp?.toDate ? format(entry.timestamp.toDate(), 'HH:mm:ss d MMM') : 'Just now'}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                  <MapPin size={10} />
                  {entry.lat.toFixed(2)}, {entry.lng.toFixed(2)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
