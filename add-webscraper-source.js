const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addWebScraperSource() {
  console.log('🔧 添加WebScraper数据源...');
  
  const existing = await prisma.dataSource.findFirst({
    where: { type: 'web-scraper' }
  });
  
  if (existing) {
    console.log('  - WebScraper数据源已存在');
    prisma.$disconnect();
    return;
  }
  
  await prisma.dataSource.create({
    data: {
      name: 'WebScraper',
      type: 'web-scraper',
      config: '{}',
      isActive: true,
      weight: 2,
      minScore: 25,
    }
  });
  
  console.log('✅ WebScraper数据源已添加');
  prisma.$disconnect();
}

addWebScraperSource().catch(console.error);
