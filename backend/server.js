const path = require('path');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const wafMiddleware = require('./middleware/waf');
const mongoose = require('mongoose');
const AttackLog = require('./models/AttackLog');

const app = express();
const server = http.createServer(app);

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('✅ Connected to MongoDB Atlas (AWS Cloud)'))
.catch(err => console.error('❌ Cloud DB Connection Error:', err));

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
    // console.log(`[Incoming Request]: ${req.method} ${req.url} from ${req.ip}`);
    
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


// This represents the "User API" we are protecting.

// app.get('/', (req, res) => {
//     res.json({ message: 'Welcome to the Secure API. Sentinel is watching.' });
// });

app.post('/login', (req, res) => {
    // A standard login route
    const { username, password } = req.body;
    res.json({ message: `Login attempt for user: ${username}` });
});

// --- NEW ROUTE: Get Attack History ---
app.get('/api/logs', async (req, res) => {
    try {
        // Fetch last 50 attacks, newest first
        const logs = await AttackLog.find().sort({ timestamp: -1 }).limit(50);
        res.json(logs);
    } catch (err) {
        console.error("Error fetching logs:", err);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

// --- 🏠 SERVE FRONTEND (Dashboard) ---
// 1. Serve static files from the 'dist' folder
app.use(express.static(path.join(__dirname, 'dist')));

// 2. Handle React routing (send all other requests to index.html)
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Sentinel WAF running on http://localhost:${PORT}`);
});