import { prisma } from '../src/config/prisma';
import bcrypt from 'bcryptjs';

async function resetAdminPassword() {
  const newPassword = process.argv[2] || 'Admin123!';
  const adminEmail = process.argv[3] || 'admin.core@martifycollection.com';

  console.log(`🔒 Resetting password for: ${adminEmail}`);
  console.log(`🔑 New plain-text password: ${newPassword}`);

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: adminEmail },
        { role: 'ADMIN' },
      ],
    },
  });

  if (!user) {
    console.error('❌ Admin user not found in database.');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  console.log(`✅ Successfully updated admin password!`);
  console.log(`   User: ${user.name} (${user.email})`);
  console.log(`   Role: ${user.role}`);
  console.log(`   You can now log in at: http://localhost:3000/admin/login`);
}

resetAdminPassword()
  .catch((e) => {
    console.error('❌ Error resetting password:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
