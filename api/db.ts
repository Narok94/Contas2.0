
import { sql } from '@vercel/postgres';
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const identifier = req.query.identifier as string;

  if (!identifier) {
    return res.status(400).json({ error: 'Identificador do usuário é obrigatório' });
  }

  // Verifica se o banco de dados está conectado
  if (!process.env.POSTGRES_URL) {
    return res.status(503).json({ error: 'POSTGRES_URL não configurada no ambiente Vercel' });
  }

  try {
    // 1. Garantir que a tabela existe
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS users_data (
          id SERIAL PRIMARY KEY,
          user_email TEXT NOT NULL,
          content TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;
    } catch (tableError) {
      console.error("Erro ao criar tabela:", tableError);
    }

    // OPERAÇÃO GET (BUSCA)
    if (req.method === 'GET') {
      const { rows } = await sql`
        SELECT content FROM users_data 
        WHERE user_email = ${identifier} 
        ORDER BY updated_at DESC LIMIT 1
      `;
      return res.status(200).json(rows.length > 0 ? JSON.parse(rows[0].content) : null);
    }

    // OPERAÇÃO POST (SALVAMENTO)
    if (req.method === 'POST') {
      const content = JSON.stringify(req.body);
      
      // Fluxo ultra-resiliente: Deleta o anterior e insere o novo.
      // Isso funciona mesmo se não houver índices UNIQUE ou constraints.
      await sql`DELETE FROM users_data WHERE user_email = ${identifier}`;
      await sql`
        INSERT INTO users_data (user_email, content, updated_at)
        VALUES (${identifier}, ${content}, CURRENT_TIMESTAMP)
      `;
      
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error: any) {
    console.error('Database API Error:', error.message);
    return res.status(500).json({ 
      error: 'Falha crítica no banco de dados', 
      message: error.message 
    });
  }
}
