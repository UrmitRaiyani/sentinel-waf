const AttackLog = require('../models/AttackLog');

const mirrorTrafficToML = (io) => {
    return (req, res, next) => {
        // 1. DO NOT scan static frontend assets. It wastes ML processing power.
        if (req.originalUrl.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg)$/i)) {
            return next(); 
        }

        const payloadToScan = req.originalUrl + JSON.stringify(req.body || {});

        // 2. Mirror the traffic to the Python ML Engine asynchronously
        fetch('http://127.0.0.1:8000/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ payload: payloadToScan })
        })
        .then(response => response.json())
        .then(data => {
            // 3. IF PYTHON DETECTS A ZERO-DAY THREAT:
            if (data.status === 'anomaly') {
                console.log(`\n[🛑 ML ALERT] Zero-Day Threat Detected asynchronously from IP: ${req.ip}`);
                
                // Construct the threat payload
                const attackData = {
                    type: 'Zero-Day Anomaly (ML)',
                    ip: req.ip,
                    payload: payloadToScan,
                    userAgent: req.headers['user-agent'],
                    timestamp: new Date()
                };

                // Save to MongoDB Persistence Layer
                const newLog = new AttackLog(attackData);
                newLog.save().catch(err => console.error("❌ DB ML Logging Error:", err));

                // Push real-time alert to React Dashboard via WebSockets
                io.emit('attack-alert', attackData);
            }
        })
        .catch(err => {
            // Fail silently. If the ML server goes down, the web app must stay up.
        });

        next(); // Immediately release the thread (Zero Latency)
    };
};

module.exports = mirrorTrafficToML;