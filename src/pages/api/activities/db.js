// src\pages\api\activities\db.js
import { Pool } from 'pg';

let pool;

const getPool = () => {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set.");
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    pool.on('error', (err, client) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });
  }
  return pool;
};

export default getPool;