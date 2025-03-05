import express from 'express';
const router = express.Router();
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import apiRoutes from './api/index.js';
router.use('/api', apiRoutes);
// catch-all route for serving the React app in production,
// but skip requests that are meant for /graphql
router.use((req, res, next) => {
    if (req.originalUrl.startsWith('/graphql')) {
        return next(); // let the Apollo middleware handle /graphql requests
    }
    res.sendFile(path.join(__dirname, '../../../client/dist/index.html'));
});
export default router;
