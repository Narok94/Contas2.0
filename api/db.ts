
import { createPool } from '@vercel/postgres';
import { VercelRequest, VercelResponse } from '@vercel/node';

let pool: any = null;
try {
  // O createPool() sem argumentos detecta automaticamente as variáveis de ambiente 
  // (POSTGRES_URL, DATABASE_URL, etc.) fornecidas pela Vercel.
  // Esta é a maneira mais robusta e recomendada.
  if (process.env.POSTGRES_URL || process.env.DATABASE_URL) {
    pool = createPool();
  }
} catch (e: any) {
  console.error('[DB INIT ERROR]: Falha ao criar o pool de conexão.', e.message);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Linha de log para depuração
  console.log(`[API DB HANDLER] Verificando POSTGRES_URL. Definida: ${!!process.env.POSTGRES_URL}`);
    
  if (!pool) {
    return res.status(503).json({ 
      error: 'Configuração Incompleta do Banco de Dados', 
      detail: 'A variável de ambiente POSTGRES_URL ou DATABASE_URL não foi encontrada ou é inválida nas configurações do projeto Vercel.' 
    });
  }

  const identifier = req.query.identifier as string;
  if (!identifier) return res.status(400).json({ error: 'Identificador de usuário ausente.' });

  try {
    // Garante que a tabela 'controle_contas' exista
    await pool.query(`
      CREATE TABLE IF NOT EXISTS controle_contas (
        id SERIAL PRIMARY KEY,
        user_identifier TEXT NOT NULL UNIQUE,
        content TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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
        DO UPDATE SET content = EXCLUDED.content, updated_at = CURRENT_TIMESTAMP;
      `, [identifier, JSON.stringify(req.body)]);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error: any) {
    console.error('[API DATABASE ERROR]:', error.message);
    return res.status(500).json({ error: 'Erro Interno do Servidor', message: error.message });
  }
}
