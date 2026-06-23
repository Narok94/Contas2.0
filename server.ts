import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { sql } from './services/db.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Support large migrations

// --- API ROUTES ---

// GET: Buscar todas as contas do Neon organizadas por data
app.get('/api/contas', async (req, res) => {
    try {
        const contas = await sql`SELECT * FROM contas ORDER BY payment_date ASC, id ASC`;
        // Map snake_case from DB to camelCase for frontend
        const mappedContas = contas.map(c => ({
            id: c.id,
            groupId: c.group_id || c.groupId,
            name: c.name,
            category: c.category,
            value: Number(c.value),
            status: c.status,
            isRecurrent: Boolean(c.is_recurrent || c.isRecurrent),
            isInstallment: Boolean(c.is_installment || c.isInstallment),
            currentInstallment: c.current_installment || c.currentInstallment,
            totalInstallments: c.total_installments || c.totalInstallments,
            installmentId: c.installment_id || c.installmentId,
            paymentDate: c.payment_date || c.paymentDate
        }));
        res.json(mappedContas);
    } catch (error: any) {
        console.error('Error fetching contas:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST: Inserir uma nova conta (individualmente)
app.post('/api/contas', async (req, res) => {
    try {
        const acc = req.body;
        const result = await sql`
            INSERT INTO contas (
                id, group_id, name, category, value, status, is_recurrent, is_installment, 
                current_installment, total_installments, installment_id, payment_date
            ) VALUES (
                ${acc.id}, ${acc.groupId}, ${acc.name}, ${acc.category}, ${acc.value}, ${acc.status}, 
                ${acc.isRecurrent}, ${acc.isInstallment}, ${acc.currentInstallment || null}, 
                ${acc.totalInstallments || null}, ${acc.installmentId || null}, ${acc.paymentDate || null}
            ) RETURNING *
        `;
        res.json(result[0]);
    } catch (error: any) {
        console.error('Error inserting conta:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT: Atualizar status e outras informações
app.put('/api/contas/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const acc = req.body;
        const result = await sql`
            UPDATE contas SET 
                group_id = ${acc.groupId},
                name = ${acc.name},
                category = ${acc.category},
                value = ${acc.value},
                status = ${acc.status},
                is_recurrent = ${acc.isRecurrent},
                is_installment = ${acc.isInstallment},
                current_installment = ${acc.currentInstallment || null},
                total_installments = ${acc.totalInstallments || null},
                installment_id = ${acc.installmentId || null},
                payment_date = ${acc.paymentDate || null}
            WHERE id = ${id}
            RETURNING *
        `;
        res.json(result[0]);
    } catch (error: any) {
        console.error('Error updating conta:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE: Deletar conta
app.delete('/api/contas/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await sql`DELETE FROM contas WHERE id = ${id}`;
        res.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting conta:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST bulk/migration: Endpoint especial para migração do localStorage
app.post('/api/contas/migrate', async (req, res) => {
    try {
        const contas = req.body.contas;
        if (!contas || !Array.isArray(contas)) {
            return res.status(400).json({ error: 'Invalid payload' });
        }

        console.log(`Receiving migration of ${contas.length} contas`);

        // Insert iteratively to ensure we don't blow up parameters limit or we can batch them.
        for (const acc of contas) {
            // Upsert or Ignore? Let's use simple INSERT and ignore conflicts if possible, or just INSERT since they are local and might be new.
            // Using a try/catch for each so one failure doesn't fail everything if they have duplicates
            try {
                await sql`
                    INSERT INTO contas (
                        id, group_id, name, category, value, status, is_recurrent, is_installment, 
                        current_installment, total_installments, installment_id, payment_date
                    ) VALUES (
                        ${acc.id}, ${acc.groupId}, ${acc.name}, ${acc.category}, ${acc.value}, ${acc.status}, 
                        ${acc.isRecurrent || false}, ${acc.isInstallment || false}, ${acc.currentInstallment || null}, 
                        ${acc.totalInstallments || null}, ${acc.installmentId || null}, ${acc.paymentDate || null}
                    ) ON CONFLICT (id) DO NOTHING
                `;
            } catch (err) {
                console.error('Error inserting row in migration:', acc.id, err);
                // IF column doesn't exist, we might have schema issues. We will fallback to a simpler insert if needed
            }
        }

        res.json({ success: true, count: contas.length });
    } catch (error: any) {
        console.error('Error in migration:', error);
        res.status(500).json({ error: error.message });
    }
});

// Serve frontend in production
app.use(express.static(path.join(process.cwd(), 'dist')));
app.get('*', (req, res) => {
    res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log("Acesse o preview clicando no botão acima.");
});

export default app;
