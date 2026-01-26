// backend/middleware/waf.js

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
        // We want to scan the Body, Query Params, and Headers
        const dataToScan = {
            body: req.body,
            query: req.query,
            // You can also scan headers if you want
        };

        const attackType = isMalicious(dataToScan);

        if (attackType) {
            console.log(`⛔ [BLOCKED] ${attackType} detected from IP: ${req.ip}`);

            // 4. Real-time Alert to Frontend
            // This sends the data to the React Dashboard immediately
            io.emit('attack-alert', {
                type: attackType,
                ip: req.ip,
                payload: JSON.stringify(dataToScan), // Show what they tried to send
                timestamp: new Date().toISOString()
            });

            // 5. Block the Request
            return res.status(403).json({
                error: 'Request Blocked by Sentinel WAF',
                reason: attackType,
                advice: 'Your IP has been logged.'
            });
        }

        // If no threats, proceed to the actual app
        next();
    };
};

module.exports = wafMiddleware;