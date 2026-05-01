#!/usr/bin/env node
/**
 * Simple MongoDB migration runner for Mongoose.
 *
 * Usage:
 *   node migrations/run.js              # Apply all pending migrations (up)
 *   node migrations/run.js --rollback   # Rollback last applied migration (down)
 *   node migrations/run.js --status     # Show applied & pending migrations
 *
 * Migrations are JS files exporting: { name, up(mongoose), down(mongoose) }
 * Applied migrations are stored in the collection `__migrations`.
 */
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env from backend/.env regardless of CWD
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MIGRATIONS_DIR = __dirname;
const MIGRATION_COLLECTION = '__migrations';

async function connect() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('[MIGRATE] MONGODB_URI not set in environment');
    process.exit(1);
  }
  await mongoose.connect(uri);
}

function loadMigrationFiles() {
  return fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => /\.js$/.test(f) && f !== 'run.js')
    .sort(); // alphabetical implies chronological if prefixed with timestamps
}

function instantiateMigrations(files) {
  return files.map(f => {
    const mod = require(path.join(MIGRATIONS_DIR, f));
    if (!mod.name || typeof mod.up !== 'function' || typeof mod.down !== 'function') {
      throw new Error(`Migration file ${f} is missing required exports (name, up, down)`);
    }
    return { ...mod, file: f };
  });
}

async function getApplied() {
  const col = mongoose.connection.collection(MIGRATION_COLLECTION);
  const docs = await col.find({}).sort({ appliedAt: 1 }).toArray();
  return docs;
}

async function recordApplied(migration) {
  const col = mongoose.connection.collection(MIGRATION_COLLECTION);
  await col.insertOne({
    name: migration.name,
    file: migration.file,
    appliedAt: new Date()
  });
}

async function removeApplied(name) {
  const col = mongoose.connection.collection(MIGRATION_COLLECTION);
  await col.deleteOne({ name });
}

async function runUp(allMigrations) {
  const applied = await getApplied();
  const appliedNames = new Set(applied.map(m => m.name));
  const pending = allMigrations.filter(m => !appliedNames.has(m.name));
  if (!pending.length) {
    console.log('[MIGRATE] No pending migrations');
    return;
  }
  for (const migration of pending) {
    console.log(`[MIGRATE] Applying ${migration.name}...`);
    try {
      const result = await migration.up(mongoose);
      await recordApplied(migration);
      console.log(`[MIGRATE] Applied ${migration.name}: ${result}`);
    } catch (err) {
      console.error(`[MIGRATE] Failed ${migration.name}:`, err.message);
      console.error('[MIGRATE] Aborting further migrations');
      process.exit(2);
    }
  }
  console.log('[MIGRATE] All pending migrations applied');
}

async function runRollback(allMigrations) {
  const applied = await getApplied();
  if (!applied.length) {
    console.log('[MIGRATE] No applied migrations to rollback');
    return;
  }
  const last = applied[applied.length - 1];
  const migration = allMigrations.find(m => m.name === last.name);
  if (!migration) {
    console.error(`[MIGRATE] Migration record ${last.name} has no corresponding file; manual cleanup required`);
    process.exit(3);
  }
  console.log(`[MIGRATE] Rolling back ${migration.name}...`);
  try {
    const result = await migration.down(mongoose);
    await removeApplied(migration.name);
    console.log(`[MIGRATE] Rolled back ${migration.name}: ${result}`);
  } catch (err) {
    console.error(`[MIGRATE] Rollback failed ${migration.name}:`, err.message);
    process.exit(4);
  }
}

async function showStatus(allMigrations) {
  const applied = await getApplied();
  const appliedNames = new Set(applied.map(m => m.name));
  console.log('=== Migration Status ===');
  console.log('Applied:');
  applied.forEach(m => console.log(`  ✔ ${m.name} (${m.file}) @ ${m.appliedAt.toISOString()}`));
  console.log('Pending:');
  allMigrations.filter(m => !appliedNames.has(m.name))
    .forEach(m => console.log(`  ✖ ${m.name} (${m.file})`));
}

async function main() {
  const args = process.argv.slice(2);
  const doRollback = args.includes('--rollback');
  const doStatus = args.includes('--status');

  await connect();

  // Load models so migrations can access them
  require(path.join(__dirname, '..', 'models', 'User'));
  require(path.join(__dirname, '..', 'models', 'House'));
  require(path.join(__dirname, '..', 'models', 'Car'));
  require(path.join(__dirname, '..', 'models', 'Plot'));
  require(path.join(__dirname, '..', 'models', 'Job'));

  const files = loadMigrationFiles();
  const migrations = instantiateMigrations(files);

  if (doStatus) {
    await showStatus(migrations);
  } else if (doRollback) {
    await runRollback(migrations);
  } else {
    await runUp(migrations);
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('[MIGRATE] Fatal error:', err);
  process.exit(99);
});
