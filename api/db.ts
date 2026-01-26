
import { createPool } from '@vercel/postgres';
import type { VercelPool } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

let pool: VercelPool | null = null;

function getDbPool(): VercelPool {
  if (pool) {
    return pool;
  }
  
  console.log('[DB POOL] Tentando criar um novo pool de conexão.');
  const connectionString = process.env.POSTGRES_URL;

  if (!connectionString) {
    console.error('[DB POOL ERROR] A variável de ambiente POSTGRES_URL não foi encontrada.');
    throw new Error('A variável de ambiente POSTGRES_URL não está definida no servidor.');
  }
  
  try {
    const newPool = createPool({ connectionString });
    pool = newPool;
    console.log('[DB POOL] Novo pool de conexão criado com sucesso.');
    return pool;
  } catch (e: any) {
    console.error('[DB POOL ERROR] Falha ao criar o pool de conexão:', e.message);
    throw e; 
  }
}

const handler = async (req: VercelRequest, res: VercelResponse) => {
  console.log(`[DB HANDLER] Função invocada. Método: ${req.method}.`);

  let dbPool: VercelPool;
  try {
    dbPool = getDbPool();
  } catch (error: any) {
    console.error('[DB HANDLER ERROR] Erro ao obter o pool de conexão:', { message: error.message });
    return res.status(503).json({ 
      error: 'Falha na Inicialização do Banco de Dados', 
      detail: error.message 
    });
  }

  const identifier = req.query.identifier as string;
  if (!identifier) {
    console.log('[DB HANDLER WARN] Identificador de usuário ausente na query.');
    return res.status(400).json({ error: 'Identificador de usuário ausente.' });
  }
  console.log(`[DB HANDLER] Processando para o identificador: ${identifier}`);

  let client;
  try {
    console.log('[DB HANDLER] Tentando conectar ao banco de dados...');
    client = await dbPool.connect();
    console.log('[DB HANDLER] Conexão com o banco de dados estabelecida.');
    
    // --- Lógica de Migração de Schema Robusta ---
    // 1. A instrução CREATE TABLE agora reflete o schema ideal para novas instâncias.
    await client.query(`
      CREATE TABLE IF NOT EXISTS controle_contas (
        id SERIAL PRIMARY KEY,
        user_identifier TEXT,
        content TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Garante que TODAS as colunas necessárias existam, adicionando-as se ausentes.
    //    Isso migra schemas mais antigos para o estado atual sem perda de dados.
    await client.query(`ALTER TABLE controle_contas ADD COLUMN IF NOT EXISTS user_identifier TEXT;`);
    await client.query(`ALTER TABLE controle_contas ADD COLUMN IF NOT EXISTS content TEXT;`);
    await client.query(`ALTER TABLE controle_contas ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;`);
    
    // 3. Garante que haja um índice único em user_identifier para a cláusula ON CONFLICT funcionar.
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS controle_contas_user_identifier_idx ON controle_contas (user_identifier);`);
    
    if (req.method === 'GET') {
      console.log('[DB HANDLER] Executando GET.');
      const { rows } = await client.query('SELECT content FROM controle_contas WHERE user_identifier = $1', [identifier]);
      console.log(`[DB HANDLER] GET encontrou ${rows.length} registros.`);
      return res.status(200).json(rows.length > 0 && rows[0].content ? JSON.parse(rows[0].content) : null);
    }

    if (req.method === 'POST') {
      console.log('[DB HANDLER] Executando POST.');
      await client.query(`
        INSERT INTO controle_contas (user_identifier, content, updated_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (user_identifier) 
        DO UPDATE SET content = EXCLUDED.content, updated_at = CURRENT_TIMESTAMP;
      `, [identifier, JSON.stringify(req.body)]);
      console.log('[DB HANDLER] POST executado com sucesso.');
      return res.status(200).json({ success: true });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: `Método ${req.method} não permitido.` });

  } catch (error: any) {
    console.error('[API DATABASE ERROR] Erro durante a operação do banco de dados:', { message: error.message, stack: error.stack });
    return res.status(500).json({ 
      error: 'Erro Interno do Servidor ao Acessar o Banco de Dados', 
      message: error.message 
    });
  } finally {
      if (client) {
        client.release();
        console.log('[DB HANDLER] Conexão liberada.');
      }
  }
};

export default handler;
