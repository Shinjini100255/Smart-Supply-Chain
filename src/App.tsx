import { useEffect, useState, useMemo, useRef } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  addDoc,
  setDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Routes, Route, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Search, Filter, RefreshCcw, LogIn, LayoutDashboard, Database, AlertCircle, Ship, History, Bell, Navigation } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { db, auth, signInWithGoogle, handleFirestoreError, OperationType } from './lib/firebase';
import { cn } from './lib/utils';
import { Shipment, AIAnalysis, RouteOptimization, ShipmentHistoryEntry } from './types';
import { ShipmentCard } from './components/ShipmentCard';
import MapView from './components/MapView';
import AIAnalysisModal from './components/AIAnalysisModal';
import OptimizeModal from './components/OptimizeModal';
import { ShipmentDetailModal } from './components/ShipmentDetailModal';
import { analyzeShipmentRisk, optimizeRoute } from './services/geminiService';

// Pages
import LiveShipments from './pages/LiveShipments';
import RiskAnalytics from './pages/RiskAnalytics';
import ShipmentHistory from './pages/ShipmentHistory';
import Alerts from './pages/Alerts';

// Indian City Coordinates Mapping
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  'Mumbai': { lat: 19.0760, lng: 72.8777 },
  'Delhi': { lat: 28.6139, lng: 77.2090 },
  'Bangalore': { lat: 12.9716, lng: 77.5946 },
  'Hyderabad': { lat: 17.3850, lng: 78.4867 },
  'Ahmedabad': { lat: 23.0225, lng: 72.5714 },
  'Chennai': { lat: 13.0827, lng: 80.2707 },
  'Kolkata': { lat: 22.5726, lng: 88.3639 },
  'Jaipur': { lat: 26.9124, lng: 75.7873 },
  'Lucknow': { lat: 26.8467, lng: 80.9462 },
  'Indore': { lat: 22.7196, lng: 75.8577 },
  'Nagpur': { lat: 21.1458, lng: 79.0882 },
  'Pune': { lat: 18.5204, lng: 73.8567 },
  'Nashik': { lat: 19.9975, lng: 73.7898 },
  'Surat': { lat: 21.1702, lng: 72.8311 },
  'Bhopal': { lat: 23.2599, lng: 77.4126 }
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [history, setHistory] = useState<ShipmentHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<'All' | 'High' | 'Medium' | 'Low'>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Modal states
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [isOptimizeModalOpen, setIsOptimizeModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [optimization, setOptimization] = useState<RouteOptimization | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [mapFocusId, setMapFocusId] = useState<string | null>(null);

  const lastSnapshotRef = useRef<Record<string, { status: string; risk: number }>>({});

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'shipments'));
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Shipment[];
        setShipments(data);
        setIsLoading(false);

        // Logging history
        data.forEach(ship => {
          const last = lastSnapshotRef.current[ship.id];
          if (!last || last.status !== ship.status || last.risk !== ship.risk) {
            addDoc(collection(db, 'shipmentHistory'), {
              shipmentId: ship.id,
              status: ship.status,
              risk: ship.risk,
              lat: ship.lat,
              lng: ship.lng,
              timestamp: serverTimestamp()
            }).catch(console.error);
            lastSnapshotRef.current[ship.id] = { status: ship.status, risk: ship.risk };
          }
        });
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, 'shipments');
        setError("Failed to fetch shipments. Check security rules.");
        setIsLoading(false);
      }
    );

    const historyQuery = query(collection(db, 'shipmentHistory'), orderBy('timestamp', 'desc'), limit(50));
    const unsubscribeHistory = onSnapshot(historyQuery, (snapshot) => {
      setHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ShipmentHistoryEntry[]);
    });

    return () => {
      unsubscribe();
      unsubscribeHistory();
    };
  }, [user]);

  // Simulated movement logic (Route-based)
  useEffect(() => {
    if (shipments.length === 0 || !user) return;

    const interval = setInterval(async () => {
      const activeShipments = shipments.filter(s => s.status !== 'Delivered' && s.route && s.route.length > 0);
      if (activeShipments.length === 0) return;

      const ship = activeShipments[Math.floor(Math.random() * activeShipments.length)];
      const currentIndex = ship.currentIndex ?? 0;
      const route = ship.route || [];

      // Check for exceptions (delayed/held)
      const isExceptional = ship.flags?.includes('delayed') || ship.flags?.includes('held');
      if (isExceptional && Math.random() > 0.3) {
        // Skip movement for delayed/held shipments 70% of the time
        return;
      }

      // Randomly trigger exception
      if (!isExceptional && Math.random() < 0.1) {
        const flag = Math.random() > 0.5 ? 'delayed' : 'held';
        try {
          await updateDoc(doc(db, 'shipments', ship.id), {
            flags: [...(ship.flags || []), flag],
            risk: Math.min(1, ship.risk + 0.2),
            lastUpdated: new Date().toISOString()
          });
        } catch (e) { console.error(e); }
        return;
      }

      if (currentIndex < route.length - 1) {
        const nextIndex = currentIndex + 1;
        const nextCity = route[nextIndex];
        const coords = CITY_COORDS[nextCity] || { lat: ship.lat, lng: ship.lng };
        
        let newStatus: Shipment['status'] = 'In Transit';
        if (nextIndex === 0) newStatus = 'Processing';
        else if (nextIndex === 1) newStatus = 'Dispatched';
        else if (nextIndex === route.length - 2) newStatus = 'Out for Delivery';
        else if (nextIndex === route.length - 1) newStatus = 'Delivered';

        // Clear exceptions if moving
        const newFlags = (ship.flags || []).filter(f => f !== 'delayed' && f !== 'held');

        try {
          await updateDoc(doc(db, 'shipments', ship.id), {
            lat: coords.lat,
            lng: coords.lng,
            currentIndex: nextIndex,
            status: newStatus,
            flags: newFlags,
            lastUpdated: new Date().toISOString(),
            risk: Math.max(0.05, Math.min(1.0, ship.risk + (Math.random() - 0.5) * 0.1))
          });
        } catch (err) {
          console.warn("Simulation failed:", err);
          handleFirestoreError(err, OperationType.WRITE, `shipments/${ship.id}`);
        }
      }
    }, 7000);

    return () => clearInterval(interval);
  }, [shipments.length, user]);

  // Ranking, Trend & Normalization Logic
  const processedShipments = useMemo(() => {
    const knownFlowStatuses = ['Processing', 'Ready for Dispatch', 'Dispatched', 'In Transit', 'At Hub', 'Out for Delivery', 'Delivered'];
    
    return shipments.map(s => {
      const prev = lastSnapshotRef.current[s.id];
      const trend = !prev ? 'stable' : s.risk > prev.risk ? 'increasing' : s.risk < prev.risk ? 'decreasing' : 'stable';
      
      // Normalize Status & Flags
      let normalizedStatus = s.status;
      const flags = [...(s.flags || [])];
      const statusLower = String(s.status).toLowerCase();

      if (statusLower === 'held' || statusLower === 'delayed') {
        normalizedStatus = 'In Transit';
        if (!flags.includes(statusLower)) {
          flags.push(statusLower);
        }
      } else if (!knownFlowStatuses.includes(s.status)) {
        normalizedStatus = 'In Transit';
      }

      if (s.risk > 0.7 && !flags.includes('high_risk')) {
        flags.push('high_risk');
      }
      
      // Heuristic Priority Score
      let pScore = Math.floor(s.risk * 70);
      if (trend === 'increasing') pScore += 20;
      if (flags.includes('delayed')) pScore += 10;
      if (s.isOptimized) pScore -= 15;
      
      // Heuristic Impact Score
      const impactScore = s.risk > 0.8 ? 'High' : s.risk > 0.5 ? 'Medium' : 'Low';
      const affectedShipments = s.risk > 0.8 ? 12 : s.risk > 0.5 ? 4 : 0;

      return {
        ...s,
        status: normalizedStatus as any,
        flags,
        trend,
        priorityScore: Math.max(0, Math.min(100, pScore)),
        impactScore,
        affectedShipments
      } as Shipment;
    }).sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));
  }, [shipments]);

  const filteredShipments = useMemo(() => {
    return processedShipments.filter(s => {
      const matchesSearch = s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.destination.toLowerCase().includes(searchQuery.toLowerCase());
      
      const riskLevel = s.risk > 0.7 ? 'High' : s.risk > 0.4 ? 'Medium' : 'Low';
      const matchesRisk = riskFilter === 'All' || riskLevel === riskFilter;
      
      const matchesStatus = statusFilter === 'All' || s.status === statusFilter;

      return matchesSearch && matchesRisk && matchesStatus;
    });
  }, [processedShipments, searchQuery, riskFilter, statusFilter]);

  const stats = useMemo(() => {
    const highRisk = shipments.filter(s => s.risk > 0.7).length;
    const avgRisk = shipments.length > 0 
      ? shipments.reduce((sum, s) => sum + s.risk, 0) / shipments.length 
      : 0;
    const criticalImpact = processedShipments.filter(s => s.impactScore === 'High').length;
    
    return {
      active: shipments.length,
      highRisk,
      avgRisk: avgRisk.toFixed(2),
      onTime: 94.2,
      criticalImpact
    };
  }, [shipments, processedShipments]);

  const topCritical = useMemo(() => {
    return processedShipments.filter(s => s.priorityScore && s.priorityScore > 75).slice(0, 3);
  }, [processedShipments]);

  const handleSeedData = async () => {
    if (!user) return;
    setIsLoading(true);
    const mockShipments = [
      { id: 'IND-101', origin: 'Mumbai', destination: 'Delhi', route: ['Mumbai', 'Nashik', 'Indore', 'Jaipur', 'Delhi'], currentIndex: 0, lat: 19.0760, lng: 72.8777, status: 'Processing', risk: 0.15 },
      { id: 'IND-102', origin: 'Bangalore', destination: 'Hyderabad', route: ['Bangalore', 'Anantapur', 'Kurnool', 'Hyderabad'], currentIndex: 1, lat: 14.6819, lng: 77.6006, status: 'Dispatched', risk: 0.25 },
      { id: 'IND-103', origin: 'Delhi', destination: 'Kolkata', route: ['Delhi', 'Lucknow', 'Varanasi', 'Asansol', 'Kolkata'], currentIndex: 2, lat: 25.3176, lng: 82.9739, status: 'In Transit', flags: ['delayed'], risk: 0.82 },
      { id: 'IND-104', origin: 'Chennai', destination: 'Bangalore', route: ['Chennai', 'Vellore', 'Bangalore'], currentIndex: 2, lat: 12.9716, lng: 77.5946, status: 'Delivered', risk: 0.05 },
      { id: 'IND-105', origin: 'Ahmedabad', destination: 'Mumbai', route: ['Ahmedabad', 'Vadodara', 'Surat', 'Mumbai'], currentIndex: 1, lat: 22.3072, lng: 73.1812, status: 'Dispatched', risk: 0.18 },
      { id: 'IND-106', origin: 'Jaipur', destination: 'Delhi', route: ['Jaipur', 'Alwar', 'Delhi'], currentIndex: 0, lat: 26.9124, lng: 75.7873, status: 'Processing', risk: 0.12 },
      { id: 'IND-107', origin: 'Bhopal', destination: 'Nagpur', route: ['Bhopal', 'Itarsi', 'Nagpur'], currentIndex: 1, lat: 22.6124, lng: 77.7554, status: 'Dispatched', risk: 0.28 },
      { id: 'IND-108', origin: 'Lucknow', destination: 'Delhi', route: ['Lucknow', 'Bareilly', 'Delhi'], currentIndex: 1, lat: 28.3670, lng: 79.4304, status: 'Dispatched', risk: 0.10 },
      { id: 'IND-109', origin: 'Pune', destination: 'Nashik', route: ['Pune', 'Sangamner', 'Nashik'], currentIndex: 0, lat: 18.5204, lng: 73.8567, status: 'Processing', risk: 0.08 },
      { id: 'IND-110', origin: 'Kolkata', destination: 'Hyderabad', route: ['Kolkata', 'Bhubaneswar', 'Visakhapatnam', 'Vijayawada', 'Hyderabad'], currentIndex: 2, lat: 17.6868, lng: 83.2185, status: 'In Transit', risk: 0.35 }
    ];

    try {
      for (const ship of mockShipments) {
        await setDoc(doc(db, 'shipments', ship.id), {
          ...ship,
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'shipments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyze = async (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setIsAnalysisModalOpen(true);
    setIsAnalyzing(true);
    setAnalysis(null);
    
    try {
      const result = await analyzeShipmentRisk(shipment);
      setAnalysis(result);
    } catch (err) {
      setError("AI Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleOptimize = async (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setIsOptimizeModalOpen(true);
    setIsOptimizing(true);
    setOptimization(null);
    
    try {
      const result = await optimizeRoute(shipment);
      setOptimization(result);
    } catch (err) {
      setError("AI Optimization failed. Please try again.");
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleShowDetails = (shipment: Shipment) => {
    setSelectedShipment(shipment);
    setIsDetailModalOpen(true);
  };

  const applyOptimization = async () => {
    if (!selectedShipment || !optimization) return;
    
    try {
      const shipRef = doc(db, 'shipments', selectedShipment.id);
      await updateDoc(shipRef, {
        risk: selectedShipment.risk * 0.6, // Simulate risk reduction
        status: optimization.suggestedAction === 'Reroute' ? 'In Transit' : selectedShipment.status,
        isOptimized: true,
        lastUpdated: new Date().toISOString()
      });
      
      await addDoc(collection(db, 'shipmentHistory'), {
        shipmentId: selectedShipment.id,
        actionTaken: optimization.suggestedAction,
        risk: selectedShipment.risk * 0.6,
        status: selectedShipment.status,
        lat: selectedShipment.lat,
        lng: selectedShipment.lng,
        timestamp: serverTimestamp()
      });

      setIsOptimizeModalOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'shipments');
    }
  };

  const handleViewOnMap = (shipment: Shipment) => {
    navigate('/');
    setMapFocusId(shipment.id);
    setTimeout(() => setMapFocusId(null), 1000);
  };

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 dark:bg-slate-950 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-8 rounded-3xl bg-white p-10 shadow-2xl shadow-indigo-500/10 dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
        >
          <div className="flex flex-col items-center text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30">
              <Ship className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">LogiSphere AI</h1>
            <p className="mt-2 text-slate-500 font-medium text-sm">Access your high-precision logistics monitoring engine</p>
          </div>

          <button
            onClick={signInWithGoogle}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white py-4 font-bold text-slate-700 transition-all hover:bg-slate-50 hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <LogIn className="h-5 w-5 text-blue-600" />
            Sign in with Google
          </button>

          <p className="text-center text-[10px] uppercase font-black tracking-widest text-slate-400">
            Secure enterprise access. Managed by AI Studio.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 flex-shrink-0 flex flex-col border-r border-slate-800">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center shadow-lg shadow-blue-900/50 text-white">
              <Ship className="h-5 w-5" />
            </div>
            <span className="font-bold text-white tracking-tight">LogiSphere AI</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <NavLink 
            to="/" 
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors",
              isActive ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
            )}
          >
            <LayoutDashboard size={16} />
            Dashboard
          </NavLink>
          <NavLink 
            to="/live" 
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors",
              isActive ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
            )}
          >
            <Ship size={16} />
            Live Shipments
          </NavLink>
          <NavLink 
            to="/risk" 
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors",
              isActive ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
            )}
          >
            <AlertCircle size={16} />
            Risk Analytics
          </NavLink>
          <NavLink 
            to="/history" 
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors",
              isActive ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
            )}
          >
            <History size={16} />
            Shipment History
          </NavLink>
          <NavLink 
            to="/alerts" 
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm transition-colors",
              isActive ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
            )}
          >
            <Bell size={16} />
            Alerts
            {shipments.filter(s => s.risk > 0.7).length > 0 && (
              <span className="ml-auto w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
            )}
          </NavLink>
        </nav>

        <div className="p-4 mt-auto">
          <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-2">Gemini AI Status</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs text-slate-300 font-medium">Online & Analyzing</span>
            </div>
          </div>
          
          <div className="mt-4 flex items-center gap-3 px-2">
            <img 
              src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
              alt="Profile" 
              className="h-8 w-8 rounded-full ring-2 ring-slate-800"
            />
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{user.displayName || 'Admin'}</p>
              <p className="text-[10px] text-slate-500 truncate">System Authority</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 dark:bg-slate-900 dark:border-slate-800">
          <h1 className="text-xl font-bold text-slate-800 dark:text-white">Smart Supply Chain Dashboard</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search Shipments..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-100 text-xs rounded-full py-2 pl-10 pr-4 w-64 border-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-800"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors dark:bg-slate-800"
            >
              <RefreshCcw size={16} />
            </button>
          </div>
        </header>

        {/* Routing Section */}
        <div className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={
              <div className="flex flex-col h-full overflow-hidden">
                {/* Stats Row */}
                <section className="grid grid-cols-4 gap-4 p-6 shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm text-[10px]">
                    <p className="font-bold text-slate-500 uppercase tracking-tight">Decision Points</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.active}</p>
                    <div className="flex items-center gap-1 mt-1 text-emerald-600 font-bold uppercase tracking-tight">
                      Active Vectors
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Critical Interventions</p>
                    <p className="text-2xl font-black text-rose-600 mt-1">{stats.highRisk}</p>
                    <div className="flex items-center gap-1 mt-1 text-rose-500 text-[10px] font-bold uppercase tracking-tight font-mono">
                      IMMEDIATE ACTION
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Mean System Risk</p>
                    <p className="text-2xl font-black text-amber-600 mt-1">{stats.avgRisk}</p>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
                      <div className="bg-amber-500 h-full" style={{ width: `${Number(stats.avgRisk) * 100}%` }}></div>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Network Impact Index</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.criticalImpact}</p>
                    <div className="flex items-center gap-1 mt-1 text-blue-600 text-[10px] font-bold uppercase tracking-tight">
                      Nodes at high risk
                    </div>
                  </div>
                </section>

                <div className="flex-1 flex overflow-hidden">
                  {/* List Panel */}
                  <div className="w-1/3 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
                      <h3 className="font-bold text-slate-800 dark:text-white text-sm">Critical Priority</h3>
                      <div className="flex gap-1">
                        {(['All', 'High', 'Med', 'Low'] as const).map(level => (
                          <button
                            key={level}
                            onClick={() => setRiskFilter(level === 'Med' ? 'Medium' : level as any)}
                            className={`text-[9px] px-2 py-1 rounded font-black uppercase tracking-widest transition-all ${
                              (riskFilter === 'Medium' ? 'Med' : riskFilter) === level 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-slate-200 text-slate-500 hover:bg-slate-300 dark:bg-slate-800'
                            }`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {/* Priority Queue Subsection */}
                      {topCritical.length > 0 && searchQuery === '' && (
                        <div className="mb-6">
                           <h4 className="text-[10px] font-black uppercase text-rose-500 mb-3 tracking-widest flex items-center gap-2">
                             <AlertCircle size={12} />
                             Immediate Priority Queue
                           </h4>
                           <div className="space-y-3">
                             {topCritical.map(s => (
                               <ShipmentCard 
                                 key={s.id} 
                                 shipment={s} 
                                 onAnalyze={handleAnalyze}
                                 onOptimize={handleOptimize}
                                 onView={handleViewOnMap}
                               />
                             ))}
                           </div>
                           <div className="h-px bg-slate-200 dark:bg-slate-800 my-6" />
                           <h4 className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Fleet Overview</h4>
                        </div>
                      )}

                      {isLoading ? (
                        <div className="space-y-3">
                          {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-28 w-full animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
                          ))}
                        </div>
                      ) : error ? (
                        <div className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-center dark:border-rose-900/30 dark:bg-rose-950/20">
                          <AlertCircle size={16} className="mx-auto mb-2 text-rose-500" />
                          <p className="text-[11px] font-bold text-rose-600 tracking-tight">{error}</p>
                        </div>
                      ) : filteredShipments.length === 0 ? (
                        <div className="flex h-64 flex-col items-center justify-center text-center">
                          <Filter className="mb-4 h-8 w-8 text-slate-300" />
                          <h4 className="font-bold text-slate-600 text-sm">No shipments target</h4>
                          {shipments.length === 0 && (
                            <button onClick={handleSeedData} className="mt-2 text-[10px] font-black text-blue-600 uppercase underline">Seed Mock Data</button>
                          )}
                        </div>
                      ) : (
                        filteredShipments.map(s => (
                          <ShipmentCard 
                            key={s.id} 
                            shipment={s} 
                            onAnalyze={handleAnalyze}
                            onOptimize={handleOptimize}
                            onView={handleViewOnMap}
                          />
                        ))
                      )}
                    </div>
                  </div>

                  {/* Map View Section */}
                  <div className="flex-1 p-6 relative">
                    <div className="h-full w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner bg-slate-100 dark:bg-slate-900">
                      <MapView 
                        shipments={filteredShipments} 
                        selectedShipmentId={mapFocusId}
                        onMarkerClick={(s) => setSelectedShipment(s)}
                        onOptimize={handleOptimize}
                      />
                    </div>
                    <div className="absolute top-10 right-10 z-10 pointer-events-none">
                      <div className="bg-white px-3 py-1.5 rounded-full shadow-md flex items-center gap-2 border border-slate-100 dark:bg-slate-800 dark:border-slate-700">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50"></div>
                        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-tight">System Authority Stable</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            } />
            <Route path="/live" element={
              <LiveShipments 
                shipments={filteredShipments}
                onAnalyze={handleAnalyze}
                onOptimize={handleOptimize}
                onView={handleShowDetails}
              />
            } />
            <Route path="/risk" element={<RiskAnalytics shipments={processedShipments} />} />
            <Route path="/history" element={<ShipmentHistory history={history} />} />
            <Route path="/alerts" element={<Alerts shipments={processedShipments} />} />
          </Routes>
        </div>
      </main>

      <AIAnalysisModal 
        isOpen={isAnalysisModalOpen}
        onClose={() => setIsAnalysisModalOpen(false)}
        shipment={selectedShipment}
        analysis={analysis}
        isLoading={isAnalyzing}
      />

      <OptimizeModal
        isOpen={isOptimizeModalOpen}
        onClose={() => setIsOptimizeModalOpen(false)}
        onApply={applyOptimization}
        shipment={selectedShipment}
        optimization={optimization}
        isLoading={isOptimizing}
      />

      <ShipmentDetailModal 
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        shipment={selectedShipment}
        onOptimize={(s) => {
          setIsDetailModalOpen(false);
          handleOptimize(s);
        }}
      />
    </div>
  );
}
