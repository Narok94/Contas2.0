
import { sql } from '@vercel/postgres';
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const identifier = req.query.identifier as string;

    if (!identifier) {
      return res.status(400).json({ error: 'Identificador do usuário é obrigatório' });
    }

    // Se o banco não estiver configurado no painel da Vercel, respondemos com 503 (Serviço Indisponível)
    // Isso evita o erro 500 e permite que o front-end fique em modo Local.
    if (!process.env.POSTGRES_URL || process.env.POSTGRES_URL === "") {
      return res.status(503).json({ 
        error: 'DATABASE_NOT_CONFIGURED',
        message: 'Por favor, conecte um banco de dados Vercel Postgres no seu projeto.' 
      });
    }

    // 1. Garantir que a tabela existe
    await sql`
      CREATE TABLE IF NOT EXISTS users_data (
        id SERIAL PRIMARY KEY,
        user_email TEXT NOT NULL,
        content TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // OPERAÇÃO GET (BUSCA)
    if (req.method === 'GET') {
      const { rows } = await sql`
        SELECT content FROM users_data 
        WHERE user_email = ${identifier} 
        ORDER BY updated_at DESC LIMIT 1
      `;
      
      if (rows.length === 0) {
          return res.status(200).json(null);
      }
      
      try {
          return res.status(200).json(JSON.parse(rows[0].content));
      } catch (parseError) {
          console.error("JSON corrompido no banco:", parseError);
          return res.status(200).json(null);
      }
    }

    // OPERAÇÃO POST (SALVAMENTO)
    if (req.method === 'POST') {
      const content = JSON.stringify(req.body);
      
      // Deleta o registro anterior para evitar conflitos de UNIQUE index se houverem
      await sql`DELETE FROM users_data WHERE user_email = ${identifier}`;
      
      // Insere o novo estado do banco
      await sql`
        INSERT INTO users_data (user_email, content, updated_at)
        VALUES (${identifier}, ${content}, CURRENT_TIMESTAMP)
      `;
      
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Método não permitido' });

  } catch (error: any) {
    // Captura qualquer erro (ex: banco offline, erro de SQL) e retorna 500 em formato JSON amigável
    console.error('API Runtime Error:', error.message);
    return res.status(500).json({ 
      error: 'API_ERROR', 
      message: error.message 
    });
  }
}
