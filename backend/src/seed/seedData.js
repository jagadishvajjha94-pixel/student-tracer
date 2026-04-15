const User = require('../models/User');
const Interview = require('../models/Interview');

/**
 * Clears users & interviews and inserts demo data. Caller must have mongoose connected.
 */
async function seedDemoData() {
  await Interview.deleteMany({});
  await User.deleteMany({});

  const admin = await User.create({
    name: 'System Admin',
    email: 'admin@tracker.local',
    password: 'demo123',
    role: 'admin',
  });

  const iv1 = await User.create({
    name: 'Dr. Sarah Chen',
    email: 'sarah@tracker.local',
    password: 'demo123',
    role: 'interviewer',
    expertise: 'Algorithms, System Design',
  });

  const iv2 = await User.create({
    name: 'James Wilson',
    email: 'james@tracker.local',
    password: 'demo123',
    role: 'interviewer',
    expertise: 'Communication, Leadership',
  });

  const iv3 = await User.create({
    name: 'Maria Rodriguez',
    email: 'maria@tracker.local',
    password: 'demo123',
    role: 'interviewer',
    expertise: 'Full-stack, Databases',
  });

  await User.create({
    name: 'Alex Kumar',
    email: 'alex@student.local',
    password: 'demo123',
    role: 'student',
    rollNumber: 'CS2024001',
  });

  await User.create({
    name: 'Priya Sharma',
    password: 'demo123',
    role: 'student',
    rollNumber: 'CS2024002',
  });

  await User.create({
    name: 'Rahul Verma',
    email: 'rahul@student.local',
    password: 'demo123',
    role: 'student',
    rollNumber: 'CS2024015',
  });

  await User.create({
    name: 'Sneha Patel',
    password: 'demo123',
    role: 'student',
    rollNumber: 'CS2024022',
  });

  await User.create({
    name: 'Jordan Lee',
    email: 'jordan@student.local',
    password: 'demo123',
    role: 'student',
    rollNumber: 'CS2024030',
  });

  const day = 86400000;
  const now = Date.now();

  const rows = [
    {
      studentName: 'Alex Kumar',
      rollNumber: 'CS2024001',
      resumeLink: 'https://drive.google.com/file/d/demo-alex/view',
      interviewType: 'Technical',
      score: 8.2,
      level: 'Good',
      remarks: 'Strong problem-solving; practice edge cases.',
      interviewerId: iv1._id,
      createdAt: new Date(now - 8 * day),
    },
    {
      studentName: 'Alex Kumar',
      rollNumber: 'CS2024001',
      resumeLink: 'https://drive.google.com/file/d/demo-alex/view',
      interviewType: 'Communication',
      score: 7.6,
      level: 'Average',
      remarks: 'Clear articulation; work on conciseness.',
      interviewerId: iv2._id,
      createdAt: new Date(now - 4 * day),
    },
    {
      studentName: 'Priya Sharma',
      rollNumber: 'CS2024002',
      resumeLink: 'https://example.com/resume/priya',
      interviewType: 'Technical',
      score: 9.4,
      level: 'Excellent',
      remarks: 'Outstanding; ready for senior rounds.',
      interviewerId: iv1._id,
      createdAt: new Date(now - 6 * day),
    },
    {
      studentName: 'Priya Sharma',
      rollNumber: 'CS2024002',
      resumeLink: 'https://example.com/resume/priya',
      interviewType: 'Communication',
      score: 8.8,
      level: 'Good',
      remarks: 'Confident and structured answers.',
      interviewerId: iv2._id,
      createdAt: new Date(now - 2 * day),
    },
    {
      studentName: 'Rahul Verma',
      rollNumber: 'CS2024015',
      resumeLink: 'https://drive.google.com/file/d/demo-rahul/view',
      interviewType: 'Technical',
      score: 6.5,
      level: 'Average',
      remarks: 'Good basics; needs depth on async patterns.',
      interviewerId: iv3._id,
      createdAt: new Date(now - 5 * day),
    },
    {
      studentName: 'Rahul Verma',
      rollNumber: 'CS2024015',
      resumeLink: 'https://drive.google.com/file/d/demo-rahul/view',
      interviewType: 'Communication',
      score: 7.0,
      level: 'Average',
      remarks: 'Improved structure since last mock.',
      interviewerId: iv2._id,
      createdAt: new Date(now - 1 * day),
    },
    {
      studentName: 'Sneha Patel',
      rollNumber: 'CS2024022',
      resumeLink: 'https://example.com/cv/sneha',
      interviewType: 'Technical',
      score: 5.2,
      level: 'Need Improvement',
      remarks: 'Review data structures and Big-O.',
      interviewerId: iv1._id,
      createdAt: new Date(now - 7 * day),
    },
    {
      studentName: 'Sneha Patel',
      rollNumber: 'CS2024022',
      resumeLink: 'https://example.com/cv/sneha',
      interviewType: 'Communication',
      score: 6.8,
      level: 'Average',
      remarks: 'Much clearer than technical round.',
      interviewerId: iv2._id,
      createdAt: new Date(now - 3 * day),
    },
    {
      studentName: 'Jordan Lee',
      rollNumber: 'CS2024030',
      resumeLink: 'https://drive.google.com/file/d/demo-jordan/view',
      interviewType: 'Technical',
      score: 9.0,
      level: 'Excellent',
      remarks: 'Solid system design and tradeoffs.',
      interviewerId: iv3._id,
      createdAt: new Date(now - 5 * day),
    },
    {
      studentName: 'Jordan Lee',
      rollNumber: 'CS2024030',
      resumeLink: 'https://drive.google.com/file/d/demo-jordan/view',
      interviewType: 'Communication',
      score: 8.5,
      level: 'Good',
      remarks: 'Great storytelling for projects.',
      interviewerId: iv1._id,
      createdAt: new Date(now - 2 * day),
    },
    {
      studentName: 'Alex Kumar',
      rollNumber: 'CS2024001',
      resumeLink: 'https://drive.google.com/file/d/demo-alex/view',
      interviewType: 'Technical',
      score: 8.8,
      level: 'Good',
      remarks: 'Follow-up: strong improvement on graphs.',
      interviewerId: iv3._id,
      createdAt: new Date(now - 1 * day),
    },
  ];

  await Interview.insertMany(rows);

  return { admin };
}

module.exports = { seedDemoData };
