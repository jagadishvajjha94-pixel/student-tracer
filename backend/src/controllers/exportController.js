const PDFDocument = require('pdfkit');
const XLSX = require('xlsx');
const Interview = require('../models/Interview');
const { buildFilterQuery, normalizeInterview } = require('./interviewHelpers');

function writeInterviewPdf(doc, interviews, title) {
  doc.fontSize(18).text(title, { underline: true });
  doc.moveDown();
  doc.fontSize(10).text(`Generated: ${new Date().toISOString()}`, { align: 'right' });
  doc.moveDown();

  if (interviews.length === 0) {
    doc.fontSize(12).text('No records match the current filters.');
    doc.end();
    return;
  }

  interviews.forEach((raw, idx) => {
    const i = normalizeInterview(raw);
    if (idx > 0) doc.addPage();
    doc.fontSize(12).text(`Record ${idx + 1}`, { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    doc.text(`Student: ${i.studentName}`);
    doc.text(`Roll Number: ${i.rollNumber}`);
    doc.text(`Batch / Group: ${i.batch || '-'} / ${i.group || '-'}`);
    doc.text(`Placement Status: ${i.placementStatus || '-'}`);
    doc.text(`Resume: ${i.resumeLink}`);
    doc.text(`Interview Type: ${i.interviewType}`);
    doc.text(`Technical Score (0-10): ${i.technicalScore}`);
    doc.text(`Communication Score (0-10): ${i.communicationScore}`);
    doc.text(`Overall Score (0-10): ${i.overallScore}`);
    doc.text(`Level: ${i.level}`);
    doc.text(`Status: ${i.status || 'Completed'}`);
    doc.text(`Feedback: ${i.remarks || '-'}`);
    doc.text(
      `Interviewer: ${i.interviewerId ? i.interviewerId.name : '-'} (${i.interviewerId ? i.interviewerId.email : ''})`
    );
    doc.text(`Date: ${new Date(i.createdAt).toLocaleString()}`);
  });

  doc.end();
}

async function exportExcel(req, res) {
  try {
    const filter = await buildFilterQuery(req.query);
    const interviews = await Interview.find(filter)
      .populate('interviewerId', 'name email')
      .populate('studentId', 'name rollNumber batch group skills contactNumber placementStatus')
      .sort({ createdAt: -1 })
      .lean();

    const rows = interviews.map((raw) => {
      const i = normalizeInterview(raw);
      return {
      studentName: i.studentName,
      rollNumber: i.rollNumber,
      batch: i.batch,
      group: i.group,
      placementStatus: i.placementStatus,
      resumeLink: i.resumeLink,
      interviewType: i.interviewType,
      technicalScore: i.technicalScore,
      communicationScore: i.communicationScore,
      overallScore: i.overallScore,
      level: i.level,
      status: i.status,
      feedback: i.remarks,
      interviewer: i.interviewerId ? i.interviewerId.name : '',
      interviewerEmail: i.interviewerId ? i.interviewerId.email : '',
      createdAt: i.createdAt,
      };
    });

    const sheet = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, 'Interviews');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader(
      'Content-Disposition',
      'attachment; filename="interviews-report.xlsx"'
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    return res.send(buffer);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Export failed' });
  }
}

async function exportPdf(req, res) {
  try {
    const filter = await buildFilterQuery(req.query);
    const interviews = await Interview.find(filter)
      .populate('interviewerId', 'name email')
      .populate('studentId', 'name rollNumber batch group skills contactNumber placementStatus')
      .sort({ createdAt: -1 })
      .lean();

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Disposition', 'attachment; filename="interviews-report.pdf"');
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);
    writeInterviewPdf(doc, interviews, 'Interview Report');
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      return res.status(500).json({ message: 'Export failed' });
    }
  }
}

async function exportStudentReportsPdf(req, res) {
  try {
    const interviews = await Interview.find({ rollNumber: req.user.rollNumber })
      .populate('interviewerId', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Disposition', 'attachment; filename="my-interview-reports.pdf"');
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);
    writeInterviewPdf(doc, interviews, `${req.user.name}'s Interview Reports`);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Could not export student reports' });
  }
}

async function exportStudentSingleReportPdf(req, res) {
  try {
    const interview = await Interview.findById(req.params.id)
      .populate('interviewerId', 'name email')
      .lean();
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }
    if (interview.rollNumber !== req.user.rollNumber) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    res.setHeader('Content-Disposition', 'attachment; filename="my-interview-report.pdf"');
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);
    writeInterviewPdf(doc, [interview], 'Interview Report');
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Could not export interview report' });
  }
}

module.exports = {
  exportExcel,
  exportPdf,
  exportStudentReportsPdf,
  exportStudentSingleReportPdf,
};
