
import { sql } from '@vercel/postgres';
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const identifier = req.query.identifier as string;

    if (!identifier) {
      return res.status(400).json({ error: 'Identificador do usuário é obrigatório' });
    }

    // Cria a tabela se não existir
    await sql`
      CREATE TABLE IF NOT EXISTS users_data (
        id SERIAL PRIMARY KEY,
        user_email TEXT NOT NULL UNIQUE,
        content TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // OPERAÇÃO GET (BUSCA)
    if (req.method === 'GET') {
      const { rows } = await sql`
        SELECT content FROM users_data WHERE user_email = ${identifier}
      `;
      
      if (rows.length === 0) return res.status(200).json(null);
      return res.status(200).json(JSON.parse(rows[0].content));
    }

    // OPERAÇÃO POST (SALVAMENTO)
    if (req.method === 'POST') {
      const content = JSON.stringify(req.body);
      
      await sql`
        INSERT INTO users_data (user_email, content, updated_at)
        VALUES (${identifier}, ${content}, CURRENT_TIMESTAMP)
        ON CONFLICT (user_email) 
        DO UPDATE SET content = ${content}, updated_at = CURRENT_TIMESTAMP;
      `;
      
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Método não permitido' });

  } catch (error: any) {
    console.error('API Database Error:', error);
    return res.status(500).json({ 
      error: 'Erro no banco de dados', 
      message: error.message,
      env_configured: !!process.env.POSTGRES_URL 
    });
  }
}
