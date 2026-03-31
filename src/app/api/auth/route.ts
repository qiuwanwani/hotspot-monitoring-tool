import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { generateToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { action, email, password, name } = await req.json();

    if (action === 'register') {
      // 检查用户是否已存在
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return NextResponse.json(
          { error: '用户已存在' },
          { status: 400 }
        );
      }

      // 加密密码
      const hashedPassword = await bcrypt.hash(password, 10);

      // 创建用户
      const user = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
        }
      });

      // 创建默认设置
      await prisma.userSettings.create({
        data: {
          userId: user.id,
        }
      });

      return NextResponse.json({
        message: '注册成功',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      });
    }

    if (action === 'login') {
      // 查找用户
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        return NextResponse.json(
          { error: '用户不存在' },
          { status: 400 }
        );
      }

      // 验证密码
      const isValid = await bcrypt.compare(password, user.password);

      if (!isValid) {
        return NextResponse.json(
          { error: '密码错误' },
          { status: 400 }
        );
      }

      // 生成 JWT
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      return NextResponse.json({
        message: '登录成功',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      });
    }

    return NextResponse.json(
      { error: '无效的操作' },
      { status: 400 }
    );
  } catch (error) {
    console.error('认证失败:', error);
    return NextResponse.json(
      { error: '认证失败' },
      { status: 500 }
    );
  }
}
