// lib/data/import-json.ts
// Node script to import JSON datasets into SQLite and validate with Zod.
import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { MicrophoneSchema } from '../schemas/microphone.schema';
import { SpeakerSchema } from '../schemas/speaker.schema';
import { ConsoleSchema } from '../schemas/console.schema';
import { FixtureSchema } from '../schemas/fixture.schema';

async function main() {
  const projectRoot = path.resolve(__dirname, '..', '..');
  const dataDir = path.join(projectRoot, 'data');
  const dbPath = path.join(projectRoot, 'data', 'ultimate_db_v2.sqlite');

  const db = await open({ filename: dbPath, driver: sqlite3.Database });

  // Ensure tables exist (simple)
  await db.exec(`CREATE TABLE IF NOT EXISTS microphones (id TEXT PRIMARY KEY, json TEXT)`);
  await db.exec(`CREATE TABLE IF NOT EXISTS speakers (id TEXT PRIMARY KEY, json TEXT)`);
  await db.exec(`CREATE TABLE IF NOT EXISTS consoles (id TEXT PRIMARY KEY, json TEXT)`);
  await db.exec(`CREATE TABLE IF NOT EXISTS fixtures (id TEXT PRIMARY KEY, json TEXT)`);

  const files = [
    ['microphones_v2.json', MicrophoneSchema, 'microphones'],
    ['speakers_v2.json', SpeakerSchema, 'speakers'],
    ['consoles_v2.json', ConsoleSchema, 'consoles'],
    ['fixtures_v2.json', FixtureSchema, 'fixtures'],
  ];

  for (const [filename, schema, table] of files) {
    const filePath = path.join(dataDir, filename);
    if (!fs.existsSync(filePath)) { console.warn('missing', filePath); continue; }
    const raw = fs.readFileSync(filePath, 'utf-8');
    const arr = JSON.parse(raw);
    console.log(`Importing ${arr.length} rows into ${table} from ${filename}`);
    for (const item of arr) {
      try { schema.parse(item); await db.run(`INSERT OR REPLACE INTO ${table} (id,json) VALUES (?,?)`, item.id, JSON.stringify(item)); } catch (err) { console.error('Validation failed for', item.id, err); }
    }
  }

  await db.close();
  console.log('Import complete.');
}

main().catch(err=>{ console.error(err); process.exit(1); });
