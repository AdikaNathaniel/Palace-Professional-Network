// One-off backfill: give every Biodata phone number that has no matching
// AuthUser record a login account with the default PIN 1111 (bcrypt-hashed,
// same 10 salt rounds as auth.service.ts), so members imported in bulk from
// the Excel sheet (who never went through /auth/register) can log in.
// Anyone who already has an AuthUser (self-registered, or already backfilled)
// is left untouched - this never overwrites an existing PIN.
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const DEFAULT_PIN = '1111';

const biodataSchema = new mongoose.Schema(
  { fullName: String, phoneNumber: String },
  { timestamps: true },
);
const Biodata = mongoose.model('Biodata', biodataSchema);

const authUserSchema = new mongoose.Schema(
  {
    phoneNumber: { type: String, required: true, unique: true, trim: true },
    pinHash: { type: String, required: true },
    fullName: { type: String, trim: true },
  },
  { timestamps: true },
);
const AuthUser = mongoose.model('AuthUser', authUserSchema);

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB.');

  const members = await Biodata.find({}, { phoneNumber: 1, fullName: 1 }).lean();
  console.log(`Found ${members.length} biodata records.`);

  const seenPhones = new Set();
  const pinHash = await bcrypt.hash(DEFAULT_PIN, 10);

  let created = 0;
  let skippedExisting = 0;
  let skippedDuplicate = 0;

  for (const member of members) {
    const phoneNumber = member.phoneNumber;
    if (!phoneNumber) continue;

    if (seenPhones.has(phoneNumber)) {
      skippedDuplicate++;
      continue;
    }
    seenPhones.add(phoneNumber);

    const existing = await AuthUser.findOne({ phoneNumber });
    if (existing) {
      skippedExisting++;
      continue;
    }

    await AuthUser.create({
      phoneNumber,
      pinHash,
      fullName: member.fullName,
    });
    created++;
  }

  console.log(`Created ${created} new login accounts with default PIN ${DEFAULT_PIN}.`);
  console.log(`Skipped ${skippedExisting} phone numbers that already had a login account.`);
  console.log(`Skipped ${skippedDuplicate} duplicate phone numbers within Biodata.`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
