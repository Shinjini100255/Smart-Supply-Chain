import { useEffect, useState } from 'react';
import { APIProvider, Map, Marker, InfoWindow, useMap } from '@vis.gl/react-google-maps';
import { Shipment } from '../types';

interface MapViewProps {
  shipments: Shipment[];
  selectedShipmentId: string | null;
  onMarkerClick: (shipment: Shipment) => void;
  onOptimize: (shipment: Shipment) => void;
}

const GOOGLE_MAPS_API_KEY = process.env.VITE_GOOGLE_MAPS_API_KEY || '';

export default function MapView({ shipments, selectedShipmentId, onMarkerClick, onOptimize }: MapViewProps) {
  const [center, setCenter] = useState({ lat: 20, lng: 77 });
  const [selectedMarker, setSelectedMarker] = useState<Shipment | null>(null);

  const getMarkerColor = (risk: number) => {
    if (risk < 0.4) return '#10b981'; // emerald
    if (risk < 0.7) return '#f59e0b'; // amber
    return '#ef4444'; // rose
  };

  const calculateETA = (risk: number) => {
    const base = 24; 
    const delay = risk * 12;
    return `${(base + delay).toFixed(1)}h`;
  };

  useEffect(() => {
    if (shipments.length > 0) {
      const avgLat = shipments.reduce((sum, s) => sum + s.lat, 0) / shipments.length;
      const avgLng = shipments.reduce((sum, s) => sum + s.lng, 0) / shipments.length;
      setCenter({ lat: avgLat, lng: avgLng });
    }
  }, [shipments.length]);

  useEffect(() => {
    if (selectedShipmentId) {
      const selected = shipments.find(s => s.id === selectedShipmentId);
      if (selected) {
        setSelectedMarker(selected);
        setCenter({ lat: selected.lat, lng: selected.lng });
      }
    }
  }, [selectedShipmentId, shipments]);

  return (
    <div className="h-full w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
      {GOOGLE_MAPS_API_KEY ? (
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
          <Map
            center={center}
            zoom={5}
            mapId="bf51a910020fa25a"
            className="h-full w-full"
            disableDefaultUI={true}
          >
            {shipments.map((shipment) => (
              <Marker
                key={shipment.id}
                position={{ lat: shipment.lat, lng: shipment.lng }}
                icon={`http://maps.google.com/mapfiles/ms/icons/${shipment.risk > 0.7 ? 'red' : shipment.risk > 0.4 ? 'orange' : 'green'}-dot.png`}
                onClick={() => {
                  setSelectedMarker(shipment);
                  onMarkerClick(shipment);
                }}
              />
            ))}

            {selectedMarker && (
              <InfoWindow
                position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
                onCloseClick={() => setSelectedMarker(null)}
              >
                <div className="p-3 min-w-[200px] font-sans">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-black text-slate-900 text-xs uppercase tracking-tight flex items-center gap-1">
                        #{selectedMarker.id}
                        {selectedMarker.trend === 'increasing' && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />}
                      </h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{selectedMarker.trend || 'stable'} trend</p>
                    </div>
                    <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">ETA: {calculateETA(selectedMarker.risk)}</span>
                  </div>
                  
                  <div className="bg-slate-50 p-2 rounded-lg mb-3 border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight mb-1">Decision Intelligence</p>
                    <p className="text-[11px] font-bold text-slate-800">
                      {selectedMarker.risk > 0.7 ? 'CRITICAL: Reroute advised to prevent cascading delay' : 
                       selectedMarker.risk > 0.4 ? 'WARNING: Monitor closely for congestion' : 
                       'CONTINUE: Nominal operations'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-col">
                      <p className="text-[8px] font-black text-slate-400 uppercase">Impact Score</p>
                      <span className={`text-[10px] font-black uppercase ${
                        selectedMarker.impactScore === 'High' ? 'text-rose-600' :
                        selectedMarker.impactScore === 'Medium' ? 'text-amber-500' : 'text-emerald-500'
                      }`}>
                        {selectedMarker.impactScore || 'Low'}
                      </span>
                    </div>
                    <button 
                      onClick={() => onOptimize(selectedMarker)}
                      className="bg-slate-900 text-white text-[9px] font-black px-3 py-2 rounded uppercase tracking-widest hover:bg-black transition-colors shadow-lg"
                    >
                      Optimize
                    </button>
                  </div>
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      ) : (
        <div className="flex h-full flex-col items-center justify-center p-6 text-center">
          <div className="mb-4 rounded-full bg-amber-100 p-3 text-amber-600 dark:bg-amber-950/30">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white">Google Maps Key Missing</h3>
          <p className="mt-2 text-sm text-slate-500 max-w-xs">
            Please provide a valid VITE_GOOGLE_MAPS_API_KEY in the Secrets panel to enable the map visualization.
          </p>
        </div>
      )}
    </div>
  );
}
