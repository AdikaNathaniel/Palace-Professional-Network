// One-off import of the real church membership biodata (from
// Database/members_import.json, already cleaned/remapped by
// Database/extract_members.py) into the live biodatas collection.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const biodataSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    ageRange: { type: String, required: true },
    gender: { type: String, required: true },
    maritalStatus: { type: String, required: true },
    email: { type: String, trim: true },
    phoneNumber: { type: String, required: true },
    professionCategory: { type: String, required: true },
    professionSubCategory: { type: String },
    placeOfWork: { type: String, required: true },
    imageUrl: { type: String },
  },
  { timestamps: true },
);
const Biodata = mongoose.model('Biodata', biodataSchema);

async function main() {
  const jsonPath = path.join(__dirname, '..', '..', 'Database', 'members_import.json');
  const members = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  console.log(`Loaded ${members.length} members from ${jsonPath}`);

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB.');

  const docs = members.map((m) => ({
    ...m,
    email: m.email || undefined,
    professionSubCategory: m.professionSubCategory || undefined,
  }));

  const result = await Biodata.insertMany(docs, { ordered: false });
  console.log(`Inserted ${result.length} biodata records.`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});
