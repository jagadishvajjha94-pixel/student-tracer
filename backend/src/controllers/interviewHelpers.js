const mongoose = require('mongoose');
const User = require('../models/User');

function parseNumber(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

function scoreToLevel(score) {
  if (score >= 8.5) return 'Excellent';
  if (score >= 7) return 'Good';
  if (score >= 5) return 'Average';
  return 'Need Improvement';
}

function normalizeInterview(interview) {
  const row = { ...interview };
  const technicalScore = row.technicalScore != null
    ? Number(row.technicalScore)
    : row.interviewType === 'Technical'
      ? Number(row.score || 0)
      : 0;
  const communicationScore = row.communicationScore != null
    ? Number(row.communicationScore)
    : row.interviewType === 'Communication'
      ? Number(row.score || 0)
      : 0;
  const fallbackOverall = (technicalScore + communicationScore) / 2;
  const overallScore = row.overallScore != null
    ? Number(row.overallScore)
    : row.score != null
      ? Number(row.score)
      : fallbackOverall;
  const roundedOverall = Math.round(overallScore * 100) / 100;

  return {
    ...row,
    technicalScore: Math.round(technicalScore * 100) / 100,
    communicationScore: Math.round(communicationScore * 100) / 100,
    overallScore: roundedOverall,
    score: roundedOverall,
    level: row.level || scoreToLevel(roundedOverall),
    remarks: row.remarks || '',
    status: row.status || 'Completed',
    placementStatus: row.placementStatus || row.studentId?.placementStatus || 'Unplaced',
    batch: row.batch || row.studentId?.batch || '',
    group: row.group || row.studentId?.group || '',
  };
}

function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page || '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

async function resolveRollNumbersFromStudentFilters(query) {
  const userFilter = { role: 'student' };
  let hasStudentFilter = false;

  if (query.batch) {
    hasStudentFilter = true;
    userFilter.batch = query.batch;
  }
  if (query.group) {
    hasStudentFilter = true;
    userFilter.group = query.group;
  }
  if (query.placementStatus && ['Placed', 'Unplaced'].includes(query.placementStatus)) {
    hasStudentFilter = true;
    userFilter.placementStatus = query.placementStatus;
  }
  if (query.technicalSkill) {
    hasStudentFilter = true;
    userFilter.skills = { $elemMatch: { $regex: String(query.technicalSkill).trim(), $options: 'i' } };
  }

  if (!hasStudentFilter) return null;

  const users = await User.find(userFilter).select('rollNumber').lean();
  const rollNumbers = users.map((u) => u.rollNumber).filter(Boolean);
  return rollNumbers;
}

async function buildFilterQuery(query, options = {}) {
  const filter = {};
  if (query.interviewType && ['Technical', 'Communication', 'Combined'].includes(query.interviewType)) {
    filter.interviewType = query.interviewType;
  }
  if (query.interviewerId && mongoose.Types.ObjectId.isValid(query.interviewerId)) {
    filter.interviewerId = query.interviewerId;
  }
  if (query.status && ['Completed', 'Pending', 'Needs Follow-up'].includes(query.status)) {
    filter.status = query.status;
  }

  const minScore = parseNumber(query.minScore);
  const maxScore = parseNumber(query.maxScore);
  if (minScore != null) {
    filter.overallScore = { ...filter.overallScore, $gte: minScore };
  }
  if (maxScore != null) {
    filter.overallScore = { ...filter.overallScore, $lte: maxScore };
  }

  const minTech = parseNumber(query.minTechnicalScore);
  const maxTech = parseNumber(query.maxTechnicalScore);
  if (minTech != null) {
    filter.technicalScore = { ...filter.technicalScore, $gte: minTech };
  }
  if (maxTech != null) {
    filter.technicalScore = { ...filter.technicalScore, $lte: maxTech };
  }

  if (query.q) {
    const rx = new RegExp(String(query.q).trim(), 'i');
    filter.$or = [{ studentName: rx }, { rollNumber: rx }];
  }

  const rollNumbers = await resolveRollNumbersFromStudentFilters(query);
  if (rollNumbers) {
    filter.rollNumber = { ...(filter.rollNumber || {}), $in: rollNumbers };
  }
  if (options.interviewerOnlyId) {
    filter.interviewerId = options.interviewerOnlyId;
  }

  return filter;
}

module.exports = {
  buildFilterQuery,
  normalizeInterview,
  parsePagination,
  scoreToLevel,
};
