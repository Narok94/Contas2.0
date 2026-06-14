import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
    
    if (!process.env.DATABASE_URL) {
        return res.status(500).json({ error: 'DATABASE_URL not configured' });
    }

    try {
        const sql = neon(process.env.DATABASE_URL);
        
        console.log('Running migration: creating tables if not exists...');
        
        await sql`
            CREATE TABLE IF NOT EXISTS accounts (
                id VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                due_date VARCHAR(255),
                category VARCHAR(255),
                status VARCHAR(50) DEFAULT 'PENDING',
                type VARCHAR(50) DEFAULT 'single',
                installment_current INTEGER,
                installment_total INTEGER,
                installment_id VARCHAR(255)
            );
        `;

        await sql`
            CREATE TABLE IF NOT EXISTS incomes (
                id VARCHAR(255) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                date VARCHAR(255) NOT NULL,
                category VARCHAR(255)
            );
        `;

        const body = req.body || {};
        const accounts = body.accounts || [];
        const incomes = body.incomes || [];

        console.log(`Migration: inserting ${accounts.length} accounts and ${incomes.length} incomes...`);

        // Batch inserts in sequence (neon serverless is stateless, transactions aren't supported with the basic neon() client, we do multiple inserts safely with ON CONFLICT)
        for (const act of accounts) {
            await sql`
                INSERT INTO accounts (id, name, amount, due_date, category, status, type, installment_current, installment_total, installment_id)
                VALUES (${act.id}, ${act.name}, ${act.amount}, ${act.due_date}, ${act.category}, ${act.status}, ${act.type}, ${act.installment_current}, ${act.installment_total}, ${act.installment_id})
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    amount = EXCLUDED.amount,
                    due_date = EXCLUDED.due_date,
                    category = EXCLUDED.category,
                    status = EXCLUDED.status,
                    type = EXCLUDED.type,
                    installment_current = EXCLUDED.installment_current,
                    installment_total = EXCLUDED.installment_total,
                    installment_id = EXCLUDED.installment_id
            `;
        }

        for (const inc of incomes) {
            await sql`
                INSERT INTO incomes (id, name, amount, date, category)
                VALUES (${inc.id}, ${inc.name}, ${inc.amount}, ${inc.date}, ${inc.category})
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    amount = EXCLUDED.amount,
                    date = EXCLUDED.date,
                    category = EXCLUDED.category
            `;
        }

        console.log('Migration completed successfully.');
        return res.status(200).json({ success: true, message: 'Migration applied!' });
    } catch (error: any) {
        console.error('Migration error:', error);
        return res.status(500).json({ error: 'Migration failed', details: error.message });
    }
}
