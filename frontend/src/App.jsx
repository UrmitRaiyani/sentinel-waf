
import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios'; 
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';


// If running locally, look at localhost:5000.
// If on AWS, look at the current URL.
const isLocal = window.location.hostname === 'localhost';
const API_URL = isLocal ? 'http://localhost:5000' : ''; 

// Initialize Socket
const socket = io(isLocal ? 'http://localhost:5000' : window.location.origin);

function App() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ SQL: 0, XSS: 0, DOS: 0 });

  useEffect(() => {
    // 1. FETCH HISTORY FROM DB (The Fix)
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/logs`);
        console.log("History Loaded:", res.data);
        setLogs(res.data);
        
        // Calculate stats from history
        const sqlCount = res.data.filter(l => l.type.includes('SQL')).length;
        const xssCount = res.data.filter(l => l.type.includes('XSS')).length;
        const dosCount = res.data.filter(l => l.type.includes('DoS')).length;
        setStats({ SQL: sqlCount, XSS: xssCount, DOS: dosCount });
      } catch (err) {
        console.error("Failed to load history:", err);
      }
    };

    fetchHistory();

    // 2. LISTEN FOR LIVE ATTACKS
    socket.on('attack-alert', (alert) => {
      setLogs((prev) => [alert, ...prev]);
      setStats((prev) => {
        if (alert.type.includes('SQL')) return { ...prev, SQL: prev.SQL + 1 };
        if (alert.type.includes('XSS')) return { ...prev, XSS: prev.XSS + 1 };
        if (alert.type.includes('DoS')) return { ...prev, DOS: prev.DOS + 1 };
        return prev;
      });
    });

    return () => socket.off('attack-alert');
  }, []);

  // Charts Config
  const chartData = [
    { name: 'SQL Injection', value: stats.SQL },
    { name: 'XSS Scripting', value: stats.XSS },
    { name: 'DoS Flood', value: stats.DOS },
  ];
  const COLORS = ['#ef4444', '#f59e0b', '#8b5cf6'];

  return (
    <div className="container">
      <div className="header">
        <h1>🛡️ Sentinel WAF Dashboard</h1>
        <p>Status: <span style={{color: '#22c55e'}}>● Online</span></p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Chart Section */}
        <div className="card">
          <h3>Threat Distribution</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" outerRadius={80} fill="#8884d8" dataKey="value" label>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stats Section */}
        <div className="card">
          <h3>Total Events</h3>
          <h1 style={{ fontSize: '4rem', margin: '20px 0' }}>{logs.length}</h1>
          <p>Database: <span style={{color: '#38bdf8'}}>Connected (Atlas)</span></p>
        </div>
      </div>

      {/* Logs Section */}
      <div className="card">
        <h3>🚨 Attack History (Live + DB)</h3>
        {logs.length === 0 ? <p>No attacks recorded yet.</p> : null}
        
        {logs.map((log, index) => (
          <div key={index} className={`log-item ${log.type.includes('SQL') ? 'critical' : 'warning'}`}>
            <span><strong>{log.type}</strong> from {log.ip}</span>
            <span style={{fontSize: '0.8rem', opacity: 0.7}}>
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;