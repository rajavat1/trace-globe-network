import { useState } from "react";
import TracerouteInput from "@/components/TracerouteInput";
import NetworkGlobe from "@/components/NetworkGlobe";
import HopsList from "@/components/HopsList";
import { useToast } from "@/hooks/use-toast";

// Demo data for visualization (will be replaced with real backend)
const demoHops = [
  {
    id: 1,
    ip: "192.168.1.1",
    hostname: "gateway.local",
    latency: 2,
    location: { lat: 37.7749, lng: -122.4194, city: "San Francisco", country: "USA" }
  },
  {
    id: 2,
    ip: "10.0.0.1",
    hostname: "isp.provider.com",
    latency: 15,
    location: { lat: 40.7128, lng: -74.0060, city: "New York", country: "USA" }
  },
  {
    id: 3,
    ip: "8.8.8.8",
    hostname: "dns.google",
    latency: 25,
    location: { lat: 51.5074, lng: -0.1278, city: "London", country: "UK" }
  }
];

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

const Index = () => {
  const [hops, setHops] = useState<Hop[]>([]);
  const [isTracing, setIsTracing] = useState(false);
  const [targetHost, setTargetHost] = useState<string>("");
  const { toast } = useToast();

  const handleStartTrace = async (target: string) => {
    setTargetHost(target);
    setIsTracing(true);
    setHops([]);

    toast({
      title: "Traceroute Started",
      description: `Tracing route to ${target}`,
    });

    // Simulate traceroute with demo data
    // In production, this would call a backend API
    for (let i = 0; i < demoHops.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setHops(prev => [...prev, demoHops[i]]);
    }

    setIsTracing(false);
    toast({
      title: "Traceroute Complete",
      description: `Found ${demoHops.length} hops to ${target}`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gradient-cyber">
            Network Traceroute Visualizer
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Trace network paths in real-time and visualize routing hops on an interactive 3D globe
          </p>
        </div>

        {/* Input Section */}
        <div className="max-w-2xl mx-auto">
          <TracerouteInput onStartTrace={handleStartTrace} isTracing={isTracing} />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
          {/* Globe - Takes 2 columns on large screens */}
          <div className="lg:col-span-2">
            <NetworkGlobe 
              hops={hops} 
              isTracing={isTracing} 
              targetHost={targetHost}
            />
          </div>
          
          {/* Hops List - Takes 1 column */}
          <div className="lg:col-span-1">
            <HopsList 
              hops={hops} 
              isTracing={isTracing}
              currentHop={isTracing ? hops.length : undefined}
            />
          </div>
        </div>

        {/* Status Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Real-time network traceroute with geographical visualization</p>
          <p className="mt-1">
            Currently showing demo data - connect to backend for live traceroute functionality
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;