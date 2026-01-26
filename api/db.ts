
import { createPool } from '@vercel/postgres';
import { VercelRequest, VercelResponse } from '@vercel/node';

// Tenta pegar a URL de qualquer uma das chaves comuns
let connectionString = (process.env.DATABASE_URL || process.env.POSTGRES_URL || "").trim();

// Regex para capturar apenas a URL válida do postgres, terminando antes de qualquer espaço ou aspas
// Isso remove automaticamente o " hudr" ou o "psql '" do início/fim
const urlMatch = connectionString.match(/postgresql:\/\/[^\s'"]+/);

if (urlMatch) {
  connectionString = urlMatch[0];
}

const pool = connectionString ? createPool({
  connectionString: connectionString
}) : null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!pool || !connectionString) {
    return res.status(503).json({ 
      error: 'Configuração ausente', 
      message: 'DATABASE_URL não configurada ou inválida na Vercel. Verifique as variáveis de ambiente.' 
    });
  }

  try {
    const identifier = req.query.identifier as string;

    if (!identifier) {
      return res.status(400).json({ error: 'Identificador necessário' });
    }

    // Garante que a tabela existe
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
    console.error('Database Connection Error:', error.message);
    return res.status(500).json({ 
      error: 'Erro de Conexão', 
      message: error.message 
    });
  }
}
