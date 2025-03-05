import dotenv from 'dotenv';
dotenv.config();
console.log('JWT_SECRET_KEY defined?', !!process.env.JWT_SECRET_KEY);
import express from 'express';
import path from 'node:path';
import cors from 'cors';
import db from './config/connection.js';
import routes from './routes/index.js';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import typeDefs from './schema/typeDefs.js';
import resolvers from './schema/resolvers.js';
import { apolloAuthContext } from './services/auth.js';
const app = express();
const PORT = process.env.PORT || 3001;
// Global logging middleware to see incoming requests
app.use((req, _res, next) => {
    console.log(`Incoming request: ${req.method} ${req.url}`);
    next();
});
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
}));
// Body parsing middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Wait for DB connection before starting Apollo Server and the Express server.
db.once('open', async () => {
    // Create and start Apollo Server
    const server = new ApolloServer({
        typeDefs,
        resolvers,
    });
    await server.start();
    // Mount the Apollo GraphQL middleware at /graphql.
    app.use('/graphql', express.json(), expressMiddleware(server, {
        context: async ({ req, res }) => apolloAuthContext({ req, res }),
    }));
    app.use(routes);
    if (process.env.NODE_ENV === 'production') {
        const clientPath = path.join(__dirname, '../../../client/dist');
        app.use(express.static(clientPath));
        app.get('*', (req, res) => {
            if (!req.path.startsWith('/graphql')) {
                res.sendFile(path.join(clientPath, 'index.html'));
            }
        });
        console.log('Serving static files from:', clientPath);
    }
    // Start the Express server.
    app.listen(PORT, () => console.log(`🌍 Now listening on localhost:${PORT}`));
    // Log the middleware stack for debugging
    console.log('Middleware stack:', app._router.stack);
});
export default app;
