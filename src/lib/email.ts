import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    if (process.env.SMTP_HOST) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        }
      });
    }
  }

  async send(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      console.warn('SMTP 未配置，邮件发送已跳过');
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text
      });
      return true;
    } catch (error) {
      console.error('邮件发送失败:', error);
      return false;
    }
  }

  async sendHotspotAlert(options: {
    to: string;
    keyword: string;
    title: string;
    url: string;
    source: string;
    heatScore: number;
  }): Promise<boolean> {
    const { to, keyword, title, url, source, heatScore } = options;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #00d9ff; margin-bottom: 20px;">🔥 热点监控提醒</h2>
        
        <div style="background: #16161f; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <p style="color: #a1a1aa; margin-bottom: 8px;">关键词: <strong style="color: #00d9ff;">${keyword}</strong></p>
          <h3 style="color: #ffffff; margin: 0 0 12px 0;">${title}</h3>
          <p style="color: #a1a1aa; margin-bottom: 12px;">
            来源: ${source} | 热度: ${heatScore}
          </p>
          <a href="${url}" style="display: inline-block; background: #00d9ff; color: #0a0a0f; padding: 10px 20px; border-radius: 8px; text-decoration: none; font-weight: 500;">
            查看详情
          </a>
        </div>
        
        <p style="color: #71717a; font-size: 12px;">
          此邮件由热点监控工具自动发送，请勿回复。
        </p>
      </div>
    `;

    return this.send({
      to,
      subject: `🔥 热点提醒: ${title}`,
      html,
      text: `热点提醒: ${title}\n关键词: ${keyword}\n来源: ${source}\n热度: ${heatScore}\n链接: ${url}`
    });
  }
}

export const emailService = new EmailService();
