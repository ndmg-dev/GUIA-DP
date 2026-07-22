import { PrismaClient } from '@prisma/client';
import { faqSeed } from '../src/data/faqSeed';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Populando faq_items...');

  for (const item of faqSeed) {
    // Idempotente: upsert por orderIndex evita duplicar em re-execuções.
    const existing = await prisma.faqItem.findFirst({
      where: { orderIndex: item.orderIndex },
    });

    if (existing) {
      await prisma.faqItem.update({
        where: { id: existing.id },
        data: {
          question: item.question,
          answer: item.answer,
          category: item.category,
        },
      });
    } else {
      await prisma.faqItem.create({ data: item });
    }
  }

  const count = await prisma.faqItem.count();
  console.log(`✅ Seed concluído. Total de FAQ: ${count}`);
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
