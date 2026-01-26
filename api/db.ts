
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

    // --- LÓGICA DE MIGRAÇÃO E SANEAMENTO DE SCHEMA DEFINITIVA ---
    await client.query('BEGIN');

    // 1. Garante que a tabela exista com a estrutura mínima essencial.
    await client.query(`
      CREATE TABLE IF NOT EXISTS controle_contas (
        id SERIAL PRIMARY KEY,
        user_identifier TEXT UNIQUE NOT NULL
      );
    `);

    // 2. Obtém todas as colunas existentes na tabela.
    const { rows: existingColumnsResult } = await client.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'controle_contas';
    `);
    const existingColumns = existingColumnsResult.map(c => c.column_name);

    // 3. Define o "schema de ouro" - as únicas colunas que devem existir.
    const requiredColumns = new Set(['id', 'user_identifier', 'content', 'updated_at']);

    // 4. REMOVE qualquer coluna que não pertença ao schema de ouro.
    const columnsToDrop = existingColumns.filter(col => !requiredColumns.has(col));
    for (const col of columnsToDrop) {
        console.warn(`[DB MIGRATION] Saneamento: Removendo coluna inesperada "${col}".`);
        await client.query(`ALTER TABLE controle_contas DROP COLUMN "${col}";`);
    }

    // 5. GARANTE que todas as colunas do schema de ouro existam.
    await client.query(`ALTER TABLE controle_contas ADD COLUMN IF NOT EXISTS content TEXT;`);
    await client.query(`ALTER TABLE controle_contas ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;`);

    // 6. FORÇA as restrições corretas em todas as colunas necessárias.
    // Garante que 'updated_at' não tenha nulos antes de aplicar NOT NULL.
    await client.query(`UPDATE controle_contas SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;`);
    // Define o valor padrão e a restrição NOT NULL para 'updated_at'.
    await client.query(`ALTER TABLE controle_contas ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;`);
    await client.query(`ALTER TABLE controle_contas ALTER COLUMN updated_at SET NOT NULL;`);
    
    await client.query('COMMIT');
    console.log('[DB MIGRATION] Saneamento e verificação de schema concluídos com sucesso.');
    
    if (req.method === 'GET') {
      console.log('[DB HANDLER] Executando GET.');
      const { rows } = await client.query('SELECT content FROM controle_contas WHERE user_identifier = $1', [identifier]);
      console.log(`[DB HANDLER] GET encontrou ${rows.length} registros.`);
      return res.status(200).json(rows.length > 0 && rows[0].content ? JSON.parse(rows[0].content) : null);
    }

    if (req.method === 'POST') {
      console.log('[DB HANDLER] Executando POST.');
      await client.query(`
        INSERT INTO controle_contas (user_identifier, content)
        VALUES ($1, $2)
        ON CONFLICT (user_identifier) 
        DO UPDATE SET content = EXCLUDED.content, updated_at = CURRENT_TIMESTAMP;
      `, [identifier, JSON.stringify(req.body)]);
      console.log('[DB HANDLER] POST executado com sucesso.');
      return res.status(200).json({ success: true });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: `Método ${req.method} não permitido.` });

  } catch (error: any) {
    if (client) {
      await client.query('ROLLBACK');
      console.error('[DB HANDLER] Transação revertida devido a erro.');
    }
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
