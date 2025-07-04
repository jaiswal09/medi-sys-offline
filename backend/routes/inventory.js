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
    console.log('📦 Fetching inventory items...');
    
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

    console.log(`✅ Found ${items.length} inventory items`);
    res.json({ data: items });
  } catch (error) {
    console.error('❌ Get inventory error:', error);
    res.status(500).json({ error: 'Failed to fetch inventory items' });
  }
});

// Get single inventory item
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📦 Fetching inventory item:', id);

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

    console.log('✅ Found inventory item:', item.name);
    res.json({ data: item });
  } catch (error) {
    console.error('❌ Get item error:', error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

// Create inventory item with ACID transaction
router.post('/', authenticateToken, requireRole(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    console.log('📦 Creating new inventory item:', req.body);

    // Validate required fields
    const { name, location, item_type, quantity, min_quantity } = req.body;
    
    if (!name || !location || !item_type) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, location, and item_type are required' 
      });
    }

    // Use Prisma transaction for ACID properties
    const result = await prisma.$transaction(async (tx) => {
      // Generate unique QR code
      const qrCode = `QR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Prepare item data with proper field mapping
      const itemData = {
        name: name.trim(),
        description: req.body.description || null,
        categoryId: req.body.category_id || null,
        itemType: item_type,
        quantity: parseInt(quantity) || 0,
        minQuantity: parseInt(min_quantity) || 0,
        maxQuantity: req.body.max_quantity ? parseInt(req.body.max_quantity) : null,
        unitPrice: req.body.unit_price ? parseFloat(req.body.unit_price) : null,
        location: location.trim(),
        qrCode: qrCode,
        barcode: req.body.barcode || null,
        status: req.body.status || 'AVAILABLE',
        expiryDate: req.body.expiry_date ? new Date(req.body.expiry_date) : null,
        serialNumber: req.body.serial_number || null,
        manufacturer: req.body.manufacturer || null,
        model: req.body.model || null,
        purchaseDate: req.body.purchase_date ? new Date(req.body.purchase_date) : null,
        warrantyExpiry: req.body.warranty_expiry ? new Date(req.body.warranty_expiry) : null,
        maintenanceIntervalDays: req.body.maintenance_interval_days ? parseInt(req.body.maintenance_interval_days) : null,
        notes: req.body.notes || null,
        createdBy: req.user.id
      };

      console.log('💾 Creating item with data:', itemData);

      // Create the item
      const item = await tx.inventoryItem.create({
        data: itemData,
        include: {
          category: true,
          creator: {
            select: { id: true, fullName: true, email: true }
          }
        }
      });

      console.log('✅ Item created successfully:', item.id);

      // Check for low stock and create alert if needed
      if (item.quantity <= item.minQuantity) {
        let alertLevel = 'LOW';
        if (item.quantity === 0) {
          alertLevel = 'OUT_OF_STOCK';
        } else if (item.quantity <= item.minQuantity * 0.5) {
          alertLevel = 'CRITICAL';
        }

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
      }

      return item;
    });

    console.log('🎉 Item creation transaction completed successfully');
    res.status(201).json({
      message: 'Item created successfully',
      data: result
    });

  } catch (error) {
    console.error('❌ Create item error:', error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Item with this QR code already exists' });
    }
    
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'Invalid category or user reference' });
    }

    res.status(500).json({ 
      error: 'Failed to create item',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update inventory item with ACID transaction
router.put('/:id', authenticateToken, requireRole(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📦 Updating inventory item:', id, req.body);

    const result = await prisma.$transaction(async (tx) => {
      // Check if item exists
      const existingItem = await tx.inventoryItem.findUnique({
        where: { id }
      });

      if (!existingItem) {
        throw new Error('Item not found');
      }

      // Prepare update data with proper field mapping
      const updateData = {};
      
      if (req.body.name) updateData.name = req.body.name.trim();
      if (req.body.description !== undefined) updateData.description = req.body.description || null;
      if (req.body.category_id !== undefined) updateData.categoryId = req.body.category_id || null;
      if (req.body.item_type) updateData.itemType = req.body.item_type;
      if (req.body.quantity !== undefined) updateData.quantity = parseInt(req.body.quantity);
      if (req.body.min_quantity !== undefined) updateData.minQuantity = parseInt(req.body.min_quantity);
      if (req.body.max_quantity !== undefined) updateData.maxQuantity = req.body.max_quantity ? parseInt(req.body.max_quantity) : null;
      if (req.body.unit_price !== undefined) updateData.unitPrice = req.body.unit_price ? parseFloat(req.body.unit_price) : null;
      if (req.body.location) updateData.location = req.body.location.trim();
      if (req.body.status) updateData.status = req.body.status;
      if (req.body.expiry_date !== undefined) updateData.expiryDate = req.body.expiry_date ? new Date(req.body.expiry_date) : null;
      if (req.body.serial_number !== undefined) updateData.serialNumber = req.body.serial_number || null;
      if (req.body.manufacturer !== undefined) updateData.manufacturer = req.body.manufacturer || null;
      if (req.body.model !== undefined) updateData.model = req.body.model || null;
      if (req.body.purchase_date !== undefined) updateData.purchaseDate = req.body.purchase_date ? new Date(req.body.purchase_date) : null;
      if (req.body.warranty_expiry !== undefined) updateData.warrantyExpiry = req.body.warranty_expiry ? new Date(req.body.warranty_expiry) : null;
      if (req.body.maintenance_interval_days !== undefined) updateData.maintenanceIntervalDays = req.body.maintenance_interval_days ? parseInt(req.body.maintenance_interval_days) : null;
      if (req.body.notes !== undefined) updateData.notes = req.body.notes || null;

      console.log('💾 Updating item with data:', updateData);

      // Update the item
      const item = await tx.inventoryItem.update({
        where: { id },
        data: updateData,
        include: {
          category: true,
          creator: {
            select: { id: true, fullName: true, email: true }
          }
        }
      });

      // Check for low stock alerts if quantity changed
      if (updateData.quantity !== undefined || updateData.minQuantity !== undefined) {
        const currentQuantity = updateData.quantity !== undefined ? updateData.quantity : existingItem.quantity;
        const minQuantity = updateData.minQuantity !== undefined ? updateData.minQuantity : existingItem.minQuantity;

        // Remove existing active alerts
        await tx.lowStockAlert.updateMany({
          where: {
            itemId: id,
            status: 'ACTIVE'
          },
          data: {
            status: 'RESOLVED',
            resolvedAt: new Date()
          }
        });

        // Create new alert if needed
        if (currentQuantity <= minQuantity) {
          let alertLevel = 'LOW';
          if (currentQuantity === 0) {
            alertLevel = 'OUT_OF_STOCK';
          } else if (currentQuantity <= minQuantity * 0.5) {
            alertLevel = 'CRITICAL';
          }

          await tx.lowStockAlert.create({
            data: {
              itemId: id,
              currentQuantity: currentQuantity,
              minQuantity: minQuantity,
              alertLevel: alertLevel,
              status: 'ACTIVE'
            }
          });

          console.log('⚠️ Low stock alert updated for item:', item.name);
        }
      }

      return item;
    });

    console.log('✅ Item updated successfully');
    res.json({
      message: 'Item updated successfully',
      data: result
    });

  } catch (error) {
    console.error('❌ Update item error:', error);
    
    if (error.message === 'Item not found') {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Duplicate value for unique field' });
    }

    res.status(500).json({ 
      error: 'Failed to update item',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete inventory item with ACID transaction
router.delete('/:id', authenticateToken, requireRole(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Deleting inventory item:', id);

    await prisma.$transaction(async (tx) => {
      // Check if item has active transactions
      const activeTransactions = await tx.transaction.count({
        where: { 
          itemId: id,
          status: 'ACTIVE'
        }
      });

      if (activeTransactions > 0) {
        throw new Error('Cannot delete item with active transactions');
      }

      // Delete related records first (due to foreign key constraints)
      await tx.lowStockAlert.deleteMany({
        where: { itemId: id }
      });

      await tx.maintenanceSchedule.deleteMany({
        where: { itemId: id }
      });

      // Delete the item
      await tx.inventoryItem.delete({
        where: { id }
      });

      console.log('✅ Item and related records deleted successfully');
    });

    res.json({ message: 'Item deleted successfully' });

  } catch (error) {
    console.error('❌ Delete item error:', error);
    
    if (error.message === 'Cannot delete item with active transactions') {
      return res.status(400).json({ error: error.message });
    }
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.status(500).json({ 
      error: 'Failed to delete item',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Generate QR code for item
router.get('/:id/qr-code', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Generating QR code for item:', id);

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
    console.error('❌ QR code generation error:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

module.exports = router;
