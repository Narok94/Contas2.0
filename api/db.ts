
import { createPool } from '@vercel/postgres';
import { VercelRequest, VercelResponse } from '@vercel/node';

// Inicializa o pool usando a variável DATABASE_URL fornecida pelo Neon
const pool = createPool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

  if (!connectionString) {
    console.error('ERRO: DATABASE_URL não encontrada nas variáveis de ambiente.');
    return res.status(503).json({ 
      error: 'Variáveis de ambiente ausentes', 
      message: 'Configure DATABASE_URL nas configurações da Vercel.' 
    });
  }

  try {
    const identifier = req.query.identifier as string;

    if (!identifier) {
      return res.status(400).json({ error: 'Identificador do usuário é obrigatório' });
    }

    // Garante que a tabela 'users_data' existe com índice único para o Upsert funcionar
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users_data (
        id SERIAL PRIMARY KEY,
        user_email TEXT NOT NULL,
        content TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Adiciona restrição de unicidade se não houver (para evitar erros no ON CONFLICT)
    try {
        await pool.query('ALTER TABLE users_data ADD CONSTRAINT unique_user_email UNIQUE (user_email)');
    } catch (e) {
        // Ignora se o constraint já existe
    }

    // OPERAÇÃO GET (Busca dados salvos)
    if (req.method === 'GET') {
      const { rows } = await pool.query(
        'SELECT content FROM users_data WHERE user_email = $1',
        [identifier]
      );
      
      if (rows.length === 0) return res.status(200).json(null);
      return res.status(200).json(JSON.parse(rows[0].content));
    }

    // OPERAÇÃO POST (Salva trades/contas)
    if (req.method === 'POST') {
      const contentStr = JSON.stringify(req.body);
      
      // Upsert: Se o usuário já existe, atualiza. Se não, insere.
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
    console.error('Erro no Banco de Dados:', error);
    return res.status(500).json({ 
      error: 'Falha na operação de banco', 
      details: error.message 
    });
  }
}
