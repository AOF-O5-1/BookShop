import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
// Express middleware for REST endpoints.
// It extracts the token from the Authorization header,
// verifies it, and attaches the decoded user to req.user.
export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        const secretKey = process.env.JWT_SECRET_KEY || '';
        jwt.verify(token, secretKey, (err, user) => {
            if (err) {
                return res.sendStatus(403); // Forbidden if token verification fails.
            }
            req.user = user;
            return next();
        });
    }
    else {
        res.sendStatus(401); // Unauthorized if no token is provided.
    }
};
// Apollo context function for GraphQL.
// It reads the token from the incoming request, verifies it,
// and returns an object with the decoded user (or null if invalid).
export const apolloAuthContext = ({ req }) => {
    const authHeader = req.headers.authorization;
    const secretKey = process.env.JWT_SECRET_KEY || '';
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        try {
            const user = jwt.verify(token, secretKey);
            return { user };
        }
        catch (err) {
            // Token verification failed; return context with no user.
            return { user: null };
        }
    }
    // No token provided; return context with no user.
    return { user: null };
};
// Resolver wrapper to enforce authentication in GraphQL resolvers.
// It calls the provided resolver function only if context.user exists.
export const requireAuth = (resolverFunc) => {
    return (parent, args, context, info) => {
        if (!context.user) {
            throw new Error('Authentication required');
        }
        return resolverFunc(parent, args, context, info);
    };
};
// Function to sign and create a new JWT.
// It accepts user details and returns a token that expires in one hour.
export const signToken = (username, email, _id) => {
    const payload = { username, email, _id };
    const secretKey = process.env.JWT_SECRET_KEY || '';
    return jwt.sign(payload, secretKey, { expiresIn: '1h' });
};
