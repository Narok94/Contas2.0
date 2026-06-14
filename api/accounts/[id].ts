import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (!process.env.DATABASE_URL) {
        return res.status(500).json({ error: 'DATABASE_URL not configured' });
    }
    
    const sql = neon(process.env.DATABASE_URL);
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Invalid ID' });
    }

    if (req.method === 'PUT') {
        try {
            const acc = req.body;
            const result = await sql`
                UPDATE accounts 
                SET name=${acc.name}, amount=${acc.amount}, due_date=${acc.due_date}, category=${acc.category}, 
                    status=${acc.status}, type=${acc.type}, installment_current=${acc.installment_current}, 
                    installment_total=${acc.installment_total}, installment_id=${acc.installment_id}
                WHERE id=${id}
                RETURNING *
            `;
            return res.status(200).json(result[0] || null);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Failed to update account' });
        }
    }

    if (req.method === 'DELETE') {
        try {
            await sql`DELETE FROM accounts WHERE id=${id}`;
            return res.status(200).json({ success: true });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Failed to delete account' });
        }
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
}
