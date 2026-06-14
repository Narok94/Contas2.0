import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (!process.env.DATABASE_URL) {
        return res.status(500).json({ error: 'DATABASE_URL not configured' });
    }
    
    const sql = neon(process.env.DATABASE_URL);

    if (req.method === 'GET') {
        try {
            const result = await sql`SELECT * FROM accounts ORDER BY due_date DESC`;
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
            const acc = req.body;
            const result = await sql`
                INSERT INTO accounts (id, name, amount, due_date, category, status, type, installment_current, installment_total, installment_id)
                VALUES (${acc.id}, ${acc.name}, ${acc.amount}, ${acc.due_date}, ${acc.category}, ${acc.status}, ${acc.type}, ${acc.installment_current}, ${acc.installment_total}, ${acc.installment_id})
                RETURNING *
            `;
            return res.status(201).json(result[0]);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Failed to create account' });
        }
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
}
