
import { sql } from '@vercel/postgres';
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const identifier = req.query.identifier as string;

  if (!identifier) {
    return res.status(400).json({ error: 'Username é obrigatório' });
  }

  // Verificação de segurança das variáveis de ambiente
  if (!process.env.POSTGRES_URL) {
    console.error('DATABASE_ERROR: POSTGRES_URL is missing. Please link the project to a Postgres store in Vercel dashboard.');
    return res.status(503).json({ error: 'Database connection string missing' });
  }

  try {
    if (req.method === 'GET') {
      try {
        const { rows } = await sql`SELECT content FROM users_data WHERE user_email = ${identifier} ORDER BY updated_at DESC LIMIT 1`;
        return res.status(200).json(rows.length > 0 ? JSON.parse(rows[0].content) : null);
      } catch (tableError: any) {
        // Se a tabela não existir, criamos e retornamos null
        if (tableError.message.includes('relation "users_data" does not exist')) {
            await sql`CREATE TABLE IF NOT EXISTS users_data (id SERIAL PRIMARY KEY, user_email TEXT NOT NULL, content TEXT, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`;
            return res.status(200).json(null);
        }
        throw tableError;
      }
    }

    if (req.method === 'POST') {
      const content = JSON.stringify(req.body);
      try {
        // Tentativa de Upsert atômico
        await sql`
          INSERT INTO users_data (user_email, content, updated_at)
          VALUES (${identifier}, ${content}, CURRENT_TIMESTAMP)
          ON CONFLICT (user_email) 
          DO UPDATE SET content = ${content}, updated_at = CURRENT_TIMESTAMP;
        `;
      } catch (upsertError: any) {
        console.warn('UPSERT_WARNING: Falling back to delete/insert logic', upsertError.message);
        // Fallback robusto caso a constraint UNIQUE ainda não tenha sido aplicada
        await sql`DELETE FROM users_data WHERE user_email = ${identifier}`;
        await sql`INSERT INTO users_data (user_email, content) VALUES (${identifier}, ${content})`;
      }
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error: any) {
    console.error('CRITICAL_DATABASE_ERROR:', error.message);
    return res.status(500).json({ error: 'Erro de comunicação com o banco', details: error.message });
  }
}
