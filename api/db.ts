
import { createPool, VercelPool } from '@vercel/postgres';
import { VercelRequest, VercelResponse } from '@vercel/node';

// Singleton pool, lazily initialized.
let pool: VercelPool | null = null;

/**
 * Gets the singleton connection pool.
 * Throws an error if the connection string is missing or if pool creation fails.
 */
function getDbPool(): VercelPool {
  if (pool) {
    return pool;
  }
  
  console.log('[DB POOL] Pool de conexão não encontrado. Tentando criar um novo.');
  const connectionString = process.env.POSTGRES_URL;

  if (!connectionString) {
    console.error('[DB POOL ERROR] A variável de ambiente POSTGRES_URL não foi encontrada.');
    throw new Error('Configuração do banco de dados incompleta no servidor.');
  }
  
  // Log a redacted version to confirm the value is there without exposing the password
  const redactedUrl = connectionString.replace(/:([^:]+)@/, ':********@');
  console.log(`[DB POOL] Usando a connection string: ${redactedUrl}`);

  try {
    const newPool = createPool({ connectionString });
    pool = newPool;
    console.log('[DB POOL] Novo pool de conexão criado com sucesso.');
    return pool;
  } catch (e: any) {
    console.error('[DB POOL ERROR] Falha ao criar o pool de conexão.', e.message);
    throw e; // Rethrow to be caught by the handler
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  let dbPool: VercelPool;
  try {
    dbPool = getDbPool();
  } catch (error: any) {
    return res.status(503).json({ 
      error: 'Falha na Inicialização do Banco de Dados', 
      detail: error.message 
    });
  }

  const identifier = req.query.identifier as string;
  if (!identifier) {
    return res.status(400).json({ error: 'Identificador de usuário ausente.' });
  }

  let client;
  try {
    client = await dbPool.connect();
    console.log('[DB HANDLER] Conexão com o banco de dados estabelecida com sucesso.');
    
    // Ensure the table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS controle_contas (
        id SERIAL PRIMARY KEY,
        user_identifier TEXT NOT NULL UNIQUE,
        content TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    if (req.method === 'GET') {
      const { rows } = await client.query('SELECT content FROM controle_contas WHERE user_identifier = $1', [identifier]);
      return res.status(200).json(rows.length > 0 ? JSON.parse(rows[0].content) : null);
    }

    if (req.method === 'POST') {
      await client.query(`
        INSERT INTO controle_contas (user_identifier, content, updated_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (user_identifier) 
        DO UPDATE SET content = EXCLUDED.content, updated_at = CURRENT_TIMESTAMP;
      `, [identifier, JSON.stringify(req.body)]);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Método não permitido' });

  } catch (error: any) {
    console.error('[API DATABASE ERROR]:', error.message);
    // Log the full error object for more details
    console.error('[API DATABASE ERROR DETAILS]:', JSON.stringify(error, null, 2));
    return res.status(500).json({ 
      error: 'Erro Interno do Servidor ao Acessar o Banco de Dados', 
      message: error.message 
    });
  } finally {
      client?.release();
  }
}
