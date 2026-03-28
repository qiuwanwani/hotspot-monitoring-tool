import webpush from 'web-push';

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
}

export class PushService {
  private initialized = false;

  constructor() {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;

    if (publicKey && privateKey) {
      webpush.setVapidDetails(
        'mailto:contact@example.com',
        publicKey,
        privateKey
      );
      this.initialized = true;
    }
  }

  async send(subscription: PushSubscription, payload: PushPayload): Promise<boolean> {
    if (!this.initialized) {
      console.warn('Web Push 未配置，推送已跳过');
      return false;
    }

    try {
      await webpush.sendNotification(
        subscription as any,
        JSON.stringify(payload)
      );
      return true;
    } catch (error) {
      console.error('推送发送失败:', error);
      return false;
    }
  }

  async sendHotspotAlert(subscription: PushSubscription, options: {
    keyword: string;
    title: string;
    url: string;
    heatScore: number;
  }): Promise<boolean> {
    const { keyword, title, url, heatScore } = options;

    return this.send(subscription, {
      title: `🔥 热点提醒: ${keyword}`,
      body: `${title} (热度: ${heatScore})`,
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      data: { url }
    });
  }

  async sendMultiple(subscriptions: PushSubscription[], payload: PushPayload): Promise<number> {
    const results = await Promise.allSettled(
      subscriptions.map(sub => this.send(sub, payload))
    );

    return results.filter(r => r.status === 'fulfilled' && r.value).length;
  }
}

export const pushService = new PushService();

export function generateVapidKeys() {
  return webpush.generateVAPIDKeys();
}
