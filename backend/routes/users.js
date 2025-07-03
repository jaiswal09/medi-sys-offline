const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all users (Admin only)
router.get('/', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        department: true,
        phoneNumber: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ data: users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create user (Admin only)
router.post('/', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { email, password, fullName, role, department, phoneNumber } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        role,
        department,
        phoneNumber,
        isActive: true
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        department: true,
        phoneNumber: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.status(201).json({
      message: 'User created successfully',
      data: user
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user (Admin only)
router.put('/:id', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, role, department, phoneNumber, isActive } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        fullName,
        role,
        department,
        phoneNumber,
        isActive
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        department: true,
        phoneNumber: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update user error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (Admin only)
router.delete('/:id', authenticateToken, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user has active transactions
    const activeTransactions = await prisma.transaction.count({
      where: { 
        userId: id,
        status: 'ACTIVE'
      }
    });

    if (activeTransactions > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete user with active transactions' 
      });
    }

    await prisma.user.delete({
      where: { id }
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;