const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

async function run() {
  const projectRoot = process.cwd();
  const dataDir = path.join(projectRoot, 'data');
  const dbPath = path.join(dataDir, 'ultimate_db_v2.sqlite');

  if (!fs.existsSync(dataDir)) {
    console.error('Data folder not found:', dataDir);
    process.exit(1);
  }

  const db = new sqlite3.Database(dbPath);

  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS microphones (id TEXT PRIMARY KEY, json TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS speakers (id TEXT PRIMARY KEY, json TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS consoles (id TEXT PRIMARY KEY, json TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS fixtures (id TEXT PRIMARY KEY, json TEXT)`);
  });

  const files = [
    { filename: 'microphones_v2.json', table: 'microphones' },
    { filename: 'speakers_v2.json', table: 'speakers' },
    { filename: 'consoles_v2.json', table: 'consoles' },
    { filename: 'fixtures_v2.json', table: 'fixtures' },
  ];

  for (const f of files) {
    const file = path.join(dataDir, f.filename);
    if (!fs.existsSync(file)) {
      console.warn("Missing:", f.filename);
      continue;
    }

    const arr = JSON.parse(fs.readFileSync(file, 'utf8'));
    console.log("Importing", arr.length, "rows into", f.table);

    const insert = db.prepare(`INSERT OR REPLACE INTO ${f.table} (id, json) VALUES (?, ?)`);
    for (const item of arr) {
      if (!item) continue;
      const id = item.id || item.model || item.brand;
      if (!id) continue;
      insert.run(id, JSON.stringify({ ...item, id }));
    }
    insert.finalize();
  }

  db.close(() => console.log("Import complete! DB path:", dbPath));
}

run();
