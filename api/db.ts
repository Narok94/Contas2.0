
import { createPool } from '@vercel/postgres';
import { VercelRequest, VercelResponse } from '@vercel/node';

// Inicializa o pool usando DATABASE_URL ou POSTGRES_URL
const pool = createPool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (!connectionString) {
    console.error('ERRO: DATABASE_URL ou POSTGRES_URL não configurada.');
    return res.status(503).json({ 
      error: 'Banco de dados não configurado', 
      message: 'Certifique-se de que a variável DATABASE_URL está definida nas variáveis de ambiente da Vercel.' 
    });
  }

  try {
    const identifier = req.query.identifier as string;

    if (!identifier) {
      return res.status(400).json({ error: 'Identificador do usuário é obrigatório' });
    }

    // Garante que a tabela 'operacoes' existe. 
    // Usamos 'user_id' para identificar de quem são os dados.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS operacoes (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        data_json TEXT NOT NULL,
        last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // OPERAÇÃO GET: Recupera os dados (trades/contas/configurações)
    if (req.method === 'GET') {
      const { rows } = await pool.query(
        'SELECT data_json FROM operacoes WHERE user_id = $1',
        [identifier]
      );
      
      if (rows.length === 0) return res.status(200).json(null);
      return res.status(200).json(JSON.parse(rows[0].data_json));
    }

    // OPERAÇÃO POST: Salva ou Atualiza (INSERT/UPDATE)
    if (req.method === 'POST') {
      const content = JSON.stringify(req.body);
      
      // Realiza o "Upsert" na tabela operacoes
      await pool.query(`
        INSERT INTO operacoes (user_id, data_json, last_update)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id) 
        DO UPDATE SET data_json = $2, last_update = CURRENT_TIMESTAMP;
      `, [identifier, content]);
      
      return res.status(200).json({ success: true, table: 'operacoes' });
    }

    return res.status(405).json({ error: 'Método não permitido' });

  } catch (error: any) {
    console.error('Database Error:', error);
    return res.status(500).json({ 
      error: 'Erro na operação do banco de dados', 
      details: error.message 
    });
  }
}
