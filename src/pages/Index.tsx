import { useState } from "react";
import TracerouteInput from "@/components/TracerouteInput";
import NetworkGlobe from "@/components/NetworkGlobe";
import HopsList from "@/components/HopsList";
import { useToast } from "@/hooks/use-toast";

// Interface for location data
interface Location {
  lat: number;
  lng: number;
  city: string;
  country: string;
}

interface Hop {
  ip: string;
  hostname: string;
  latency: number;
  location?: Location;
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

    try {
      const response = await fetch('https://legendary-acorn-g44vx76wwvg6hv7q7-3001.app.github.dev/api/traceroute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ target }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      setHops(data.hops);

      toast({
        title: "Traceroute Complete",
        description: `Found ${data.hops.length} hops to ${target}`,
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to complete traceroute. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTracing(false);
    }
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