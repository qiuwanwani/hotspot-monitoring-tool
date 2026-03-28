import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '热点监控工具',
  description: '自动发现和监控热点信息，第一时间推送通知',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
