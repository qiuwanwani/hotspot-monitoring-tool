const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearHotspots() {
  console.log('开始清空热点数据...');

  try {
    // 删除所有热点相关数据
    console.log('删除收藏记录...');
    await prisma.favorite.deleteMany();

    console.log('删除热度历史...');
    await prisma.heatHistory.deleteMany();

    console.log('删除通知...');
    await prisma.notification.deleteMany();

    console.log('删除热点...');
    const result = await prisma.hotspot.deleteMany();

    console.log(`已删除 ${result.count} 条热点数据`);
    console.log('热点数据清空完成！');
  } catch (error) {
    console.error('清空热点数据失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearHotspots();
