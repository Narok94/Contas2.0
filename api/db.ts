// Fix: Changed require to import for ES module compatibility.
import { createPool } from '@vercel/postgres';

let pool: any = null;

function getDbPool() {
  if (pool) {
    return pool;
  }
  
  console.log('[DB POOL] Pool de conexão não encontrado. Tentando criar um novo.');
  const connectionString = process.env.POSTGRES_URL;

  if (!connectionString) {
    console.error('[DB POOL ERROR] A variável de ambiente POSTGRES_URL não foi encontrada.');
    throw new Error('Configuração do banco de dados incompleta no servidor.');
  }
  
  const redactedUrl = connectionString.replace(/:([^:]+)@/, ':********@');
  console.log(`[DB POOL] Usando a connection string: ${redactedUrl}`);

  try {
    const newPool = createPool({ connectionString });
    pool = newPool;
    console.log('[DB POOL] Novo pool de conexão criado com sucesso.');
    return pool;
  } catch (e: any) {
    console.error('[DB POOL ERROR] Falha ao criar o pool de conexão.', e.message);
    throw e; 
  }
}

// Fix: Changed module.exports to export default for ES module compatibility.
export default async (req: any, res: any) => {
  let dbPool: any;
  try {
    dbPool = getDbPool();
  } catch (error: any) {
    return res.status(503).json({ 
      error: 'Falha na Inicialização do Banco de Dados', 
      detail: error.message 
    });
  }

  const identifier = req.query.identifier;
  if (!identifier) {
    return res.status(400).json({ error: 'Identificador de usuário ausente.' });
  }

  let client: any;
  try {
    client = await dbPool.connect();
    console.log('[DB HANDLER] Conexão com o banco de dados estabelecida com sucesso.');
    
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
    console.error('[API DATABASE ERROR DETAILS]:', JSON.stringify(error, null, 2));
    return res.status(500).json({ 
      error: 'Erro Interno do Servidor ao Acessar o Banco de Dados', 
      message: error.message 
    });
  } finally {
      if (client) {
        client.release();
      }
  }
};
