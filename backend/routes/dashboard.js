const express = require('express');
const prisma = require('../lib/prisma');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get dashboard statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Get basic counts
    const [
      totalItems,
      totalUsers,
      activeTransactions,
      lowStockAlerts,
      maintenanceDue
    ] = await Promise.all([
      prisma.inventoryItem.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.transaction.count({ where: { status: 'ACTIVE' } }),
      prisma.lowStockAlert.count({ where: { status: 'ACTIVE' } }),
      prisma.maintenanceSchedule.count({ 
        where: { 
          status: 'SCHEDULED',
          scheduledDate: { lte: new Date() }
        } 
      })
    ]);

    // Calculate total inventory value
    const inventoryValue = await prisma.inventoryItem.aggregate({
      _sum: {
        unitPrice: true
      },
      where: {
        unitPrice: { not: null }
      }
    });

    // Get recent transactions
    const recentTransactions = await prisma.transaction.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        item: {
          select: { name: true }
        },
        user: {
          select: { fullName: true }
        }
      }
    });

    // Get category distribution
    const categoryStats = await prisma.category.findMany({
      include: {
        _count: {
          select: { items: true }
        }
      }
    });

    // Get low stock items
    const lowStockItems = await prisma.inventoryItem.findMany({
      where: {
        OR: [
          { quantity: { lte: prisma.inventoryItem.fields.minQuantity } }
        ]
      },
      include: {
        category: true
      },
      take: 10
    });

    res.json({
      stats: {
        totalItems,
        totalUsers,
        activeTransactions,
        lowStockAlerts,
        maintenanceDue,
        totalValue: inventoryValue._sum.unitPrice || 0
      },
      recentTransactions,
      categoryStats,
      lowStockItems
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

module.exports = router;