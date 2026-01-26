
import { createPool } from '@vercel/postgres';
import { VercelRequest, VercelResponse } from '@vercel/node';

// Função ultra-segura para extrair a URL do banco
const getSafeConnectionString = () => {
  const raw = (process.env.POSTGRES_URL || process.env.DATABASE_URL || "").trim();
  if (!raw) return null;

  // Filtra qualquer lixo ou aspas extras que a Vercel possa injetar
  const match = raw.match(/(postgres(?:ql)?:\/\/[^\s'"]+)/);
  if (!match) return null;

  let url = match[1];

  // Remove parâmetros incompatíveis com conexões diretas via driver node
  url = url.replace(/[&?]channel_binding=[^&]+/g, '');
  
  // Força SSL require se não estiver presente
  if (!url.includes('sslmode=')) {
    url += (url.includes('?') ? '&' : '?') + 'sslmode=require';
  }

  return url;
};

// Inicialização segura do pool para não quebrar a API no boot
let pool: any = null;
try {
  const connectionString = getSafeConnectionString();
  if (connectionString) {
    pool = createPool({ connectionString });
  }
} catch (e) {
  console.error('[DB INIT FATAL]:', e);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!pool) {
    return res.status(503).json({ 
      error: 'Conexão Indisponível', 
      detail: 'A URL do banco de dados não foi encontrada ou está inválida.' 
    });
  }

  const identifier = req.query.identifier as string;
  if (!identifier) return res.status(400).json({ error: 'Identificador ausente' });

  try {
    // Criação da tabela de forma resiliente
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
    console.error('[API DATABASE ERROR]:', error.message);
    return res.status(500).json({ 
      error: 'Erro Interno do Banco', 
      message: error.message 
    });
  }
}
