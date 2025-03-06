import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import db from './config/connection.js';
import routes from './routes/index.js';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import typeDefs from './schema/typeDefs.js';
import resolvers from './schema/resolvers.js';
import { apolloAuthContext } from './services/auth.js';

// Define __filename and __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

console.log('Current working directory:', process.cwd());
console.log('JWT_SECRET_KEY defined?', process.env.JWT_SECRET_KEY ? 'true' : 'false');

// Global logging middleware
app.use((req, _res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

// Enable CORS for requests from http://localhost:3000
app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Mount your API routes (if any)
app.use(routes);

// In production, serve static files from the client/dist folder
if (process.env.NODE_ENV === 'production') {
  const clientPath = process.env.NODE_ENV === 'production' 
  ? path.join(process.cwd(), '../../client/dist')  // For Render's directory structure
  : path.join(__dirname, '../../../client/dist');  // For local development
  
  // Configure proper MIME types before serving static files
  app.use((req, res, next) => {
    // Set correct MIME type for JavaScript modules
    if (req.url.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (req.url.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
    next();
  });
  
  app.use(express.static(clientPath));
  
  // Only catch requests that do not include a dot (.) in the URL,
  // which indicates they are likely not requests for a file.
  app.get('*', (req, res) => {
    if (!req.path.includes('.')) {
      res.sendFile(path.join(clientPath, 'index.html'));
    } else {
      res.status(404).send('Not found');
    }
  });
}

db.once('open', async () => {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });
  await server.start();

  // Mount Apollo middleware at /graphql
  app.use(
    '/graphql',
    express.json(),
    expressMiddleware(server, {
      context: async ({ req, res }) => apolloAuthContext({ req, res }),
    })
  );

  // Start the Express server
  app.listen(PORT, () =>
    console.log(`🌍 Now listening on localhost:${PORT}`)
  );

  console.log('Middleware stack:', app._router.stack);
});

export default app;