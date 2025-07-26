const { auth } = require('express-oauth2-jwt-bearer');
const logger = require('./logger');

// Auth0 configuration
const auth0Config = {
    audience: process.env.AUTH0_AUDIENCE || 'https://dev-y90go66m.us.auth0.com/api/v2/',
    issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL || 'https://dev-y90go66m.us.auth0.com/',
    tokenSigningAlg: 'RS256'
};

// Create the Auth0 middleware
const checkJwt = auth(auth0Config);

// Custom error handler for Auth0 middleware
const auth0ErrorHandler = (err, req, res, next) => {
    if (err.name === 'UnauthorizedError') {
        logger.warn('Auth0 authentication failed:', {
            error: err.message,
            url: req.url,
            method: req.method,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
        });

        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid or missing authentication token'
        });
    }
    next(err);
};

// Optional: Middleware to extract user info from token
const extractUserInfo = (req, res, next) => {
    if (req.auth && req.auth.payload) {
        req.user = {
            sub: req.auth.payload.sub,
            email: req.auth.payload['https://dev-y90go66m.us.auth0.com/email'],
            email_verified: req.auth.payload['https://dev-y90go66m.us.auth0.com/email_verified'],
            name: req.auth.payload['https://dev-y90go66m.us.auth0.com/name'],
            nickname: req.auth.payload['https://dev-y90go66m.us.auth0.com/nickname'],
            picture: req.auth.payload['https://dev-y90go66m.us.auth0.com/picture']
        };

        logger.info('User authenticated:', {
            userId: req.user.sub,
            email: req.user.email,
            url: req.url,
            method: req.method,
            timestamp: new Date().toISOString()
        });
    }
    next();
};

// Add debugging middleware to log token information
const debugToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        logger.info('Authorization header received:', {
            headerLength: authHeader.length,
            startsWithBearer: authHeader.startsWith('Bearer '),
            tokenLength: authHeader.startsWith('Bearer ') ? authHeader.substring(7).length : 0,
            url: req.url,
            method: req.method,
            timestamp: new Date().toISOString()
        });

        // Log first and last few characters of token for debugging (without exposing full token)
        if (authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            if (token.length > 20) {
                logger.info('Token format check:', {
                    tokenStart: token.substring(0, 20) + '...',
                    tokenEnd: '...' + token.substring(token.length - 20),
                    tokenLength: token.length,
                    hasThreeParts: token.split('.').length === 3,
                    timestamp: new Date().toISOString()
                });
            } else {
                logger.warn('Token appears to be too short:', {
                    tokenLength: token.length,
                    timestamp: new Date().toISOString()
                });
            }
        }
    } else {
        logger.warn('No Authorization header found:', {
            url: req.url,
            method: req.method,
            timestamp: new Date().toISOString()
        });
    }

    next();
};

module.exports = {
    checkJwt,
    auth0ErrorHandler,
    extractUserInfo,
    debugToken
}; 