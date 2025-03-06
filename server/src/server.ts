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
  // Log current directory and attempt different paths
  console.log('Current directory:', process.cwd());
  
  // Try multiple potential paths
  const possiblePaths = [
    path.join(__dirname, '../../../client/dist'),
    path.join(process.cwd(), '../client/dist'),
    path.join(process.cwd(), '../../client/dist'),
    '/opt/render/project/src/client/dist'
  ];
  
  let clientPath = null;
  
  // Find the first path that exists
  for (const testPath of possiblePaths) {
    try {
      const fs = require('fs');
      if (fs.existsSync(testPath)) {
        console.log('Found valid client path:', testPath);
        clientPath = testPath;
        console.log('Files in directory:', fs.readdirSync(testPath));
        break;
      } else {
        console.log('Path not found:', testPath);
      }
    } catch (err) {
      console.error('Error checking path:', testPath, err);
    }
  }
  
  if (!clientPath) {
    console.error('WARNING: Could not find client dist directory!');
    clientPath = path.join(__dirname, '../../../client/dist'); // fallback
  }
  
  // Set appropriate MIME types
  app.use((req, res, next) => {
    console.log('Processing request for:', req.url);
    if (req.url.endsWith('.js')) {
      console.log('Setting JavaScript MIME type for:', req.url);
      res.setHeader('Content-Type', 'application/javascript');
    } else if (req.url.endsWith('.css')) {
      console.log('Setting CSS MIME type for:', req.url);
      res.setHeader('Content-Type', 'text/css');
    }
    next();
  });
  
  // Serve static files
  console.log('Serving static files from:', clientPath);
  app.use(express.static(clientPath));
  
  // Handle other routes (SPA fallback)
  app.get('*', (req, res) => {
    if (!req.path.includes('.')) {
      console.log('Serving index.html for:', req.path);
      res.sendFile(path.join(clientPath, 'index.html'));
    } else {
      console.log('404 for file:', req.path);
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