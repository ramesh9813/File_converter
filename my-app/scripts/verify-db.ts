import { prisma } from '../lib/db';

async function main() {
  try {
    const count = await prisma.conversion.count();
    console.log(`There are ${count} conversions in the database.`);
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
