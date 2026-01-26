// backend/server.js
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const wafMiddleware = require('./middleware/waf');

const app = express();
const server = http.createServer(app);

// Initialize Socket.io (for real-time dashboard updates later)
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Your React Frontend URL
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json()); // To parse JSON bodies

// --- 🛡️ ACTIVATE SENTINEL WAF ---
// We pass 'io' so the WAF can send alerts to the frontend
app.use(wafMiddleware(io));

app.use((req, res, next) => {
    console.log(`[Incoming Request]: ${req.method} ${req.url} from ${req.ip}`);
    
    // Simulating a simple security check
    if (req.headers['x-malicious-header']) {
        console.log('⛔ BLOCKED: Malicious header detected');
        // Notify frontend via socket (we'll implement the listener later)
        io.emit('attack-alert', { 
            type: 'Malicious Header', 
            ip: req.ip, 
            time: new Date() 
        });
        return res.status(403).json({ error: 'Request Blocked by Sentinel WAF' });
    }
    
    next(); // If safe, pass to the "target" application
});

// --- 🎯 VULNERABLE TARGET APPLICATION ---
// This represents the "User API" we are protecting.

app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Secure API. Sentinel is watching.' });
});

app.post('/login', (req, res) => {
    // A standard login route
    const { username, password } = req.body;
    res.json({ message: `Login attempt for user: ${username}` });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🛡️ Sentinel WAF running on http://localhost:${PORT}`);
});