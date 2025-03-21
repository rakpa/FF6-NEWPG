
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
const { Pool } = pg;
import * as schema from '../shared/schema';

// Using the provided database URL
const pool = new Pool({
  connectionString: 'postgresql://rakpa:India%40123@127.0.0.1:5432/postgres?schema=public',
});

export const db = drizzle(pool, { schema });
