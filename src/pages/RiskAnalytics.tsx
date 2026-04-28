import React from 'react';
import { Shipment } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend 
} from 'recharts';
import { TrendingUp, AlertTriangle, Activity } from 'lucide-react';

interface RiskAnalyticsProps {
  shipments: Shipment[];
}

export default function RiskAnalytics({ shipments }: RiskAnalyticsProps) {
  const riskDistribution = [
    { name: 'High', value: shipments.filter(s => s.risk > 0.7).length, color: '#ef4444' },
    { name: 'Medium', value: shipments.filter(s => s.risk > 0.4 && s.risk <= 0.7).length, color: '#f59e0b' },
    { name: 'Low', value: shipments.filter(s => s.risk <= 0.4).length, color: '#10b981' },
  ];

  const statusData = [
    { status: 'In Transit', count: shipments.filter(s => s.status === 'In Transit').length },
    { status: 'Delayed', count: shipments.filter(s => s.flags?.includes('delayed')).length },
    { status: 'Held', count: shipments.filter(s => s.flags?.includes('held')).length },
    { status: 'Processing', count: shipments.filter(s => s.status === 'Processing').length },
    { status: 'Delivered', count: shipments.filter(s => s.status === 'Delivered').length },
  ];

  return (
    <div className="p-6 space-y-8 overflow-y-auto h-full">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-2">
          <Activity className="text-blue-600" />
          Risk Analytics Engine
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Risk Distribution */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-500" />
            Risk Distribution
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Operational Status */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
            <TrendingUp size={14} className="text-blue-500" />
            Operational Status Breakdown
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="status" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
