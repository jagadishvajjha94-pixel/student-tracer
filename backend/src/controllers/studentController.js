const { validationResult } = require('express-validator');
const XLSX = require('xlsx');
const User = require('../models/User');

function normalizeHeader(header) {
  return String(header || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function readValue(row, aliases) {
  for (const alias of aliases) {
    if (row[alias] != null && String(row[alias]).trim() !== '') {
      return String(row[alias]).trim();
    }
  }
  return '';
}

function parseSkills(value) {
  if (!value) return [];
  return String(value)
    .split(/[;,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function normalizePlacementStatus(value) {
  const status = String(value || '').trim().toLowerCase();
  return status === 'placed' ? 'Placed' : 'Unplaced';
}

async function uploadStudents(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: 'Please upload a CSV or Excel file' });
  }

  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
    if (!rows.length) {
      return res.status(400).json({ message: 'The uploaded file is empty' });
    }

    let created = 0;
    let updated = 0;
    const errors = [];

    for (const [index, raw] of rows.entries()) {
      const row = {};
      Object.entries(raw).forEach(([key, value]) => {
        row[normalizeHeader(key)] = value;
      });

      const rollNumber = readValue(row, ['rollnumber', 'rollno', 'studentid', 'id']).toUpperCase();
      const name = readValue(row, ['name', 'studentname']);
      if (!rollNumber || !name) {
        errors.push(`Row ${index + 2}: roll number and name are required`);
        continue;
      }

      const payload = {
        name,
        role: 'student',
        rollNumber,
        email: readValue(row, ['email']) || undefined,
        batch: readValue(row, ['batch']),
        group: readValue(row, ['group', 'section']),
        contactNumber: readValue(row, ['contact', 'contactnumber', 'phone', 'mobile']),
        skills: parseSkills(readValue(row, ['skills', 'technicalskills'])),
        placementStatus: normalizePlacementStatus(readValue(row, ['placementstatus', 'placement'])),
      };

      const existing = await User.findOne({ role: 'student', rollNumber });
      if (existing) {
        await User.updateOne({ _id: existing._id }, { $set: payload });
        updated += 1;
      } else {
        await User.create({
          ...payload,
          password:
            readValue(row, ['password']) ||
            process.env.DEFAULT_STUDENT_PASSWORD ||
            'demo123',
        });
        created += 1;
      }
    }

    return res.json({
      message: 'Student upload processed',
      created,
      updated,
      skipped: errors.length,
      errors,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Could not process student file upload' });
  }
}

async function updatePlacementStatus(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'student' },
      { placementStatus: req.body.placementStatus },
      { new: true }
    ).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Student not found' });
    }
    return res.json({ student: user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Could not update placement status' });
  }
}

module.exports = {
  uploadStudents,
  updatePlacementStatus,
};
