export type ShipmentStatus = 
  | 'Processing' 
  | 'Ready for Dispatch' 
  | 'Dispatched' 
  | 'In Transit' 
  | 'At Hub' 
  | 'Out for Delivery' 
  | 'Delivered';

export interface Shipment {
  id: string;
  lat: number;
  lng: number;
  risk: number;
  prevRisk?: number;
  trend?: 'increasing' | 'stable' | 'decreasing';
  priorityScore?: number;
  impactScore?: 'Low' | 'Medium' | 'High';
  affectedShipments?: number;
  status: ShipmentStatus;
  flags?: string[];
  origin: string;
  destination: string;
  lastUpdated: string;
  isOptimized?: boolean;
  route?: string[];
  currentIndex?: number;
}

export interface AIAnalysis {
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  priorityScore: number;
  riskExplanation: string;
  possibleDisruptions: string[];
  mitigationStrategies: string[];
  impactAnalysis: {
    score: 'Low' | 'Medium' | 'High';
    description: string;
    affectedPaths: number;
  };
  confidenceScore: number;
}

export interface RouteOptimization {
  suggestedAction: 'Reroute' | 'Delay' | 'Continue';
  reason: string;
  alternativeRoute: string;
  estimatedDelay: string;
  timeSaved: string;
  riskReduction: string;
  optimizedETA: string;
}

export interface ShipmentHistoryEntry {
  id: string;
  shipmentId: string;
  risk: number;
  trend?: string;
  status: ShipmentStatus;
  timestamp: any; // Firestore Timestamp
  lat: number;
  lng: number;
  actionTaken?: string;
}
