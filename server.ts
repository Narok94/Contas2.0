import express from 'express';
import cors from 'cors';
import path from 'path';
import dbHandler from './api/db';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Proxy requests to the Vercel-like db API handler
app.all('/api/db', async (req, res) => {
  try {
    await dbHandler(req as any, res as any);
  } catch (err) {
    console.error('Error in /api/db:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Serve frontend static files
app.use(express.static(path.join(process.cwd(), 'dist')));

// Fallback to index.html for SPA
app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`[Server] Running on port ${port}`);
});
