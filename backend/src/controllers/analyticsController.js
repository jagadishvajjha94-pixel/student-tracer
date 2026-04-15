const Interview = require('../models/Interview');
const User = require('../models/User');
const { buildFilterQuery } = require('./interviewHelpers');

async function dashboard(req, res) {
  try {
    const filter = await buildFilterQuery(req.query);
    const total = await Interview.countDocuments(filter);
    const avgAgg = await Interview.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          avgScore: { $avg: { $ifNull: ['$overallScore', '$score'] } },
        },
      },
    ]);
    const avgScore = avgAgg.length ? Math.round(avgAgg[0].avgScore * 100) / 100 : 0;

    const topAgg = await Interview.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$rollNumber',
          studentName: { $first: '$studentName' },
          bestScore: { $max: { $ifNull: ['$overallScore', '$score'] } },
        },
      },
      { $sort: { bestScore: -1 } },
      { $limit: 10 },
    ]);
    const topPerformers = topAgg.map((t) => ({
      rollNumber: t._id,
      studentName: t.studentName,
      bestScore: t.bestScore,
    }));

    const groupAgg = await Interview.aggregate([
      { $match: filter },
      {
        $addFields: {
          groupName: {
            $cond: [
              {
                $or: [{ $eq: ['$group', null] }, { $eq: ['$group', ''] }],
              },
              'Unassigned',
              '$group',
            ],
          },
          scoreValue: { $ifNull: ['$overallScore', '$score'] },
        },
      },
      {
        $group: {
          _id: '$groupName',
          topScore: { $max: '$scoreValue' },
          averageScore: { $avg: '$scoreValue' },
          students: { $addToSet: '$rollNumber' },
        },
      },
      { $sort: { topScore: -1, averageScore: -1 } },
      { $limit: 12 },
    ]);
    const groupTopPerformance = groupAgg.map((g) => ({
      group: g._id,
      topScore: Math.round(g.topScore * 100) / 100,
      averageScore: Math.round(g.averageScore * 100) / 100,
      studentsCount: g.students.length,
    }));

    const studentFilter = { role: 'student' };
    if (req.query.batch) studentFilter.batch = req.query.batch;
    if (req.query.group) studentFilter.group = req.query.group;
    const students = await User.find(studentFilter).select('rollNumber placementStatus').lean();
    const totalStudents = students.length;
    const placedCount = students.filter((s) => s.placementStatus === 'Placed').length;
    const unplacedCount = students.length - placedCount;

    const trend = await Interview.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          averageScore: { $avg: { $ifNull: ['$overallScore', '$score'] } },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 15 },
    ]);

    return res.json({
      totalInterviews: total,
      totalStudents,
      averageScore: avgScore,
      topPerformers,
      batchPerformance: {
        batch: req.query.batch || 'All batches',
        averageScore: avgScore,
        placedCount,
        unplacedCount,
        trend: trend.map((t) => ({
          date: t._id,
          averageScore: Math.round(t.averageScore * 100) / 100,
        })),
      },
      groupTopPerformance,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Could not load analytics' });
  }
}

async function leaderboard(req, res) {
  try {
    const filter = await buildFilterQuery(req.query);
    const agg = await Interview.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$rollNumber',
          studentName: { $first: '$studentName' },
          maxScore: { $max: { $ifNull: ['$overallScore', '$score'] } },
          avgScore: { $avg: { $ifNull: ['$overallScore', '$score'] } },
          count: { $sum: 1 },
        },
      },
      { $sort: { maxScore: -1, avgScore: -1 } },
      { $limit: 20 },
    ]);
    const rows = agg.map((r) => ({
      rollNumber: r._id,
      studentName: r.studentName,
      maxScore: Math.round(r.maxScore * 100) / 100,
      avgScore: Math.round(r.avgScore * 100) / 100,
      interviewsCount: r.count,
    }));
    return res.json({ leaderboard: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Could not load leaderboard' });
  }
}

module.exports = { dashboard, leaderboard };
