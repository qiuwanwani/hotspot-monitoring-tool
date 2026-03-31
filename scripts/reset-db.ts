const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resetDatabase() {
  console.log('开始清空数据库...');

  try {
    // 按照外键依赖顺序删除数据
    // 先删除有外键依赖的表

    console.log('删除收藏记录...');
    await prisma.favorite.deleteMany();

    console.log('删除热度历史...');
    await prisma.heatHistory.deleteMany();

    console.log('删除通知...');
    await prisma.notification.deleteMany();

    console.log('删除监控日志...');
    await prisma.monitorLog.deleteMany();

    console.log('删除数据源健康状态...');
    await prisma.dataSourceHealth.deleteMany();

    console.log('删除热点...');
    await prisma.hotspot.deleteMany();

    console.log('删除关键词...');
    await prisma.keyword.deleteMany();

    console.log('删除数据源...');
    await prisma.dataSource.deleteMany();

    console.log('删除用户设置...');
    await prisma.userSettings.deleteMany();

    console.log('删除用户...');
    await prisma.user.deleteMany();

    console.log('数据库清空完成！');
  } catch (error) {
    console.error('清空数据库失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

resetDatabase();
