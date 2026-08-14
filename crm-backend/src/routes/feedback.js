const express = require('express');
const prisma = require('../lib/prisma');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

const TYPES = ['COMPLAINT', 'SUGGESTION', 'SURVEY', 'CALL_NOTE'];
const CHANNELS = ['PHONE', 'SMS', 'HEPIKAL', 'WEB', 'IN_PERSON'];

router.get('/', async (req, res) => {
  await prisma.customerFeedback.updateMany({ where: { dueAt: { lt: new Date() }, status: { in: ['OPEN', 'IN_PROGRESS'] }, slaBreached: false }, data: { slaBreached: true } });
  const where = {};
  if (req.query.type) where.type = req.query.type;
  if (req.query.status) where.status = req.query.status;
  if (req.query.customerId) where.customerId = req.query.customerId;
  const items = await prisma.customerFeedback.findMany({ where, include: { customer: { select: { id: true, fullName: true, mobile: true, company: true } } }, orderBy: { createdAt: 'desc' }, take: 250 });
  return res.json({ success: true, data: items });
});

router.get('/stats', async (_req, res) => {
  const [total, open, complaints, suggestions, breached, avg] = await Promise.all([
    prisma.customerFeedback.count(),
    prisma.customerFeedback.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
    prisma.customerFeedback.count({ where: { type: 'COMPLAINT' } }),
    prisma.customerFeedback.count({ where: { type: 'SUGGESTION' } }),
    prisma.customerFeedback.count({ where: { slaBreached: true, status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
    prisma.csatToken.aggregate({ where: { status: 'SUBMITTED' }, _avg: { score: true } }),
  ]);
  return res.json({ success: true, data: { total, open, complaints, suggestions, breached, csatAverage: avg._avg.score || 0 } });
});

router.post('/', async (req, res) => {
  const type = String(req.body.type || '').toUpperCase();
  const channel = String(req.body.channel || 'PHONE').toUpperCase();
  if (!TYPES.includes(type) || !CHANNELS.includes(channel) || !req.body.subject?.trim() || !req.body.description?.trim()) {
    return res.status(400).json({ success: false, message: 'نوع، کانال، عنوان و شرح بازخورد الزامی است' });
  }
  const priority = req.body.priority || 'NORMAL';
  const slaHours = { LOW: 72, NORMAL: 24, HIGH: 8, CRITICAL: 2 }[priority] || 24;
  const data = await prisma.customerFeedback.create({
    data: { customerId: req.body.customerId || null, leadId: req.body.leadId || null, type, channel, subject: String(req.body.subject).trim(), description: String(req.body.description).trim(), score: req.body.score == null ? null : Number(req.body.score), priority, assignedToId: req.body.assignedToId || req.user.id, dueAt: new Date(Date.now() + slaHours * 3600000) },
    include: { customer: true },
  });
  return res.status(201).json({ success: true, message: 'بازخورد مشتری ثبت شد', data });
});

router.patch('/:id', async (req, res) => {
  const allowed = ['status', 'priority', 'assignedToId', 'resolution', 'firstResponseAt'];
  const data = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
  if (data.status === 'IN_PROGRESS' && !data.firstResponseAt) data.firstResponseAt = new Date();
  if (['RESOLVED', 'CLOSED'].includes(data.status)) data.resolvedAt = new Date();
  const item = await prisma.customerFeedback.update({ where: { id: req.params.id }, data, include: { customer: true } });
  return res.json({ success: true, data: item });
});

module.exports = router;
