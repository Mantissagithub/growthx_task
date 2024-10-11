const jwt = require('jsonwebtoken');

const jwt_secret = "Secr3T";

const authMiddleware = (roles = []) => {
    return (req, res, next) => {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ message: "access denied" });
        }

        const token = authHeader.split(' ')[1];

        jwt.verify(token, jwt_secret, (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: "token is invalid" });
            }

            req.user = decoded;

            if (roles.length && !roles.includes(decoded.role)) {
                return res.status(403).json({ message: "forbidden: insufficient permissions" });
            }

            next();
        });
    };
};

module.exports = {
    authMiddleware,
    jwt_secret
};