import jwt from 'jsonwebtoken';
// Log the current working directory to debug
console.log('Current working directory:', process.cwd());
// Create __dirname equivalent for ES modules
// verifies it using JWT_SECRET_KEY, and attaches the decoded user to req.user.
export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, process.env.JWT_SECRET_KEY || '', (err, user) => {
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
// It reads the token from the incoming request, verifies it using JWT_SECRET_KEY,
// and returns an object with the decoded user (or null if invalid).
export const apolloAuthContext = ({ req }) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        try {
            const user = jwt.verify(token, process.env.JWT_SECRET_KEY || '');
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
    return jwt.sign(payload, process.env.JWT_SECRET_KEY || '', { expiresIn: '1h' });
};
