
import { createPool } from '@vercel/postgres';
import { VercelRequest, VercelResponse } from '@vercel/node';

// Função infalível para limpar a URL do banco
const getSanitizedUrl = () => {
  let url = (process.env.DATABASE_URL || process.env.POSTGRES_URL || "").trim();
  if (!url) return "";

  // Captura estritamente o que começa com postgres e vai até o primeiro espaço/aspas
  const match = url.match(/(postgres(?:ql)?:\/\/[^\s'"]+)/);
  if (!match) return "";
  
  let cleanUrl = match[1];

  // Remove parâmetros problemáticos que quebram em ambientes serverless
  cleanUrl = cleanUrl.replace(/[&?]channel_binding=[^&]+/g, '');
  
  // Garante o SSL ativo (obrigatório para Neon/Vercel)
  if (!cleanUrl.includes('sslmode=')) {
    cleanUrl += (cleanUrl.includes('?') ? '&' : '?') + 'sslmode=require';
  }

  return cleanUrl;
};

const sanitizedUrl = getSanitizedUrl();
const pool = sanitizedUrl ? createPool({ connectionString: sanitizedUrl }) : null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!pool) {
    return res.status(503).json({ error: 'Configuração Invalida', message: 'Variável de ambiente DATABASE_URL não encontrada ou mal formatada.' });
  }

  try {
    const identifier = req.query.identifier as string;
    if (!identifier) return res.status(400).json({ error: 'Identificador ausente' });

    // Migração automática
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
    console.error('[DB FATAL]:', error.message);
    return res.status(500).json({ error: 'Erro de Banco de Dados', message: error.message });
  }
}
