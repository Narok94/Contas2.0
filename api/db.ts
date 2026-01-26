
import { createPool } from '@vercel/postgres';
import { VercelRequest, VercelResponse } from '@vercel/node';

const getSafeConnectionString = () => {
  const raw = (process.env.POSTGRES_URL || process.env.DATABASE_URL || "").trim();
  if (!raw) return null;

  const match = raw.match(/(postgres(?:ql)?:\/\/[^\s'"]+)/);
  if (!match) return null;

  let url = match[1];
  url = url.replace(/[&?]channel_binding=[^&]+/g, '');
  
  if (!url.includes('sslmode=')) {
    url += (url.includes('?') ? '&' : '?') + 'sslmode=require';
  }

  return url;
};

let pool: any = null;
try {
  const connectionString = getSafeConnectionString();
  if (connectionString) {
    pool = createPool({ connectionString });
  }
} catch (e) {
  console.error('[DB INIT ERROR]:', e);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!pool) {
    return res.status(503).json({ 
      error: 'Configuração Incompleta', 
      detail: 'A variável DATABASE_URL não foi encontrada nas configurações do projeto.' 
    });
  }

  const identifier = req.query.identifier as string;
  if (!identifier) return res.status(400).json({ error: 'Identificador ausente' });

  try {
    // Utiliza a tabela 'controle_contas' conforme solicitado
    await pool.query(`
      CREATE TABLE IF NOT EXISTS controle_contas (
        id SERIAL PRIMARY KEY,
        user_identifier TEXT NOT NULL UNIQUE,
        content TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    if (req.method === 'GET') {
      const { rows } = await pool.query('SELECT content FROM controle_contas WHERE user_identifier = $1', [identifier]);
      return res.status(200).json(rows.length > 0 ? JSON.parse(rows[0].content) : null);
    }

    if (req.method === 'POST') {
      await pool.query(`
        INSERT INTO controle_contas (user_identifier, content, updated_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (user_identifier) 
        DO UPDATE SET content = $2, updated_at = CURRENT_TIMESTAMP;
      `, [identifier, JSON.stringify(req.body)]);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error: any) {
    console.error('[API ERROR]:', error.message);
    return res.status(500).json({ error: 'Erro de Banco de Dados', message: error.message });
  }
}
