const express = require('express');
const prisma = require('../lib/prisma');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all transactions
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    
    const whereClause = req.user.role === 'MEDICAL_PERSONNEL' 
      ? { userId: req.user.id }
      : {};

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        item: {
          include: {
            category: true
          }
        },
        user: {
          select: { id: true, fullName: true, email: true, role: true, department: true }
        },
        approver: {
          select: { id: true, fullName: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    res.json({ data: transactions });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Create transaction
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { itemId, transactionType, quantity, dueDate, locationUsed, notes } = req.body;

    // Get item details
    const item = await prisma.inventoryItem.findUnique({
      where: { id: itemId }
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Check availability for checkout
    if (transactionType === 'CHECKOUT' && item.quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient quantity available' });
    }

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        itemId,
        userId: req.user.id,
        transactionType,
        quantity,
        dueDate: dueDate ? new Date(dueDate) : null,
        locationUsed,
        notes
      },
      include: {
        item: {
          include: {
            category: true
          }
        },
        user: {
          select: { id: true, fullName: true, email: true, role: true, department: true }
        }
      }
    });

    // Update inventory quantity
    if (transactionType === 'CHECKOUT') {
      await prisma.inventoryItem.update({
        where: { id: itemId },
        data: {
          quantity: {
            decrement: quantity
          }
        }
      });
    } else if (transactionType === 'CHECKIN') {
      await prisma.inventoryItem.update({
        where: { id: itemId },
        data: {
          quantity: {
            increment: quantity
          }
        }
      });
    }

    // Check for low stock after update
    const updatedItem = await prisma.inventoryItem.findUnique({
      where: { id: itemId }
    });
    await checkLowStock(updatedItem);

    res.status(201).json({
      message: 'Transaction created successfully',
      data: transaction
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// Update transaction
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, conditionOnReturn, notes, returnedDate } = req.body;

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: { item: true }
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Check permissions
    if (req.user.role === 'MEDICAL_PERSONNEL' && transaction.userId !== req.user.id) {
      return res.status(403).json({ error: 'Can only update your own transactions' });
    }

    const updateData = {
      status,
      conditionOnReturn,
      notes
    };

    if (status === 'COMPLETED' && !transaction.returnedDate) {
      updateData.returnedDate = returnedDate ? new Date(returnedDate) : new Date();
      
      // Return items to inventory if it's a checkin
      if (transaction.transactionType === 'CHECKOUT') {
        await prisma.inventoryItem.update({
          where: { id: transaction.itemId },
          data: {
            quantity: {
              increment: transaction.quantity
            }
          }
        });
      }
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { id },
      data: updateData,
      include: {
        item: {
          include: {
            category: true
          }
        },
        user: {
          select: { id: true, fullName: true, email: true, role: true, department: true }
        }
      }
    });

    res.json({
      message: 'Transaction updated successfully',
      data: updatedTransaction
    });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// Check and create low stock alerts
async function checkLowStock(item) {
  try {
    if (item.quantity <= item.minQuantity) {
      let alertLevel = 'LOW';
      if (item.quantity === 0) {
        alertLevel = 'OUT_OF_STOCK';
      } else if (item.quantity <= item.minQuantity * 0.5) {
        alertLevel = 'CRITICAL';
      }

      await prisma.lowStockAlert.upsert({
        where: {
          itemId_status: {
            itemId: item.id,
            status: 'ACTIVE'
          }
        },
        update: {
          currentQuantity: item.quantity,
          alertLevel
        },
        create: {
          itemId: item.id,
          currentQuantity: item.quantity,
          minQuantity: item.minQuantity,
          alertLevel
        }
      });
    } else {
      await prisma.lowStockAlert.updateMany({
        where: {
          itemId: item.id,
          status: 'ACTIVE'
        },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date()
        }
      });
    }
  } catch (error) {
    console.error('Low stock check error:', error);
  }
}

module.exports = router;