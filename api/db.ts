
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
    
    // --- Lógica de Saneamento de Schema ---
    // Detecta e neutraliza colunas inesperadas que podem ter sido adicionadas
    // manualmente ou por versões de código anteriores, causando falhas de 'NOT NULL'.
    try {
        const { rows: columnCheck } = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='controle_contas' AND column_name='email_usuario' AND is_nullable='NO'
        `);
        if (columnCheck.length > 0) {
            console.warn('[DB HANDLER] Saneamento: Coluna "email_usuario" NOT NULL inesperada encontrada. Alterando para ser anulável.');
            // A operação mais segura é tornar a coluna anulável para que as inserções não falhem.
            await client.query(`ALTER TABLE controle_contas ALTER COLUMN email_usuario DROP NOT NULL;`);
            console.log('[DB HANDLER] Saneamento: Coluna "email_usuario" agora é anulável.');
        }
    } catch (e: any) {
        console.error('[DB HANDLER] Erro não crítico durante o saneamento do schema, mas continuando a execução.', e.message);
    }

    // --- Lógica de Migração de Schema Robusta ---
    // 1. Cria a tabela com o schema ideal, se ela não existir.
    await client.query(`
      CREATE TABLE IF NOT EXISTS controle_contas (
        id SERIAL PRIMARY KEY,
        user_identifier TEXT UNIQUE,
        content TEXT,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Para tabelas existentes, garante que todas as colunas necessárias existam.
    await client.query(`ALTER TABLE controle_contas ADD COLUMN IF NOT EXISTS user_identifier TEXT;`);
    await client.query(`ALTER TABLE controle_contas ADD COLUMN IF NOT EXISTS content TEXT;`);
    await client.query(`ALTER TABLE controle_contas ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;`);
    
    // 3. Garante o índice de unicidade, caso a restrição UNIQUE não tenha sido criada com a tabela.
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS controle_contas_user_identifier_idx ON controle_contas (user_identifier);`);
    
    // 4. Garante que a coluna 'updated_at' tenha as restrições corretas, atualizando-a de forma segura.
    await client.query(`UPDATE controle_contas SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;`);
    await client.query(`ALTER TABLE controle_contas ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;`);
    await client.query(`ALTER TABLE controle_contas ALTER COLUMN updated_at SET NOT NULL;`);
    
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
