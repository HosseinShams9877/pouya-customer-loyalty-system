/**
 * Auth Middleware — JWT verification with user lookup
 * 
 * Import prisma from ../lib/prisma (singleton)
 */
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

/**
 * requireAuth — Verify JWT access token from Authorization header.
 * Checks user exists and status=ACTIVE.
 * Attaches req.user = { id, email, role, status, firstName, lastName }
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'توکن احراز هویت ارسال نشده است',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.tokenUse !== 'staff_access') {
      return res.status(401).json({ success: false, message: 'نوع توکن نامعتبر است' });
    }
    const userId = decoded.id || decoded.sub || decoded.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'توکن نامعتبر است',
      });
    }

    prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          firstName: true,
          lastName: true,
        },
      }).then((user) => {
        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'کاربر یافت نشد',
          });
        }

        if (user.status !== 'ACTIVE') {
          return res.status(403).json({
            success: false,
            message: 'حساب کاربری غیرفعال شده است',
          });
        }

        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          status: user.status,
          firstName: user.firstName,
          lastName: user.lastName,
        };
        next();
      })
      .catch((err) => {
        console.error('[auth middleware] DB error:', err.message);
        return res.status(500).json({
          success: false,
          message: 'خطا در بررسی احراز هویت',
        });
      });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'توکن منقضی شده — لطفاً دوباره وارد شوید',
        code: 'TOKEN_EXPIRED',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'توکن نامعتبر است',
    });
  }
}

/**
 * requireRole — Wrapper that checks req.user.role is in the allowed list.
 * Must be used AFTER requireAuth.
 * @param  {...string} roles
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'ابتدا وارد شوید',
      });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'شما دسترسی به این بخش ندارید',
      });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
