
import { sql } from '@vercel/postgres';
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const identifier = req.query.identifier as string;

  if (!identifier) {
    return res.status(400).json({ error: 'Username é obrigatório' });
  }

  // Verifica se a Vercel já injetou a URL do banco. 
  // Se não injetou, retornamos 503 (Serviço Indisponível) para o frontend saber que é erro de config.
  if (!process.env.POSTGRES_URL) {
    return res.status(503).json({ error: 'Banco de dados não vinculado na Vercel' });
  }

  try {
    // Tenta garantir a tabela apenas se necessário, ignorando erros de "já existe"
    try {
      await sql`CREATE TABLE IF NOT EXISTS users_data (id SERIAL PRIMARY KEY, user_email TEXT NOT NULL, content TEXT, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`;
    } catch (e) { /* Tabela provavelmente já existe */ }

    if (req.method === 'GET') {
      const { rows } = await sql`SELECT content FROM users_data WHERE user_email = ${identifier} ORDER BY updated_at DESC LIMIT 1`;
      return res.status(200).json(rows.length > 0 ? JSON.parse(rows[0].content) : null);
    }

    if (req.method === 'POST') {
      const content = JSON.stringify(req.body);
      try {
        // Upsert otimizado
        await sql`
          INSERT INTO users_data (user_email, content, updated_at)
          VALUES (${identifier}, ${content}, CURRENT_TIMESTAMP)
          ON CONFLICT (user_email) 
          DO UPDATE SET content = ${content}, updated_at = CURRENT_TIMESTAMP;
        `;
      } catch (upsertError) {
        // Fallback para bancos sem a constraint UNIQUE ainda
        await sql`DELETE FROM users_data WHERE user_email = ${identifier}`;
        await sql`INSERT INTO users_data (user_email, content) VALUES (${identifier}, ${content})`;
      }
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error: any) {
    console.error('Database Error:', error.message);
    return res.status(500).json({ error: 'Erro de comunicação com o banco' });
  }
}
