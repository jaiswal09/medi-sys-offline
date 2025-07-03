const express = require('express');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const prisma = require('../lib/prisma');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Generate QR code for item
const generateQRCode = async (itemId, itemName) => {
  try {
    const qrData = JSON.stringify({
      id: itemId,
      name: itemName,
      type: 'inventory_item'
    });
    return await QRCode.toDataURL(qrData);
  } catch (error) {
    console.error('QR code generation error:', error);
    return null;
  }
};

// Get all inventory items
router.get('/', authenticateToken, async (req, res) => {
  try {
    const items = await prisma.inventoryItem.findMany({
      include: {
        category: true,
        creator: {
          select: { id: true, fullName: true, email: true }
        },
        _count: {
          select: { transactions: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ data: items });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ error: 'Failed to fetch inventory items' });
  }
});

// Get single inventory item
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        category: true,
        creator: {
          select: { id: true, fullName: true, email: true }
        },
        transactions: {
          include: {
            user: {
              select: { id: true, fullName: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ data: item });
  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

// Create inventory item
router.post('/', authenticateToken, requireRole(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const itemData = {
      ...req.body,
      createdBy: req.user.id,
      qrCode: `QR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    const item = await prisma.inventoryItem.create({
      data: itemData,
      include: {
        category: true,
        creator: {
          select: { id: true, fullName: true, email: true }
        }
      }
    });

    // Check for low stock alert
    await checkLowStock(item);

    res.status(201).json({
      message: 'Item created successfully',
      data: item
    });
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// Update inventory item
router.put('/:id', authenticateToken, requireRole(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    const item = await prisma.inventoryItem.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        creator: {
          select: { id: true, fullName: true, email: true }
        }
      }
    });

    // Check for low stock alert
    await checkLowStock(item);

    res.json({
      message: 'Item updated successfully',
      data: item
    });
  } catch (error) {
    console.error('Update item error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// Delete inventory item
router.delete('/:id', authenticateToken, requireRole(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if item has active transactions
    const activeTransactions = await prisma.transaction.count({
      where: { 
        itemId: id,
        status: 'ACTIVE'
      }
    });

    if (activeTransactions > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete item with active transactions' 
      });
    }

    await prisma.inventoryItem.delete({
      where: { id }
    });

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Delete item error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// Generate QR code for item
router.get('/:id/qr-code', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      select: { id: true, name: true, qrCode: true }
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const qrCodeDataUrl = await generateQRCode(item.id, item.name);

    res.json({
      qrCode: item.qrCode,
      qrCodeImage: qrCodeDataUrl
    });
  } catch (error) {
    console.error('QR code generation error:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
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

      // Create or update alert
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
      // Resolve any existing alerts
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