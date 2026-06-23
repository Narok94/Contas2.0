import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

// Configuração centralizada com a variável de ambiente DATABASE_URL
export const sql = neon(process.env.DATABASE_URL || 'postgres://user:pass@host/db');
