/**
 * Project Routes
 * 
 * - GET    /          — list projects with pagination
 * - GET    /:id       — get single project
 * - POST   /          — create project (ADMIN only)
 * - PATCH  /:id       — update project
 * - DELETE /:id       — delete project (ADMIN only)
 */

const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { parseBigIntFields } = require('../lib/bigint');
const { requireAuth, requireRole } = require('../middleware/auth');

// All routes require auth
router.use(requireAuth);

// ════════════════════════════════════════════
// GET / — List projects with pagination
// ════════════════════════════════════════════
router.get('/', async (req, res) => {
  try {
    const { page = '1', pageSize = '20', status, search } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const sizeNum = Math.max(1, Math.min(100, parseInt(pageSize, 10) || 20));
    const skip = (pageNum - 1) * sizeNum;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (search && search.trim()) {
      where.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { city: { contains: search.trim(), mode: 'insensitive' } },
        { executor: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          creator: {
            select: { id: true, firstName: true, lastName: true },
          },
          _count: {
            select: { leads: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: sizeNum,
      }),
      prisma.project.count({ where }),
    ]);

    res.json({
      success: true,
      data: projects,
      pagination: {
        page: pageNum,
        pageSize: sizeNum,
        total,
        totalPages: Math.ceil(total / sizeNum),
      },
    });
  } catch (err) {
    console.error('[projects/list] خطا:', err);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

// ════════════════════════════════════════════
// GET /:id — Get single project
// ════════════════════════════════════════════
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, firstName: true, lastName: true },
        },
        leads: {
          select: {
            id: true,
            fullName: true,
            mobile: true,
            stage: true,
            estimatedValue: true,
          },
        },
        _count: {
          select: { leads: true },
        },
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'پروژه یافت نشد',
      });
    }

    res.json({ success: true, data: project });
  } catch (err) {
    console.error('[projects/get] خطا:', err);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

// ════════════════════════════════════════════
// POST / — Create project (ADMIN only)
// ════════════════════════════════════════════
router.post('/', requireRole('ADMIN'), async (req, res) => {
  try {
    const { title, city, area, status, executor, budget } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'عنوان پروژه الزامی است',
      });
    }

    const parsed = parseBigIntFields({ budget }, ['budget']);

    const project = await prisma.project.create({
      data: {
        title,
        city: city || null,
        area: area !== undefined ? parseInt(area, 10) : null,
        status: status || 'PLANNING',
        executor: executor || null,
        budget: parsed.budget || BigInt(0),
        createdBy: req.user.id,
      },
      include: {
        creator: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    res.status(201).json({ success: true, data: project });
  } catch (err) {
    console.error('[projects/create] خطا:', err);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

// ════════════════════════════════════════════
// PATCH /:id — Update project
// ════════════════════════════════════════════
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, city, area, status, executor, budget } = req.body;

    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'پروژه یافت نشد',
      });
    }

    const data = {};
    if (title !== undefined) data.title = title;
    if (city !== undefined) data.city = city;
    if (area !== undefined) data.area = area !== null ? parseInt(area, 10) : null;
    if (status !== undefined) data.status = status;
    if (executor !== undefined) data.executor = executor;

    if (budget !== undefined) {
      const parsed = parseBigIntFields({ budget }, ['budget']);
      data.budget = parsed.budget;
    }

    const project = await prisma.project.update({
      where: { id },
      data,
      include: {
        creator: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    res.json({ success: true, data: project });
  } catch (err) {
    console.error('[projects/update] خطا:', err);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

// ════════════════════════════════════════════
// DELETE /:id — Delete project (ADMIN only)
// ════════════════════════════════════════════
router.delete('/:id', requireRole('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'پروژه یافت نشد',
      });
    }

    await prisma.project.delete({ where: { id } });

    res.json({
      success: true,
      message: 'پروژه حذف شد',
    });
  } catch (err) {
    console.error('[projects/delete] خطا:', err);
    res.status(500).json({ success: false, message: 'خطای سرور' });
  }
});

module.exports = router;
