/**
 * Migration: 20251114_001_initial_indexes
 * Purpose: Ensure text indexes defined in schemas are created and add any missing future-proof indexes.
 * Strategy: Uses mongoose models to trigger index build, plus can add explicit indexes if needed.
 * Rollback: Drops the added explicit indexes only (text indexes remain as part of schema). Adjust as needed.
 */

module.exports = {
  name: '20251114_001_initial_indexes',
  up: async (mongoose) => {
    const { User, House, Car, Plot, Job } = getModels(mongoose);

    // Ensure schema-defined indexes exist
    await Promise.all([
      House.syncIndexes(),
      Car.syncIndexes(),
      Plot.syncIndexes(),
      Job.syncIndexes(),
      User.syncIndexes()
    ]);

    // Example explicit index (if later needed) commented out:
    // await User.collection.createIndex({ email: 1 }, { unique: true }); // already in schema as unique

    return 'Schema indexes synchronized';
  },
  down: async (mongoose) => {
    const { /* User, */ /* House, Car, Plot, Job */ } = getModels(mongoose);
    // Rollback strategy minimal: we don't drop schema indexes here because they are defined at the schema level.
    // If you add explicit indexes in up(), explicitly drop them here using collection.dropIndex(name).
    return 'No explicit indexes to drop';
  }
};

function getModels(mongoose) {
  // Access already registered models; assume server has required model files before running migrations.
  return {
    User: mongoose.model('User'),
    House: mongoose.model('House'),
    Car: mongoose.model('Car'),
    Plot: mongoose.model('Plot'),
    Job: mongoose.model('Job')
  };
}
