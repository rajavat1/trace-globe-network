import express from 'express';
import { exec } from 'child_process';
import cors from 'cors';
import { promisify } from 'util';
const execAsync = promisify(exec);
const app = express();

app.use(cors());
app.use(express.json());

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

async function getIpLocation(ip: string): Promise<Location | undefined> {
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}`);
    const data = await response.json();
    
    if (data.status === 'success') {
      return {
        lat: data.lat,
        lng: data.lon,
        city: data.city,
        country: data.country
      };
    }
    return undefined;
  } catch (error) {
    console.error('Error getting location for IP:', ip, error);
    return undefined;
  }
}

app.get('/', (req, res) => {
    res.send('Traceroute API is running');
});

app.post('/api/traceroute', async (req, res) => {
  try {
    const { target } = req.body;
    if (!target) {
      return res.status(400).json({ error: 'Target host is required' });
    }

    // Run traceroute command
    const { stdout } = await execAsync(`traceroute -n ${target}`);
    
    // Parse traceroute output
    const lines = stdout.split('\n').slice(1); // Skip the first line (header)
    const hops: Hop[] = [];
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      const parts = line.trim().split(/\s+/);
      const ip = parts[1] === '*' ? '' : parts[1];
      if (!ip) continue;

      try {
        const location = await getIpLocation(ip);
        const hop: Hop = {
          ip,
          hostname: ip, // Using IP as hostname for simplicity
          latency: parseFloat(parts[2]),
          location
        };
        
        hops.push(hop);
      } catch (error) {
        console.error(`Error getting geolocation for IP ${ip}:`, error);
      }
    }

    res.json({ hops });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
