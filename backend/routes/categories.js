const express = require('express');
const prisma = require('../lib/prisma');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all categories
router.get('/', authenticateToken, async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { items: true }
        }
      }
    });

    res.json({ data: categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Create category
router.post('/', authenticateToken, requireRole(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const { name, description, color, icon } = req.body;

    const category = await prisma.category.create({
      data: {
        name,
        description,
        color: color || '#2563eb',
        icon: icon || 'Package',
        createdBy: req.user.id
      }
    });

    res.status(201).json({
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    console.error('Create category error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Category name already exists' });
    }
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update category
router.put('/:id', authenticateToken, requireRole(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color, icon, isActive } = req.body;

    const category = await prisma.category.update({
      where: { id },
      data: {
        name,
        description,
        color,
        icon,
        isActive
      }
    });

    res.json({
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    console.error('Update category error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Category not found' });
    }
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Category name already exists' });
    }
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete category
router.delete('/:id', authenticateToken, requireRole(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category has items
    const itemCount = await prisma.inventoryItem.count({
      where: { categoryId: id }
    });

    if (itemCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete category with existing items. Please reassign items first.' 
      });
    }

    await prisma.category.delete({
      where: { id }
    });

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

module.exports = router;