const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Interview = require('../models/Interview');
const User = require('../models/User');
const { buildFilterQuery, normalizeInterview, parsePagination, scoreToLevel } = require('./interviewHelpers');
const { normalizeResumeUrl } = require('../middleware/validators');

async function createInterview(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    studentName,
    rollNumber,
    resumeLink,
    batch,
    group,
    interviewType,
    technicalScore,
    communicationScore,
    level,
    remarks,
    status,
  } = req.body;

  try {
    const roll = rollNumber.trim().toUpperCase();
    const student = await User.findOne({ role: 'student', rollNumber: roll }).lean();
    const resumeHref = normalizeResumeUrl(resumeLink);
    const technical = Number(technicalScore);
    const communication = Number(communicationScore);
    const overall = Math.round(((technical + communication) / 2) * 100) / 100;

    const interview = await Interview.create({
      studentName: studentName.trim(),
      rollNumber: roll,
      resumeLink: resumeHref || resumeLink.trim(),
      studentId: student?._id,
      batch: student?.batch || (batch ? String(batch).trim() : ''),
      group: student?.group || (group ? String(group).trim() : ''),
      placementStatus: student?.placementStatus || 'Unplaced',
      interviewType: interviewType || 'Combined',
      technicalScore: technical,
      communicationScore: communication,
      overallScore: overall,
      score: overall,
      level: level || scoreToLevel(overall),
      remarks: remarks != null ? String(remarks).trim() : '',
      status: status || 'Completed',
      interviewerId: req.user._id,
    });
    const populated = await Interview.findById(interview._id)
      .populate('interviewerId', 'name email expertise')
      .populate('studentId', 'name rollNumber batch group skills contactNumber placementStatus');
    return res.status(201).json({ interview: normalizeInterview(populated.toObject()) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Could not create interview' });
  }
}

async function listInterviewsAdmin(req, res) {
  try {
    const filter = await buildFilterQuery(req.query);
    const { page, limit, skip } = parsePagination(req.query);
    const total = await Interview.countDocuments(filter);
    const interviews = await Interview.find(filter)
      .populate('interviewerId', 'name email expertise')
      .populate('studentId', 'name rollNumber batch group skills contactNumber placementStatus')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    return res.json({
      interviews: interviews.map(normalizeInterview),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Could not load interviews' });
  }
}

async function getByStudentRoll(req, res) {
  const roll = req.params.rollNumber.trim().toUpperCase();
  if (req.user.role === 'student' && req.user.rollNumber !== roll) {
    return res.status(403).json({ message: 'You can only view your own records' });
  }
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const filter = { rollNumber: roll };
    const total = await Interview.countDocuments(filter);
    const interviews = await Interview.find(filter)
      .populate('interviewerId', 'name email expertise')
      .populate('studentId', 'name rollNumber batch group skills contactNumber placementStatus')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    return res.json({
      interviews: interviews.map(normalizeInterview),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Could not load interviews' });
  }
}

async function getByInterviewer(req, res) {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid interviewer id' });
  }
  if (req.user.role === 'interviewer' && req.user._id.toString() !== id) {
    return res.status(403).json({ message: 'You can only view your own submissions' });
  }
  try {
    const filter = await buildFilterQuery(req.query, { interviewerOnlyId: id });
    const { page, limit, skip } = parsePagination(req.query);
    const total = await Interview.countDocuments(filter);
    const interviews = await Interview.find(filter)
      .populate('interviewerId', 'name email expertise')
      .populate('studentId', 'name rollNumber batch group skills contactNumber placementStatus')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    return res.json({
      interviews: interviews.map(normalizeInterview),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Could not load interviews' });
  }
}

async function searchStudents(req, res) {
  const q = String(req.query.q || '').trim();
  if (q.length < 2) {
    return res.status(400).json({ message: 'Search query must be at least 2 characters' });
  }

  try {
    const rx = new RegExp(q, 'i');
    const users = await User.find({
      role: 'student',
      $or: [{ name: rx }, { rollNumber: rx }],
    })
      .select('name rollNumber batch group skills contactNumber placementStatus')
      .sort({ name: 1 })
      .limit(25)
      .lean();

    const studentSet = new Map(users.map((u) => [u.rollNumber, u]));
    const interviewMatches = await Interview.find({
      $or: [{ studentName: rx }, { rollNumber: rx }],
    })
      .select('rollNumber studentName')
      .limit(50)
      .lean();

    interviewMatches.forEach((row) => {
      if (!studentSet.has(row.rollNumber)) {
        studentSet.set(row.rollNumber, {
          name: row.studentName,
          rollNumber: row.rollNumber,
          batch: '',
          group: '',
          skills: [],
          contactNumber: '',
          placementStatus: 'Unplaced',
        });
      }
    });

    return res.json({ students: Array.from(studentSet.values()) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Could not search students' });
  }
}

module.exports = {
  createInterview,
  listInterviewsAdmin,
  getByStudentRoll,
  getByInterviewer,
  searchStudents,
};
