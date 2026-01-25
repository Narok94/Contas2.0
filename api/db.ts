
import { sql } from '@vercel/postgres';
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const identifier = req.query.identifier as string;

  if (!identifier) {
    return res.status(400).json({ error: 'Identificador do usuário é obrigatório' });
  }

  if (!process.env.POSTGRES_URL) {
    return res.status(503).json({ error: 'Configuração de banco de dados ausente na Vercel' });
  }

  try {
    // 1. Garantir que a tabela existe com a estrutura correta
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS users_data (
          id SERIAL PRIMARY KEY,
          user_email TEXT NOT NULL,
          content TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;
      // Tenta adicionar a restrição UNIQUE se ela não existir. 
      // O 'ON CONFLICT' exige que a coluna tenha um índice UNIQUE.
      await sql`ALTER TABLE users_data ADD CONSTRAINT unique_user_email UNIQUE (user_email);`.catch(() => {
        // Ignora se a constraint já existir
      });
    } catch (e) {
      console.error("Erro ao preparar tabela:", e);
    }

    if (req.method === 'GET') {
      const { rows } = await sql`SELECT content FROM users_data WHERE user_email = ${identifier} LIMIT 1`;
      return res.status(200).json(rows.length > 0 ? JSON.parse(rows[0].content) : null);
    }

    if (req.method === 'POST') {
      const content = JSON.stringify(req.body);
      
      try {
        // Tenta o UPSERT (Insert or Update) atômico
        await sql`
          INSERT INTO users_data (user_email, content, updated_at)
          VALUES (${identifier}, ${content}, CURRENT_TIMESTAMP)
          ON CONFLICT (user_email) 
          DO UPDATE SET content = ${content}, updated_at = CURRENT_TIMESTAMP;
        `;
      } catch (upsertError) {
        // Fallback caso a constraint UNIQUE falhe por algum motivo de dados duplicados já existentes
        await sql`DELETE FROM users_data WHERE user_email = ${identifier}`;
        await sql`INSERT INTO users_data (user_email, content) VALUES (${identifier}, ${content})`;
      }
      
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error: any) {
    console.error('Database API Error:', error);
    return res.status(500).json({ 
      error: 'Falha na operação de banco', 
      details: error.message 
    });
  }
}
