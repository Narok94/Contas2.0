
import { createPool } from '@vercel/postgres';
import { VercelRequest, VercelResponse } from '@vercel/node';

// Função para limpar a URL do banco de dados de forma infalível
const getSanitizedUrl = () => {
  let url = (process.env.DATABASE_URL || process.env.POSTGRES_URL || "").trim();
  
  if (!url) return "";

  // 1. Extrai apenas a parte que é uma URL válida (ignora 'psql', aspas, e lixo no final como 'hudr')
  const match = url.match(/(postgres(?:ql)?:\/\/[^\s'"]+)/);
  if (!match) return "";
  
  let cleanUrl = match[1];

  // 2. Remove o channel_binding que quebra a conexão em Node.js serverless
  cleanUrl = cleanUrl.replace(/[&?]channel_binding=require/g, '');
  
  // 3. Garante que sslmode está ativo
  if (!cleanUrl.includes('sslmode=')) {
    cleanUrl += (cleanUrl.includes('?') ? '&' : '?') + 'sslmode=require';
  }

  return cleanUrl;
};

// Inicializa o pool fora do handler para reuso em cold starts
const sanitizedUrl = getSanitizedUrl();
const pool = sanitizedUrl ? createPool({ connectionString: sanitizedUrl }) : null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Logs para debug no console da Vercel
  console.log(`[DB API] Method: ${req.method}, Identifier: ${req.query.identifier}`);

  if (!pool) {
    console.error("[DB API] Erro: DATABASE_URL não encontrada ou inválida.");
    return res.status(503).json({ 
      error: 'Configuração ausente', 
      message: 'Aguardando configuração de banco de dados na Vercel.' 
    });
  }

  try {
    const identifier = req.query.identifier as string;
    if (!identifier) {
      return res.status(400).json({ error: 'Identificador do usuário é obrigatório.' });
    }

    // Garante a existência da tabela
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users_data (
        id SERIAL PRIMARY KEY,
        user_email TEXT NOT NULL UNIQUE,
        content TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // GET: Recupera dados do usuário
    if (req.method === 'GET') {
      const { rows } = await pool.query(
        'SELECT content FROM users_data WHERE user_email = $1',
        [identifier]
      );
      
      const content = rows.length > 0 ? JSON.parse(rows[0].content) : null;
      return res.status(200).json(content);
    }

    // POST: Salva ou atualiza dados do usuário
    if (req.method === 'POST') {
      const contentStr = JSON.stringify(req.body);
      
      await pool.query(`
        INSERT INTO users_data (user_email, content, updated_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (user_email) 
        DO UPDATE SET content = $2, updated_at = CURRENT_TIMESTAMP;
      `, [identifier, contentStr]);
      
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Método não permitido.' });

  } catch (error: any) {
    console.error('[DB API] Erro Crítico:', error.message);
    return res.status(500).json({ 
      error: 'Erro de Banco de Dados', 
      message: error.message,
      hint: 'Verifique se o banco Neon está ativo e se a URL nas variáveis de ambiente está correta.'
    });
  }
}
