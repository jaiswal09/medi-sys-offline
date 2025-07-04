const express = require('express');
const prisma = require('../lib/prisma');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all transactions
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('📋 Fetching transactions for user:', req.user.role);
    
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

    console.log(`✅ Found ${transactions.length} transactions`);
    res.json({ data: transactions });
  } catch (error) {
    console.error('❌ Get transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Create transaction with ACID properties
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('📋 Creating new transaction:', req.body);
    
    const { item_id, transaction_type, quantity, due_date, location_used, notes } = req.body;

    if (!item_id || !transaction_type || !quantity) {
      return res.status(400).json({ 
        error: 'Missing required fields: item_id, transaction_type, and quantity are required' 
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Get item details with lock
      const item = await tx.inventoryItem.findUnique({
        where: { id: item_id }
      });

      if (!item) {
        throw new Error('Item not found');
      }

      // Check availability for checkout
      if (transaction_type === 'CHECKOUT' && item.quantity < parseInt(quantity)) {
        throw new Error('Insufficient quantity available');
      }

      // Create transaction
      const transaction = await tx.transaction.create({
        data: {
          itemId: item_id,
          userId: req.user.id,
          transactionType: transaction_type,
          quantity: parseInt(quantity),
          dueDate: due_date ? new Date(due_date) : null,
          locationUsed: location_used || null,
          notes: notes || null,
          status: 'ACTIVE'
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

      // Update inventory quantity based on transaction type
      let quantityChange = 0;
      if (transaction_type === 'CHECKOUT') {
        quantityChange = -parseInt(quantity);
      } else if (transaction_type === 'CHECKIN') {
        quantityChange = parseInt(quantity);
      }

      if (quantityChange !== 0) {
        const updatedItem = await tx.inventoryItem.update({
          where: { id: item_id },
          data: {
            quantity: {
              increment: quantityChange
            }
          }
        });

        // Check for low stock alerts
        await checkAndCreateLowStockAlert(tx, updatedItem);
      }

      return transaction;
    });

    console.log('✅ Transaction created successfully:', result.id);
    res.status(201).json({
      message: 'Transaction created successfully',
      data: result
    });

  } catch (error) {
    console.error('❌ Create transaction error:', error);
    
    if (error.message === 'Item not found') {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    if (error.message === 'Insufficient quantity available') {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ 
      error: 'Failed to create transaction',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update transaction with ACID properties
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📋 Updating transaction:', id, req.body);
    
    const { status, condition_on_return, notes, returned_date } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({
        where: { id },
        include: { item: true }
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Check permissions
      if (req.user.role === 'MEDICAL_PERSONNEL' && transaction.userId !== req.user.id) {
        throw new Error('Can only update your own transactions');
      }

      const updateData = {
        status,
        conditionOnReturn: condition_on_return || null,
        notes: notes || null
      };

      // Handle completion of checkout transactions
      if (status === 'COMPLETED' && !transaction.returnedDate && transaction.transactionType === 'CHECKOUT') {
        updateData.returnedDate = returned_date ? new Date(returned_date) : new Date();
        
        // Return items to inventory
        const updatedItem = await tx.inventoryItem.update({
          where: { id: transaction.itemId },
          data: {
            quantity: {
              increment: transaction.quantity
            }
          }
        });

        // Check for low stock alerts
        await checkAndCreateLowStockAlert(tx, updatedItem);
      }

      const updatedTransaction = await tx.transaction.update({
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

      return updatedTransaction;
    });

    console.log('✅ Transaction updated successfully');
    res.json({
      message: 'Transaction updated successfully',
      data: result
    });

  } catch (error) {
    console.error('❌ Update transaction error:', error);
    
    if (error.message === 'Transaction not found') {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    if (error.message === 'Can only update your own transactions') {
      return res.status(403).json({ error: error.message });
    }

    res.status(500).json({ 
      error: 'Failed to update transaction',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Helper function to check and create low stock alerts
async function checkAndCreateLowStockAlert(tx, item) {
  try {
    if (item.quantity <= item.minQuantity) {
      let alertLevel = 'LOW';
      if (item.quantity === 0) {
        alertLevel = 'OUT_OF_STOCK';
      } else if (item.quantity <= item.minQuantity * 0.5) {
        alertLevel = 'CRITICAL';
      }

      // Remove existing active alerts
      await tx.lowStockAlert.updateMany({
        where: {
          itemId: item.id,
          status: 'ACTIVE'
        },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date()
        }
      });

      // Create new alert
      await tx.lowStockAlert.create({
        data: {
          itemId: item.id,
          currentQuantity: item.quantity,
          minQuantity: item.minQuantity,
          alertLevel: alertLevel,
          status: 'ACTIVE'
        }
      });

      console.log('⚠️ Low stock alert created for item:', item.name);
    } else {
      // Resolve any existing alerts
      await tx.lowStockAlert.updateMany({
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
    console.error('❌ Low stock check error:', error);
  }
}

module.exports = router;
