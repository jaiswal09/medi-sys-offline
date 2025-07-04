const express = require('express');
const prisma = require('../lib/prisma');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all categories
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('📂 Fetching categories...');
    
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { items: true }
        }
      }
    });

    console.log(`✅ Found ${categories.length} categories`);
    res.json({ data: categories });
  } catch (error) {
    console.error('❌ Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Create category with ACID transaction
router.post('/', authenticateToken, requireRole(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    console.log('📂 Creating new category:', req.body);
    
    const { name, description, color, icon } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Check for duplicate name
      const existingCategory = await tx.category.findUnique({
        where: { name: name.trim() }
      });

      if (existingCategory) {
        throw new Error('Category name already exists');
      }

      // Create the category
      const category = await tx.category.create({
        data: {
          name: name.trim(),
          description: description || null,
          color: color || '#2563eb',
          icon: icon || 'Package',
          createdBy: req.user.id
        }
      });

      return category;
    });

    console.log('✅ Category created successfully:', result.id);
    res.status(201).json({
      message: 'Category created successfully',
      data: result
    });

  } catch (error) {
    console.error('❌ Create category error:', error);
    
    if (error.message === 'Category name already exists') {
      return res.status(400).json({ error: error.message });
    }
    
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Category name already exists' });
    }

    res.status(500).json({ 
      error: 'Failed to create category',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update category with ACID transaction
router.put('/:id', authenticateToken, requireRole(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📂 Updating category:', id, req.body);

    const result = await prisma.$transaction(async (tx) => {
      // Check if category exists
      const existingCategory = await tx.category.findUnique({
        where: { id }
      });

      if (!existingCategory) {
        throw new Error('Category not found');
      }

      // Prepare update data
      const updateData = {};
      if (req.body.name) updateData.name = req.body.name.trim();
      if (req.body.description !== undefined) updateData.description = req.body.description || null;
      if (req.body.color) updateData.color = req.body.color;
      if (req.body.icon) updateData.icon = req.body.icon;
      if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive;

      // Check for duplicate name if name is being updated
      if (updateData.name && updateData.name !== existingCategory.name) {
        const duplicateCategory = await tx.category.findUnique({
          where: { name: updateData.name }
        });

        if (duplicateCategory) {
          throw new Error('Category name already exists');
        }
      }

      // Update the category
      const category = await tx.category.update({
        where: { id },
        data: updateData
      });

      return category;
    });

    console.log('✅ Category updated successfully');
    res.json({
      message: 'Category updated successfully',
      data: result
    });

  } catch (error) {
    console.error('❌ Update category error:', error);
    
    if (error.message === 'Category not found') {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    if (error.message === 'Category name already exists') {
      return res.status(400).json({ error: error.message });
    }
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Category name already exists' });
    }

    res.status(500).json({ 
      error: 'Failed to update category',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete category with ACID transaction
router.delete('/:id', authenticateToken, requireRole(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Deleting category:', id);

    await prisma.$transaction(async (tx) => {
      // Check if category has items
      const itemCount = await tx.inventoryItem.count({
        where: { categoryId: id }
      });

      if (itemCount > 0) {
        throw new Error('Cannot delete category with existing items. Please reassign items first.');
      }

      // Delete the category
      await tx.category.delete({
        where: { id }
      });

      console.log('✅ Category deleted successfully');
    });

    res.json({ message: 'Category deleted successfully' });

  } catch (error) {
    console.error('❌ Delete category error:', error);
    
    if (error.message.includes('Cannot delete category with existing items')) {
      return res.status(400).json({ error: error.message });
    }
    
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.status(500).json({ 
      error: 'Failed to delete category',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
