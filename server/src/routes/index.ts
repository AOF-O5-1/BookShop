le

import type { Request, Response, NextFunction } from 'express';
import express from 'express';
const router = express.Router();

import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import apiRoutes from './api/index.js';

router.use('/api', apiRoutes);

// ONLY use the catch-all route in production and only for routes that don't include a file extension
if (process.env.NODE_ENV === 'production') {
  router.use((req: Request, res: Response, next: NextFunction) => {
    // Skip /graphql requests
    if (req.originalUrl.startsWith('/graphql')) {
      return next();
    }
    
    // Skip requests for static files (requests with a file extension)
    if (req.path.includes('.')) {
      return next();
    }
    
    // For all other requests, serve the React app
    res.sendFile(path.join(__dirname, '../../../client/dist/index.html'));
  });
}

export default router;