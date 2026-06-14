import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (!process.env.DATABASE_URL) {
        return res.status(500).json({ error: 'DATABASE_URL not configured' });
    }
    
    const sql = neon(process.env.DATABASE_URL);

    if (req.method === 'GET') {
        try {
            const result = await sql`SELECT * FROM incomes ORDER BY date DESC`;
            return res.status(200).json(result);
        } catch (error: any) {
            console.error('API Error:', error);
            // Ignore missing table during initial load
            if (error?.message?.includes('does not exist')) return res.status(200).json([]);
            return res.status(500).json({ error: 'Database error' });
        }
    }

    if (req.method === 'POST') {
        try {
            const inc = req.body;
            const result = await sql`
                INSERT INTO incomes (id, name, amount, date, category)
                VALUES (${inc.id}, ${inc.name}, ${inc.amount}, ${inc.date}, ${inc.category})
                RETURNING *
            `;
            return res.status(201).json(result[0]);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Failed to create income' });
        }
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
}
