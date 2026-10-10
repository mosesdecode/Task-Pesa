const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const userToKeepEmail = 'kimindasuleiman@gmail.com';

  console.log(`Deleting all users except: ${userToKeepEmail}...`);

  // Delete all users where the email is NOT the client's test email
  const deletedUsers = await prisma.user.deleteMany({
    where: {
      NOT: {
        email: userToKeepEmail,
      },
    },
  });

  console.log(`Successfully deleted ${deletedUsers.count} test users and all their related data.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
