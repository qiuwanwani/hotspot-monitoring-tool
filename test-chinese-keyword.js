const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('清理现有数据...');
  
  const hotspots = await prisma.hotspot.findMany();
  for (const hotspot of hotspots) {
    await prisma.hotspot.update({
      where: { id: hotspot.id },
      data: { keywords: { set: [] } },
    });
  }
  
  await prisma.hotspot.deleteMany({});
  await prisma.keyword.deleteMany({});
  
  console.log('添加测试关键词...');
  
  await prisma.keyword.create({
    data: {
      keyword: 'AI',
      isActive: true,
      checkInterval: 30,
    },
  });
  
  console.log('✅ 测试数据已准备');
  console.log('现在请访问 http://localhost:3000 并手动触发数据获取');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
