const bcrypt = require('bcryptjs');
const prisma = require('./lib/prisma');

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@medcenter.com' },
      update: {},
      create: {
        email: 'admin@medcenter.com',
        password: adminPassword,
        fullName: 'Dr. Sarah Johnson',
        role: 'ADMIN',
        department: 'Administration',
        isActive: true
      }
    });

    // Create staff user
    const staffPassword = await bcrypt.hash('staff123', 12);
    const staff = await prisma.user.upsert({
      where: { email: 'staff@medcenter.com' },
      update: {},
      create: {
        email: 'staff@medcenter.com',
        password: staffPassword,
        fullName: 'Michael Chen',
        role: 'STAFF',
        department: 'Inventory Management',
        isActive: true
      }
    });

    // Create medical personnel user
    const doctorPassword = await bcrypt.hash('doctor123', 12);
    const doctor = await prisma.user.upsert({
      where: { email: 'doctor@medcenter.com' },
      update: {},
      create: {
        email: 'doctor@medcenter.com',
        password: doctorPassword,
        fullName: 'Dr. Emily Rodriguez',
        role: 'MEDICAL_PERSONNEL',
        department: 'Cardiology',
        isActive: true
      }
    });

    console.log('✅ Users created successfully');

    // Create categories
    const categories = [
      {
        name: 'Medical Equipment',
        description: 'Diagnostic and treatment equipment',
        color: '#2563eb',
        icon: 'Stethoscope'
      },
      {
        name: 'Surgical Supplies',
        description: 'Surgical instruments and supplies',
        color: '#dc2626',
        icon: 'Scissors'
      },
      {
        name: 'Medications',
        description: 'Pharmaceuticals and drugs',
        color: '#059669',
        icon: 'Pill'
      },
      {
        name: 'Laboratory Equipment',
        description: 'Lab equipment and testing supplies',
        color: '#7c2d12',
        icon: 'TestTube'
      },
      {
        name: 'Patient Care',
        description: 'Patient care and comfort items',
        color: '#0d9488',
        icon: 'Heart'
      },
      {
        name: 'Emergency Supplies',
        description: 'Emergency and trauma care supplies',
        color: '#ea580c',
        icon: 'AlertTriangle'
      },
      {
        name: 'Disposables',
        description: 'Single-use medical supplies',
        color: '#7c3aed',
        icon: 'Trash2'
      },
      {
        name: 'Protective Equipment',
        description: 'Personal protective equipment',
        color: '#be185d',
        icon: 'Shield'
      }
    ];

    const createdCategories = [];
    for (const category of categories) {
      const created = await prisma.category.upsert({
        where: { name: category.name },
        update: {},
        create: {
          ...category,
          createdBy: admin.id
        }
      });
      createdCategories.push(created);
    }

    console.log('✅ Categories created successfully');

    // Create sample inventory items
    const inventoryItems = [
      {
        name: 'Digital Blood Pressure Monitor',
        description: 'Automatic digital BP monitor with memory and large display',
        categoryId: createdCategories.find(c => c.name === 'Medical Equipment').id,
        itemType: 'EQUIPMENT',
        quantity: 15,
        minQuantity: 5,
        maxQuantity: 25,
        unitPrice: 299.99,
        location: 'Storage Room A-1',
        status: 'AVAILABLE',
        serialNumber: 'BP-2024-001',
        manufacturer: 'Omron Healthcare',
        model: 'HEM-7156T',
        maintenanceIntervalDays: 180,
        notes: 'Calibrated quarterly'
      },
      {
        name: 'Pulse Oximeter',
        description: 'Fingertip pulse oximeter with LED display',
        categoryId: createdCategories.find(c => c.name === 'Medical Equipment').id,
        itemType: 'EQUIPMENT',
        quantity: 8,
        minQuantity: 3,
        maxQuantity: 15,
        unitPrice: 89.99,
        location: 'Nursing Station B',
        status: 'AVAILABLE',
        serialNumber: 'PO-2024-002',
        manufacturer: 'Masimo',
        model: 'MightySat Rx',
        maintenanceIntervalDays: 90,
        notes: 'Battery replacement needed monthly'
      },
      {
        name: 'Surgical Scissors',
        description: 'Stainless steel surgical scissors, curved',
        categoryId: createdCategories.find(c => c.name === 'Surgical Supplies').id,
        itemType: 'SUPPLIES',
        quantity: 25,
        minQuantity: 10,
        maxQuantity: 50,
        unitPrice: 45.99,
        location: 'OR Supply Cabinet',
        status: 'AVAILABLE',
        serialNumber: 'SS-2024-010',
        manufacturer: 'Aesculap',
        model: 'BC311R',
        notes: 'Sterilized after each use'
      },
      {
        name: 'Paracetamol 500mg',
        description: 'Pain relief and fever reduction tablets',
        categoryId: createdCategories.find(c => c.name === 'Medications').id,
        itemType: 'MEDICATIONS',
        quantity: 2500,
        minQuantity: 500,
        maxQuantity: 5000,
        unitPrice: 0.15,
        location: 'Pharmacy Storage',
        status: 'AVAILABLE',
        serialNumber: 'PARA-2024-020',
        manufacturer: 'Generic Pharma',
        model: '500mg Tablets',
        notes: 'Store in cool, dry place'
      },
      {
        name: 'Disposable Gloves',
        description: 'Nitrile examination gloves, powder-free',
        categoryId: createdCategories.find(c => c.name === 'Disposables').id,
        itemType: 'CONSUMABLES',
        quantity: 5000,
        minQuantity: 1000,
        maxQuantity: 10000,
        unitPrice: 0.12,
        location: 'Supply Room',
        status: 'AVAILABLE',
        serialNumber: 'GLV-2024-050',
        manufacturer: 'Ansell',
        model: 'TouchNTuff',
        notes: 'Multiple sizes available'
      },
      {
        name: 'Face Masks',
        description: 'Surgical face masks, 3-layer protection',
        categoryId: createdCategories.find(c => c.name === 'Protective Equipment').id,
        itemType: 'CONSUMABLES',
        quantity: 2000,
        minQuantity: 500,
        maxQuantity: 5000,
        unitPrice: 0.25,
        location: 'PPE Storage',
        status: 'AVAILABLE',
        serialNumber: 'MASK-2024-051',
        manufacturer: 'Kimberly-Clark',
        model: 'Level 1',
        notes: 'ASTM Level 1 certified'
      },
      {
        name: 'Low Stock Test Item',
        description: 'Item with low stock for testing alerts',
        categoryId: createdCategories.find(c => c.name === 'Medical Equipment').id,
        itemType: 'EQUIPMENT',
        quantity: 2,
        minQuantity: 10,
        maxQuantity: 20,
        unitPrice: 150.00,
        location: 'Test Storage',
        status: 'AVAILABLE',
        serialNumber: 'LOW-2024-001',
        manufacturer: 'Test Manufacturer',
        model: 'Test Model',
        notes: 'This item should trigger low stock alert'
      }
    ];

    for (const item of inventoryItems) {
      await prisma.inventoryItem.upsert({
        where: { serialNumber: item.serialNumber },
        update: {},
        create: {
          ...item,
          qrCode: `QR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          createdBy: admin.id
        }
      });
    }

    console.log('✅ Inventory items created successfully');

    // Create some sample transactions
    const items = await prisma.inventoryItem.findMany();
    if (items.length > 0) {
      const sampleTransactions = [
        {
          itemId: items[0].id,
          userId: doctor.id,
          transactionType: 'CHECKOUT',
          quantity: 2,
          status: 'ACTIVE',
          notes: 'For patient examination'
        },
        {
          itemId: items[1].id,
          userId: doctor.id,
          transactionType: 'CHECKOUT',
          quantity: 1,
          status: 'COMPLETED',
          notes: 'Returned after use',
          returnedDate: new Date()
        }
      ];

      for (const transaction of sampleTransactions) {
        await prisma.transaction.create({
          data: transaction
        });
      }

      console.log('✅ Sample transactions created successfully');
    }

    // Verify data was created
    const counts = {
      users: await prisma.user.count(),
      categories: await prisma.category.count(),
      items: await prisma.inventoryItem.count(),
      transactions: await prisma.transaction.count()
    };

    console.log('📊 Database counts:', counts);
    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Demo Accounts:');
    console.log('👨‍💼 Admin: admin@medcenter.com / admin123');
    console.log('👩‍💼 Staff: staff@medcenter.com / staff123');
    console.log('👨‍⚕️ Doctor: doctor@medcenter.com / doctor123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });