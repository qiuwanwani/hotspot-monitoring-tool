const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearData() {
  console.log('🧹 清除数据...');
  
  const deletedNotifications = await prisma.notification.deleteMany({});
  console.log(`  - 删除 ${deletedNotifications.count} 条通知`);
  
  const deletedHotspots = await prisma.hotspot.deleteMany({});
  console.log(`  - 删除 ${deletedHotspots.count} 条热点`);
  
  const deletedKeywords = await prisma.keyword.deleteMany({});
  console.log(`  - 删除 ${deletedKeywords.count} 条关键词`);
  
  const deletedDataSources = await prisma.dataSource.deleteMany({});
  console.log(`  - 删除 ${deletedDataSources.count} 个数据源`);
  
  console.log('✅ 数据清除完成');
  prisma.$disconnect();
}

clearData().catch(console.error);
