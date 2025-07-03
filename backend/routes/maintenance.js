const express = require('express');
const prisma = require('../lib/prisma');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all maintenance schedules
router.get('/', authenticateToken, requireRole(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const { limit = 100 } = req.query;

    const maintenanceSchedules = await prisma.maintenanceSchedule.findMany({
      include: {
        item: {
          include: {
            category: true
          }
        },
        technician: {
          select: { id: true, fullName: true, email: true }
        },
        creator: {
          select: { id: true, fullName: true, email: true }
        }
      },
      orderBy: { scheduledDate: 'desc' },
      take: parseInt(limit)
    });

    res.json({ data: maintenanceSchedules });
  } catch (error) {
    console.error('Get maintenance error:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance schedules' });
  }
});

// Create maintenance schedule
router.post('/', authenticateToken, requireRole(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const { 
      itemId, 
      maintenanceType, 
      scheduledDate, 
      technicianId, 
      description, 
      cost 
    } = req.body;

    const maintenance = await prisma.maintenanceSchedule.create({
      data: {
        itemId,
        maintenanceType,
        scheduledDate: new Date(scheduledDate),
        technicianId,
        description,
        cost: cost ? parseFloat(cost) : null,
        createdBy: req.user.id
      },
      include: {
        item: {
          include: {
            category: true
          }
        },
        technician: {
          select: { id: true, fullName: true, email: true }
        },
        creator: {
          select: { id: true, fullName: true, email: true }
        }
      }
    });

    res.status(201).json({
      message: 'Maintenance scheduled successfully',
      data: maintenance
    });
  } catch (error) {
    console.error('Create maintenance error:', error);
    res.status(500).json({ error: 'Failed to schedule maintenance' });
  }
});

// Update maintenance schedule
router.put('/:id', authenticateToken, requireRole(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.scheduledDate) {
      updateData.scheduledDate = new Date(updateData.scheduledDate);
    }
    if (updateData.completedDate) {
      updateData.completedDate = new Date(updateData.completedDate);
    }
    if (updateData.nextMaintenanceDate) {
      updateData.nextMaintenanceDate = new Date(updateData.nextMaintenanceDate);
    }
    if (updateData.cost) {
      updateData.cost = parseFloat(updateData.cost);
    }

    const maintenance = await prisma.maintenanceSchedule.update({
      where: { id },
      data: updateData,
      include: {
        item: {
          include: {
            category: true
          }
        },
        technician: {
          select: { id: true, fullName: true, email: true }
        },
        creator: {
          select: { id: true, fullName: true, email: true }
        }
      }
    });

    res.json({
      message: 'Maintenance updated successfully',
      data: maintenance
    });
  } catch (error) {
    console.error('Update maintenance error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Maintenance schedule not found' });
    }
    res.status(500).json({ error: 'Failed to update maintenance' });
  }
});

// Delete maintenance schedule
router.delete('/:id', authenticateToken, requireRole(['ADMIN', 'STAFF']), async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.maintenanceSchedule.delete({
      where: { id }
    });

    res.json({ message: 'Maintenance schedule deleted successfully' });
  } catch (error) {
    console.error('Delete maintenance error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Maintenance schedule not found' });
    }
    res.status(500).json({ error: 'Failed to delete maintenance schedule' });
  }
});

module.exports = router;