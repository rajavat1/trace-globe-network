import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Activity } from "lucide-react";

interface Hop {
  id: number;
  ip: string;
  hostname?: string;
  latency: number;
  location: {
    lat: number;
    lng: number;
    city?: string;
    country?: string;
  };
}

interface NetworkMapProps {
  hops: Hop[];
  isTracing: boolean;
  targetHost?: string;
}

const NetworkMap = ({ hops, isTracing, targetHost }: NetworkMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // For demo purposes, we'll use a placeholder token
    // In production, this should come from a secure environment variable
    mapboxgl.accessToken = 'YOUR_MAPBOX_TOKEN_HERE';
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      projection: 'globe',
      zoom: 1.5,
      center: [30, 15],
      pitch: 45,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    // Add atmosphere and fog effects
    map.current.on('style.load', () => {
      map.current?.setFog({
        color: 'rgb(30, 30, 40)',
        'high-color': 'rgb(50, 50, 70)',
        'horizon-blend': 0.3,
      });
    });

    // Globe rotation animation
    const secondsPerRevolution = 240;
    const maxSpinZoom = 5;
    const slowSpinZoom = 3;
    let userInteracting = false;

    function spinGlobe() {
      if (!map.current) return;
      
      const zoom = map.current.getZoom();
      if (!userInteracting && zoom < maxSpinZoom) {
        let distancePerSecond = 360 / secondsPerRevolution;
        if (zoom > slowSpinZoom) {
          const zoomDif = (maxSpinZoom - zoom) / (maxSpinZoom - slowSpinZoom);
          distancePerSecond *= zoomDif;
        }
        const center = map.current.getCenter();
        center.lng -= distancePerSecond;
        map.current.easeTo({ center, duration: 1000, easing: (n) => n });
      }
    }

    map.current.on('mousedown', () => {
      userInteracting = true;
    });
    
    map.current.on('mouseup', () => {
      userInteracting = false;
      spinGlobe();
    });

    map.current.on('moveend', () => {
      spinGlobe();
    });

    spinGlobe();

    return () => {
      map.current?.remove();
    };
  }, []);

  // Add markers and routes when hops change
  useEffect(() => {
    if (!map.current || hops.length === 0) return;

    // Clear existing layers and sources
    const existingLayers = ['route-line', 'hop-points', 'hop-labels'];
    existingLayers.forEach(layerId => {
      if (map.current?.getLayer(layerId)) {
        map.current.removeLayer(layerId);
      }
    });

    const existingSources = ['route', 'hops'];
    existingSources.forEach(sourceId => {
      if (map.current?.getSource(sourceId)) {
        map.current.removeSource(sourceId);
      }
    });

    // Create route line
    if (hops.length > 1) {
      const coordinates = hops.map(hop => [hop.location.lng, hop.location.lat]);
      
      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: coordinates
          }
        }
      });

      map.current.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#00BFFF',
          'line-width': 3,
          'line-opacity': 0.8
        }
      });
    }

    // Add hop markers
    const hopFeatures = hops.map(hop => ({
      type: 'Feature' as const,
      properties: {
        id: hop.id,
        ip: hop.ip,
        hostname: hop.hostname,
        latency: hop.latency,
        city: hop.location.city,
        country: hop.location.country
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [hop.location.lng, hop.location.lat]
      }
    }));

    map.current.addSource('hops', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: hopFeatures
      }
    });

    map.current.addLayer({
      id: 'hop-points',
      type: 'circle',
      source: 'hops',
      paint: {
        'circle-radius': 8,
        'circle-color': '#00FF7F',
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.9
      }
    });

    // Add popups on click
    map.current.on('click', 'hop-points', (e) => {
      if (!e.features || !e.features[0]) return;
      
      const properties = e.features[0].properties;
      const coordinates = (e.features[0].geometry as any).coordinates.slice();

      new mapboxgl.Popup()
        .setLngLat(coordinates)
        .setHTML(`
          <div class="p-3 bg-gray-900 text-white rounded">
            <div class="font-bold text-cyan-400">Hop ${properties.id}</div>
            <div class="text-sm">IP: ${properties.ip}</div>
            ${properties.hostname ? `<div class="text-sm">Host: ${properties.hostname}</div>` : ''}
            <div class="text-sm">Latency: ${properties.latency}ms</div>
            ${properties.city ? `<div class="text-sm">Location: ${properties.city}, ${properties.country}</div>` : ''}
          </div>
        `)
        .addTo(map.current!);
    });

    // Fit bounds to show all hops
    if (hops.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      hops.forEach(hop => {
        bounds.extend([hop.location.lng, hop.location.lat]);
      });
      map.current.fitBounds(bounds, { padding: 50 });
    }

  }, [hops]);

  return (
    <Card className="h-full border-glow bg-card/80 backdrop-blur-sm overflow-hidden">
      <div className="h-full relative">
        <div className="absolute top-4 left-4 z-10 space-y-2">
          <Badge variant="secondary" className="bg-secondary/20 border border-secondary/30">
            <MapPin className="w-3 h-3 mr-1" />
            {targetHost || "Waiting for target..."}
          </Badge>
          {isTracing && (
            <Badge variant="outline" className="bg-accent/20 border border-accent/30 animate-pulse">
              <Activity className="w-3 h-3 mr-1" />
              Tracing...
            </Badge>
          )}
        </div>
        
        <div ref={mapContainer} className="h-full w-full rounded-lg" />
        
        {hops.length === 0 && !isTracing && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/20 backdrop-blur-sm">
            <div className="text-center p-6">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-primary animate-network-pulse" />
              <h3 className="text-lg font-semibold text-gradient-cyber mb-2">Network Globe Ready</h3>
              <p className="text-muted-foreground">Start a traceroute to visualize the network path</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default NetworkMap;