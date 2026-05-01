/**
 * Migration: 20251114_002_create_admin_user
 * Purpose: Provision an initial admin account if not present.
 * Email: admin@buyandsell250.com
 * Password: admin2025
 * Role: admin
 *
 * Up behavior:
 *   - If user with given email does not exist, create it and mark adminCreatedByMigration=true
 *   - If it exists but role != admin, upgrade role to admin (do NOT overwrite password)
 *   - If it exists and role=admin, leave unchanged
 *
 * Down behavior:
 *   - Remove the admin user ONLY if adminCreatedByMigration=true
 *   - If user existed prior (no marker), keep it and just downgrade role? (We choose KEEP to avoid unintended privilege changes.)
 */
module.exports = {
  name: '20251114_002_create_admin_user',
  up: async (mongoose) => {
    const User = mongoose.model('User');
    const email = 'admin@buyandsell250.com';
    const existing = await User.findOne({ email }).select('+password');
    if (!existing) {
      await User.create({
        firstName: 'Platform',
        lastName: 'Administrator',
        email,
        // Valid Rwandan mobile number (MTN example): 250788000000
        phone: '250788000000',
        password: 'admin2025', // Will be hashed by pre-save hook
        role: 'admin',
        adminCreatedByMigration: true,
        isVerified: true
      });
      return 'Admin user created';
    }
    if (existing.role !== 'admin') {
      existing.role = 'admin';
      await existing.save();
      return 'Existing user elevated to admin';
    }
    return 'Admin user already present';
  },
  down: async (mongoose) => {
    const User = mongoose.model('User');
    const email = 'admin@buyandsell250.com';
    const existing = await User.findOne({ email });
    if (!existing) return 'No admin user to remove';
    if (existing.adminCreatedByMigration) {
      await User.deleteOne({ _id: existing._id });
      return 'Migration-created admin user removed';
    }
    return 'Admin user retained (pre-existing)';
  }
};
