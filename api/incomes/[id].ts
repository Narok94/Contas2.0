const { neon } = require('@neondatabase/serverless');

const handler = async function handler(req: any, res: any) {
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
            const inc = req.body;
            const result = await sql`
                UPDATE incomes 
                SET name=${inc.name}, amount=${inc.amount}, date=${inc.date}, category=${inc.category}
                WHERE id=${id}
                RETURNING *
            `;
            return res.status(200).json(result[0] || null);
        } catch (error: any) {
            console.error(error);
            return res.status(500).json({ error: error.message, stack: error.stack });
        }
    }

    if (req.method === 'DELETE') {
        try {
            await sql`DELETE FROM incomes WHERE id=${id}`;
            return res.status(200).json({ success: true });
        } catch (error: any) {
            console.error(error);
            return res.status(500).json({ error: error.message, stack: error.stack });
        }
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
}

module.exports = handler;
export default handler;
