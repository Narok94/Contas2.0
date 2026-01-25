
import { sql } from '@vercel/postgres';
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Para fins de simplicidade e seguindo a sugestão do usuário, 
  // usaremos um identificador para o estado da aplicação.
  // Em uma aplicação real, usaríamos o e-mail do usuário logado.
  const identifier = req.query.identifier as string || 'global_state';

  if (req.method === 'GET') {
    try {
      const { rows } = await sql`SELECT content FROM users_data WHERE user_email = ${identifier} LIMIT 1`;
      if (rows.length === 0) {
        return res.status(200).json(null);
      }
      return res.status(200).json(JSON.parse(rows[0].content));
    } catch (error: any) {
      console.error('Database Error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const content = JSON.stringify(req.body);
      // O ON CONFLICT requer uma constraint UNIQUE. Se o usuário não criou, 
      // fazemos um DELETE seguido de INSERT para garantir a persistência da linha única.
      await sql`DELETE FROM users_data WHERE user_email = ${identifier}`;
      await sql`
        INSERT INTO users_data (user_email, content)
        VALUES (${identifier}, ${content})
      `;
      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Database Error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
