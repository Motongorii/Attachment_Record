const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding 5 admin users...');

  const admins = [
    { admissionNumber: 'J00-0000-0001', role: 'admin', studentName: 'Admin 1' },
    { admissionNumber: 'J00-0000-0002', role: 'admin', studentName: 'Admin 2' },
    { admissionNumber: 'J00-0000-0003', role: 'admin', studentName: 'Admin 3' },
    { admissionNumber: 'J00-0000-0004', role: 'admin', studentName: 'Admin 4' },
    { admissionNumber: 'J00-0000-0005', role: 'admin', studentName: 'Admin 5' },
  ];

  for (const admin of admins) {
    await prisma.user.upsert({
      where: { admissionNumber: admin.admissionNumber },
      update: {},
      create: admin,
    });
  }

  console.log('Admins seeded successfully. Passwords are lowercase of the admission number (e.g. admin-1).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
