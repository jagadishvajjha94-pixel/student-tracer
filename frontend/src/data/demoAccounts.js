/** Matches backend/src/seed/seedData.js — password for all: demo123 */
export const DEMO_PASSWORD = 'demo123';

export const DEMO_ACCOUNTS = {
  admin: { email: 'admin@tracker.local', label: 'Admin' },
  interviewers: [
    { email: 'sarah@tracker.local', label: 'Sarah (Technical)' },
    { email: 'james@tracker.local', label: 'James (Communication)' },
    { email: 'maria@tracker.local', label: 'Maria (Full-stack)' },
  ],
  students: [
    { roll: 'CS2024001', label: 'Alex Kumar' },
    { roll: 'CS2024002', label: 'Priya Sharma' },
    { roll: 'CS2024015', label: 'Rahul Verma' },
    { roll: 'CS2024022', label: 'Sneha Patel' },
    { roll: 'CS2024030', label: 'Jordan Lee' },
  ],
};
