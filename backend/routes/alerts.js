const express = require('express');
const prisma = require('../lib/prisma');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all low stock alerts
router.get('/', authenticateToken, requireRole(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const alerts = await prisma.lowStockAlert.findMany({
      where: { status: 'ACTIVE' },
      include: {
        item: {
          include: {
            category: true
          }
        },
        acknowledger: {
          select: { id: true, fullName: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ data: alerts });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Acknowledge alert
router.put('/:id/acknowledge', authenticateToken, requireRole(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const { id } = req.params;

    const alert = await prisma.lowStockAlert.update({
      where: { id },
      data: {
        status: 'ACKNOWLEDGED',
        acknowledgedBy: req.user.id,
        acknowledgedAt: new Date()
      },
      include: {
        item: {
          include: {
            category: true
          }
        },
        acknowledger: {
          select: { id: true, fullName: true, email: true }
        }
      }
    });

    res.json({
      message: 'Alert acknowledged successfully',
      data: alert
    });
  } catch (error) {
    console.error('Acknowledge alert error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Alert not found' });
    }
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
});

module.exports = router;