// frontend/src/App.jsx
import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Connect to backend
const socket = io('http://localhost:5000');

function App() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ SQL: 0, XSS: 0 });

  useEffect(() => {

  // debug connection
    socket.on('connect', () => {
      console.log("✅ Connected to Backend via WebSocket!");
    });
    
    socket.on('connect_error', (err) => {
      console.error("❌ Connection failed:", err);
    });


    // Listen for incoming attack alerts
    socket.on('attack-alert', (alert) => {
      console.log("Attack received:", alert);
      
      // Update logs (add new one to the top)
      setLogs((prevLogs) => [alert, ...prevLogs]);

      // Update stats for the chart
      setStats((prevStats) => {
        const type = alert.type.includes('SQL') ? 'SQL' : 'XSS';
        return { ...prevStats, [type]: prevStats[type] + 1 };
      });
    });

    // Cleanup on unmount
    return () => {socket.off('attack-alert');
      socket.off('attack-alert');
      socket.off('connect');
      socket.off('connect_error');
    };
  }, []);

  // Data for the Chart
  const chartData = [
    { name: 'SQL Injection', value: stats.SQL },
    { name: 'XSS Scripting', value: stats.XSS },
  ];

  const COLORS = ['#ef4444', '#f59e0b']; // Red and Orange

  return (
    <div className="container">
      <div className="header">
        <h1>🛡️ Sentinel WAF Dashboard</h1>
        <p>Status: <span style={{color: '#22c55e'}}>● Online</span></p>
      </div>

      {/* Top Section: Chart and Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* Card 1: Visual Chart */}
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

        {/* Card 2: Summary Stats */}
        <div className="card">
          <h3>Total Blocks</h3>
          <h1 style={{ fontSize: '4rem', margin: '20px 0' }}>{logs.length}</h1>
          <p>Recent threat detected from IP: {logs.length > 0 ? logs[0].ip : 'None'}</p>
        </div>
      </div>

      {/* Bottom Section: Live Logs */}
      <div className="card">
        <h3>🚨 Live Attack Feed</h3>
        {logs.length === 0 ? <p>No threats detected. Waiting for traffic...</p> : null}
        
        {logs.map((log, index) => (
          <div key={index} className={`log-item ${log.type.includes('SQL') ? 'critical' : 'warning'}`}>
            <span><strong>{log.type}</strong> from {log.ip}</span>
            <span style={{fontSize: '0.8rem', opacity: 0.7}}>{new Date(log.timestamp).toLocaleTimeString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;