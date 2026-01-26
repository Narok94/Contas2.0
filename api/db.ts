
import { createPool } from '@vercel/postgres';
import { VercelRequest, VercelResponse } from '@vercel/node';

const getCleanConnectionString = () => {
  const raw = (process.env.DATABASE_URL || process.env.POSTGRES_URL || "").trim();
  if (!raw) return null;

  // Extrai estritamente o protocolo postgres até o fim da URL válida
  const match = raw.match(/(postgres(?:ql)?:\/\/[^\s'"]+)/);
  if (!match) return null;

  let url = match[1];
  
  // Remove parâmetros que costumam quebrar em ambientes serverless da Vercel
  url = url.replace(/[&?]channel_binding=[^&]+/g, '');
  
  // Garante SSL ativo (crítico para Neon/Vercel Postgres)
  if (!url.includes('sslmode=')) {
    url += (url.includes('?') ? '&' : '?') + 'sslmode=require';
  }
  
  return url;
};

const connectionString = getCleanConnectionString();
const pool = connectionString ? createPool({ connectionString }) : null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!pool) {
    return res.status(503).json({ error: 'Configuração Incompleta', detail: 'DATABASE_URL não configurada corretamente.' });
  }

  const identifier = req.query.identifier as string;
  if (!identifier) return res.status(400).json({ error: 'Identificador ausente' });

  try {
    // Migração automática leve
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users_data (
        id SERIAL PRIMARY KEY,
        user_email TEXT NOT NULL UNIQUE,
        content TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    if (req.method === 'GET') {
      const { rows } = await pool.query('SELECT content FROM users_data WHERE user_email = $1', [identifier]);
      return res.status(200).json(rows.length > 0 ? JSON.parse(rows[0].content) : null);
    }

    if (req.method === 'POST') {
      await pool.query(`
        INSERT INTO users_data (user_email, content, updated_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (user_email) 
        DO UPDATE SET content = $2, updated_at = CURRENT_TIMESTAMP;
      `, [identifier, JSON.stringify(req.body)]);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error: any) {
    console.error('[DATABASE ERROR]:', error.message);
    return res.status(500).json({ error: 'Erro de Banco de Dados', message: error.message });
  }
}
