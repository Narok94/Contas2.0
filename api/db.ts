
import { createPool } from '@vercel/postgres';
import { VercelRequest, VercelResponse } from '@vercel/node';

// Tenta usar DATABASE_URL (Neon) ou POSTGRES_URL (Vercel Storage)
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

const pool = connectionString ? createPool({
  connectionString: connectionString
}) : null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!pool) {
    return res.status(503).json({ 
      error: 'Variável de ambiente ausente', 
      message: 'A variável DATABASE_URL não foi encontrada. Configure-a no painel do Projeto na Vercel.' 
    });
  }

  try {
    const identifier = req.query.identifier as string;

    if (!identifier) {
      return res.status(400).json({ error: 'Identificador do usuário é obrigatório' });
    }

    // Inicialização da tabela
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users_data (
        id SERIAL PRIMARY KEY,
        user_email TEXT NOT NULL UNIQUE,
        content TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    if (req.method === 'GET') {
      const { rows } = await pool.query(
        'SELECT content FROM users_data WHERE user_email = $1',
        [identifier]
      );
      
      if (rows.length === 0) return res.status(200).json(null);
      return res.status(200).json(JSON.parse(rows[0].content));
    }

    if (req.method === 'POST') {
      const contentStr = JSON.stringify(req.body);
      
      await pool.query(`
        INSERT INTO users_data (user_email, content, updated_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (user_email) 
        DO UPDATE SET content = $2, updated_at = CURRENT_TIMESTAMP;
      `, [identifier, contentStr]);
      
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Método não permitido' });

  } catch (error: any) {
    console.error('Erro na API de Banco de Dados:', error);
    return res.status(500).json({ 
      error: 'Falha no banco de dados', 
      details: error.message 
    });
  }
}
