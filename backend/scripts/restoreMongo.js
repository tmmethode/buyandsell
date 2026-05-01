const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { EJSON } = require('bson');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const rootDir = path.join(__dirname, '..', '..');
const backupsRoot = path.join(rootDir, 'backups', 'mongodb');

function resolveBackupDir(inputPath) {
  if (inputPath) {
    return path.isAbsolute(inputPath) ? inputPath : path.join(rootDir, inputPath);
  }

  if (!fs.existsSync(backupsRoot)) {
    throw new Error('No backups directory found. Run the backup script first.');
  }

  const candidates = fs
    .readdirSync(backupsRoot)
    .map((name) => path.join(backupsRoot, name))
    .filter((fullPath) => fs.statSync(fullPath).isDirectory())
    .sort();

  if (!candidates.length) {
    throw new Error('No MongoDB backup folders found.');
  }

  return candidates[candidates.length - 1];
}

async function restoreCollection(db, collectionName, docs) {
  const collection = db.collection(collectionName);

  if (!docs.length) {
    console.log(`[restore] skipped ${collectionName} (0 docs)`);
    return;
  }

  const operations = docs.map((doc) => ({
    replaceOne: {
      filter: { _id: doc._id },
      replacement: doc,
      upsert: true,
    },
  }));

  const chunkSize = 500;

  for (let index = 0; index < operations.length; index += chunkSize) {
    const chunk = operations.slice(index, index + chunkSize);
    await collection.bulkWrite(chunk, { ordered: false });
  }

  console.log(`[restore] restored ${collectionName} (${docs.length} docs)`);
}

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set in backend/.env');
  }

  const inputArg = process.argv[2];
  const backupDir = resolveBackupDir(inputArg);

  if (!fs.existsSync(backupDir)) {
    throw new Error(`Backup folder not found: ${backupDir}`);
  }

  const files = fs
    .readdirSync(backupDir)
    .filter((fileName) => fileName.endsWith('.json') && fileName !== 'metadata.json')
    .sort();

  if (!files.length) {
    throw new Error(`No collection JSON files found in ${backupDir}`);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  for (const fileName of files) {
    const collectionName = path.basename(fileName, '.json');
    const raw = fs.readFileSync(path.join(backupDir, fileName), 'utf8');
    const docs = EJSON.parse(raw);

    if (!Array.isArray(docs)) {
      throw new Error(`Backup file is not a JSON array: ${fileName}`);
    }

    await restoreCollection(db, collectionName, docs);
  }

  await mongoose.disconnect();

  console.log(`[restore] completed from ${path.relative(rootDir, backupDir)}`);
}

main().catch(async (error) => {
  console.error('[restore] failed:', error.message);

  try {
    await mongoose.disconnect();
  } catch (disconnectError) {
    // Ignore disconnect errors after a failed restore attempt.
  }

  process.exit(1);
});
