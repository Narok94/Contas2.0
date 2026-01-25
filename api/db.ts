
import { sql } from '@vercel/postgres';
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const identifier = req.query.identifier as string;

  if (!identifier) {
    return res.status(400).json({ error: 'Identificador do usuário é obrigatório' });
  }

  // Verifica se a variável de ambiente está configurada
  if (!process.env.POSTGRES_URL) {
    console.error("ERRO: POSTGRES_URL não configurada no painel da Vercel.");
    return res.status(503).json({ error: 'Configuração de banco de dados ausente' });
  }

  try {
    // 1. Garante a existência da tabela
    await sql`
      CREATE TABLE IF NOT EXISTS users_data (
        id SERIAL PRIMARY KEY,
        user_email TEXT NOT NULL,
        content TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 2. Operação de Busca (GET)
    if (req.method === 'GET') {
      const { rows } = await sql`
        SELECT content FROM users_data 
        WHERE user_email = ${identifier} 
        ORDER BY updated_at DESC LIMIT 1
      `;
      return res.status(200).json(rows.length > 0 ? JSON.parse(rows[0].content) : null);
    }

    // 3. Operação de Salvamento (POST)
    if (req.method === 'POST') {
      const content = JSON.stringify(req.body);
      
      // Abordagem ultra-segura: remove qualquer registro anterior do usuário e insere o novo.
      // Isso evita erros de 'ON CONFLICT' caso o índice UNIQUE esteja corrompido ou ausente.
      await sql`DELETE FROM users_data WHERE user_email = ${identifier}`;
      await sql`
        INSERT INTO users_data (user_email, content, updated_at)
        VALUES (${identifier}, ${content}, CURRENT_TIMESTAMP)
      `;
      
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error: any) {
    console.error('API Error:', error.message);
    return res.status(500).json({ 
      error: 'Erro interno no banco de dados',
      details: error.message 
    });
  }
}
