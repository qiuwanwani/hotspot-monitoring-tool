import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 读取 .env 文件
function readEnvFile(): Record<string, string> {
  try {
    const envPath = path.join(process.cwd(), '.env');
    const content = fs.readFileSync(envPath, 'utf-8');
    const env: Record<string, string> = {};

    content.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
      }
    });

    return env;
  } catch (error) {
    return {};
  }
}

// 写入 .env 文件
function writeEnvFile(env: Record<string, string>): void {
  const envPath = path.join(process.cwd(), '.env');
  let content = '';

  // 读取现有内容以保持注释和格式
  let existingContent = '';
  try {
    existingContent = fs.readFileSync(envPath, 'utf-8');
  } catch (error) {
    // 文件不存在，创建新文件
  }

  // 更新或添加变量
  const lines = existingContent.split('\n');
  const updatedLines: string[] = [];
  const updatedKeys = new Set<string>();

  for (const line of lines) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      if (env[key] !== undefined) {
        updatedLines.push(`${key}="${env[key]}"`);
        updatedKeys.add(key);
      } else {
        updatedLines.push(line);
      }
    } else {
      updatedLines.push(line);
    }
  }

  // 添加新变量
  for (const [key, value] of Object.entries(env)) {
    if (!updatedKeys.has(key)) {
      updatedLines.push(`${key}="${value}"`);
    }
  }

  fs.writeFileSync(envPath, updatedLines.join('\n'), 'utf-8');
}

export async function GET() {
  try {
    const env = readEnvFile();

    // 返回前端需要的配置
    const settings = {
      // AI 配置
      aiBaseUrl: env.AI_BASE_URL || '',
      aiModel: env.AI_MODEL || '',
      aiApiKey: env.AI_API_KEY || env.OPENROUTER_API_KEY || env.OPENAI_API_KEY || '',

      // Twitter 配置
      twitterApiKey: env.TWITTER_API_KEY || '',

      // 邮件配置
      email: env.SMTP_USER || '',
      smtpHost: env.SMTP_HOST || '',
      smtpPort: env.SMTP_PORT || '587',
      smtpUser: env.SMTP_USER || '',
      smtpPass: env.SMTP_PASSWORD || '',

      // Web Push 配置
      vapidPublicKey: env.VAPID_PUBLIC_KEY || '',
    };

    return NextResponse.json(settings);
  } catch (error) {
    console.error('获取设置失败:', error);
    return NextResponse.json(
      { error: '获取设置失败' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const env = readEnvFile();

    // 更新 AI 配置
    if (body.aiBaseUrl !== undefined) {
      env.AI_BASE_URL = body.aiBaseUrl;
    }
    if (body.aiModel !== undefined) {
      env.AI_MODEL = body.aiModel;
    }
    if (body.aiApiKey !== undefined) {
      env.AI_API_KEY = body.aiApiKey;
    }

    // 更新 Twitter 配置
    if (body.twitterApiKey !== undefined) {
      env.TWITTER_API_KEY = body.twitterApiKey;
    }

    // 更新邮件配置
    if (body.email !== undefined) {
      env.SMTP_USER = body.email;
    }
    if (body.smtpHost !== undefined) {
      env.SMTP_HOST = body.smtpHost;
    }
    if (body.smtpPort !== undefined) {
      env.SMTP_PORT = body.smtpPort;
    }
    if (body.smtpUser !== undefined) {
      env.SMTP_USER = body.smtpUser;
    }
    if (body.smtpPass !== undefined) {
      env.SMTP_PASSWORD = body.smtpPass;
    }

    // 写入 .env 文件
    writeEnvFile(env);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('保存设置失败:', error);
    return NextResponse.json(
      { error: '保存设置失败' },
      { status: 500 }
    );
  }
}
