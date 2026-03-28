import prisma from '@/lib/prisma';
import { emailService } from './email';
import { pushService } from './push';

export interface NotificationOptions {
  type: 'email' | 'push' | 'both';
  keywordId?: string;
  hotspotId: string;
  userId?: string;
}

export class NotificationService {
  async sendNotification(options: NotificationOptions & {
    email?: string;
    pushSubscription?: any;
    keyword: string;
    title: string;
    url: string;
    source: string;
    heatScore: number;
  }): Promise<void> {
    const { type, keywordId, hotspotId, keyword, title, url, source, heatScore, email, pushSubscription } = options;

    const notification = await prisma.notification.create({
      data: {
        type,
        status: 'pending',
        hotspotId,
        keywordId
      }
    });

    let success = false;

    try {
      if ((type === 'email' || type === 'both') && email) {
        success = await emailService.sendHotspotAlert({
          to: email,
          keyword,
          title,
          url,
          source,
          heatScore
        });
      }

      if ((type === 'push' || type === 'both') && pushSubscription) {
        success = await pushService.sendHotspotAlert(pushSubscription, {
          keyword,
          title,
          url,
          heatScore
        });
      }

      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: success ? 'sent' : 'failed',
          sentAt: success ? new Date() : null,
          error: success ? null : '发送失败'
        }
      });
    } catch (error: any) {
      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: 'failed',
          error: error.message
        }
      });
    }
  }

  async getNotificationHistory(options?: {
    limit?: number;
    offset?: number;
    status?: string;
  }) {
    const { limit = 20, offset = 0, status } = options || {};

    const where = status ? { status } : {};

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: {
          hotspot: true,
          keyword: true
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.notification.count({ where })
    ]);

    return { notifications, total };
  }
}

export const notificationService = new NotificationService();
