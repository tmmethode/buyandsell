const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { EJSON } = require('bson');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const rootDir = path.join(__dirname, '..', '..');
const backupsRoot = path.join(rootDir, 'backups', 'mongodb');

function getTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function exportCollection(db, collectionName, outputDir) {
  const docs = await db.collection(collectionName).find({}).toArray();
  const targetPath = path.join(outputDir, `${collectionName}.json`);

  fs.writeFileSync(targetPath, EJSON.stringify(docs, null, 2, { relaxed: false }));

  return {
    name: collectionName,
    count: docs.length,
    file: `${collectionName}.json`,
  };
}

async function main() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set in backend/.env');
  }

  fs.mkdirSync(backupsRoot, { recursive: true });

  const timestamp = getTimestamp();
  const outputDir = path.join(backupsRoot, timestamp);
  fs.mkdirSync(outputDir, { recursive: true });

  await mongoose.connect(process.env.MONGODB_URI);

  const db = mongoose.connection.db;
  const collections = await db.listCollections({}, { nameOnly: true }).toArray();
  const collectionNames = collections
    .map((collection) => collection.name)
    .filter((name) => !name.startsWith('system.'));

  const summary = [];

  for (const collectionName of collectionNames) {
    const details = await exportCollection(db, collectionName, outputDir);
    summary.push(details);
    console.log(`[backup] exported ${collectionName} (${details.count} docs)`);
  }

  const metadata = {
    createdAt: new Date().toISOString(),
    database: db.databaseName,
    collectionCount: summary.length,
    collections: summary,
  };

  fs.writeFileSync(
    path.join(outputDir, 'metadata.json'),
    JSON.stringify(metadata, null, 2)
  );

  await mongoose.disconnect();

  console.log(`[backup] completed: ${path.relative(rootDir, outputDir)}`);
}

main().catch(async (error) => {
  console.error('[backup] failed:', error.message);

  try {
    await mongoose.disconnect();
  } catch (disconnectError) {
    // Ignore disconnect errors after a failed backup attempt.
  }

  process.exit(1);
});
