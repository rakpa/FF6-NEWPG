
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
const { Pool } = pg;
import * as schema from '../shared/schema';

// Using the provided database URL
const pool = new Pool({
  connectionString: 'rakpa:abc123@ec2-13-51-114-32.eu-north-1.compute.amazonaws.com:5432/postgres?schema=public',
});

export const db = drizzle(pool, { schema });
