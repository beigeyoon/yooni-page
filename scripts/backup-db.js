const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  const posts = await prisma.post.findMany();
  const users = await prisma.user.findMany();
  const comments = await prisma.comment.findMany();
  const thoughts = await prisma.thought.findMany();

  const backupData = { posts, users, comments, thoughts };

  const filePath = path.join(__dirname, 'backup.json');
  fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf-8');

  console.log('✅ Backup saved to', filePath);
}

main()
  .catch(e => {
    console.error('❌ Backup failed:', e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });