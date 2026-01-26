
import { createPool } from '@vercel/postgres';
import { VercelRequest, VercelResponse } from '@vercel/node';

// Função para extrair APENAS a URL válida, eliminando espaços, aspas ou lixo como "psql" ou "hudr"
const getCleanUrl = () => {
  const rawUrl = (process.env.DATABASE_URL || process.env.POSTGRES_URL || "").trim();
  if (!rawUrl) return "";

  // Captura o que começa com postgres:// ou postgresql:// até o fim da string válida
  const match = rawUrl.match(/(postgres(?:ql)?:\/\/[^\s'"]+)/);
  if (!match) return "";
  
  let clean = match[1];

  // Remove o channel_binding que causa erros em conexões diretas via navegador/serverless
  clean = clean.replace(/[&?]channel_binding=[^&]+/g, '');
  
  // Força o modo SSL (exigido pelo Neon/Vercel Postgres)
  if (!clean.includes('sslmode=')) {
    clean += (clean.includes('?') ? '&' : '?') + 'sslmode=require';
  }

  return clean;
};

const connectionString = getCleanUrl();
const pool = connectionString ? createPool({ connectionString }) : null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!pool) {
    return res.status(503).json({ 
      error: 'Configuração Incompleta', 
      message: 'A URL do banco de dados não foi encontrada ou está mal formatada.' 
    });
  }

  try {
    const identifier = req.query.identifier as string;
    if (!identifier) return res.status(400).json({ error: 'Identificador ausente' });

    // Garante que a tabela exista antes de qualquer operação
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
    return res.status(500).json({ 
      error: 'Erro de Comunicação com o Banco', 
      message: error.message 
    });
  }
}
