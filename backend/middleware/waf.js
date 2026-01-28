
const AttackLog = require('../models/AttackLog');
const rateLimit = require('express-rate-limit');

// 1. Define Malicious Signatures (The "Virus Definitions")
// These Regex patterns look for common attack strings.
const sqlInjectionPattern = /('(\s|%20)*(OR|AND))|(\-\-)|(UNION(\s|%20)+SELECT)|(DROP(\s|%20)+TABLE)/i;
const xssPattern = /(<script)|(javascript:)|(onload)|(onerror)|(alert\()|(document\.cookie)/i;

// 2. Helper function to scan a string
const isMalicious = (payload) => {
    if (!payload) return false;
    // Convert objects to string for scanning
    const stringPayload = typeof payload === 'object' ? JSON.stringify(payload) : payload;
    
    if (xssPattern.test(stringPayload)) return 'Cross-Site Scripting (XSS)';
    if (sqlInjectionPattern.test(stringPayload)) return 'SQL Injection';
    
    return false;
};

// 3. The Middleware Function
const wafMiddleware = (io) => {
   return (req, res, next) => { 
        const dataToScan = {
            body: req.body,
            query: req.query,
        };

        const attackType = isMalicious(dataToScan);

        if (attackType) {
            console.log(`⛔ [BLOCKED] ${attackType} detected from IP: ${req.ip}`);

            const attackData = {
                type: attackType,
                ip: req.ip,
                payload: JSON.stringify(dataToScan),
                userAgent: req.headers['user-agent'],
                timestamp: new Date()
            };

            // --- SAVE TO MONGODB ---
            const newLog = new AttackLog(attackData);
            newLog.save()
                .then(async () => {
                    console.log("✅ Attack saved to DB");
                    
                    // Run Cleanup
                    const logCount = await AttackLog.countDocuments();
                    if (logCount > 200) {
                        const logsToDelete = await AttackLog.find().sort({ timestamp: 1 }).limit(100).select('_id');
                        const idsToDelete = logsToDelete.map(doc => doc._id);
                        await AttackLog.deleteMany({ _id: { $in: idsToDelete } });
                        console.log("♻️ Cleanup Complete");
                    }
                })
                .catch(err => console.error("❌ DB Error:", err));
          
            // Alert Frontend
            io.emit('attack-alert', attackData);

            // Block Request
            return res.status(403).json({
                error: 'Request Blocked by Sentinel WAF',
                reason: attackType
            });
        }

        next();
    };
};

module.exports = wafMiddleware;