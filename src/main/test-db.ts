// test-db.ts
import 'dotenv/config';
import { Client } from 'pg';

(async () => {
  console.log('URL ok?', !!process.env.DATABASE_URL);
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  const r = await client.query('select now(), current_user');
  console.log(r.rows);
  await client.end();
})().catch(e => console.error('PG ERROR:', e));
