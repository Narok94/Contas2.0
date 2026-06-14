import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import accountsHandler from './api/accounts';
import accountsIdHandler from './api/accounts/[id]';
import incomesHandler from './api/incomes';
import incomesIdHandler from './api/incomes/[id]';
import migrationHandler from './api/migration';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Very basic adapter from Express to Vercel Request/Response
function createVercelAdapter(handler: any) {
    return async (req: express.Request, res: express.Response) => {
        const vercelReq = {
            body: req.body,
            query: req.query,
            method: req.method,
            headers: req.headers,
            url: req.url,
            cookies: req.cookies
        };
        const vercelRes = {
            status: (code: number) => {
                res.status(code);
                return vercelRes;
            },
            json: (data: any) => {
                res.json(data);
            },
            send: (data: any) => {
                res.send(data);
            },
            setHeader: (key: string, value: string) => {
                res.setHeader(key, value);
                return vercelRes;
            }
        };
        await handler(vercelReq, vercelRes);
    };
}

// Ensure the compiled JS handlers exist, otherwise dynamic mock fallback
app.all('/api/accounts', createVercelAdapter(accountsHandler));
app.all('/api/accounts/:id', async (req, res) => {
    req.query.id = req.params.id;
    await createVercelAdapter(accountsIdHandler)(req, res);
});
app.all('/api/incomes', createVercelAdapter(incomesHandler));
app.all('/api/incomes/:id', async (req, res) => {
    req.query.id = req.params.id;
    await createVercelAdapter(incomesIdHandler)(req, res);
});
app.all('/api/migration', createVercelAdapter(migrationHandler));

// Serve static frontend from dist
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
