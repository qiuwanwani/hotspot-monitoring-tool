import fs from 'fs';
import path from 'path';
import prisma from './prisma';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal'
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: string;
  error?: Error;
  metadata?: Record<string, unknown>;
}

interface LoggerConfig {
  maxMemoryLogs?: number;
  logToFile?: boolean;
  logToDatabase?: boolean;
  logDir?: string;
  logLevel?: LogLevel;
}

export class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private config: Required<LoggerConfig>;
  private logFilePath: string = '';
  private writeStream: fs.WriteStream | null = null;

  private constructor(config: LoggerConfig = {}) {
    this.config = {
      maxMemoryLogs: config.maxMemoryLogs ?? 100,
      logToFile: config.logToFile ?? true,
      logToDatabase: config.logToDatabase ?? true,
      logDir: config.logDir ?? path.join(process.cwd(), 'logs'),
      logLevel: config.logLevel ?? LogLevel.DEBUG,
    };

    // 确保日志目录存在
    if (this.config.logToFile) {
      this.ensureLogDirectory();
      this.logFilePath = path.join(this.config.logDir, `app-${new Date().toISOString().split('T')[0]}.log`);
      this.initWriteStream();
    }
  }

  static getInstance(config?: LoggerConfig): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(config);
    }
    return Logger.instance;
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.config.logDir)) {
      fs.mkdirSync(this.config.logDir, { recursive: true });
    }
  }

  private initWriteStream(): void {
    try {
      this.writeStream = fs.createWriteStream(this.logFilePath, { flags: 'a' });
      this.writeStream.on('error', (err) => {
        console.error('日志写入流错误:', err);
      });
    } catch (error) {
      console.error('初始化日志写入流失败:', error);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];
    const configLevelIndex = levels.indexOf(this.config.logLevel);
    const currentLevelIndex = levels.indexOf(level);
    return currentLevelIndex >= configLevelIndex;
  }

  private async writeToDatabase(entry: LogEntry): Promise<void> {
    if (!this.config.logToDatabase) return;
    
    try {
      await prisma.monitorLog.create({
        data: {
          level: entry.level,
          message: entry.message,
          context: entry.context,
          metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
          createdAt: entry.timestamp,
        },
      });
    } catch (error) {
      // 数据库写入失败不阻塞主流程
      console.error('写入日志到数据库失败:', error);
    }
  }

  private log(level: LogLevel, message: string, context?: string, error?: Error, metadata?: Record<string, unknown>): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      error,
      metadata
    };

    // 内存中只保留最近的日志
    this.logs.push(entry);
    if (this.logs.length > this.config.maxMemoryLogs) {
      this.logs.shift();
    }

    // 写入文件
    if (this.config.logToFile && this.writeStream) {
      this.writeToFile(entry);
    }

    // 写入数据库
    if (this.config.logToDatabase) {
      this.writeToDatabase(entry);
    }

    // 控制台输出
    this.printLog(entry);
  }

  private writeToFile(entry: LogEntry): void {
    try {
      const logLine = this.formatLogEntry(entry);
      this.writeStream?.write(logLine + '\n');
    } catch (error) {
      console.error('写入日志文件失败:', error);
    }
  }

  private formatLogEntry(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const level = entry.level.toUpperCase();
    const context = entry.context ? `[${entry.context}]` : '';
    const errorMessage = entry.error ? ` | Error: ${entry.error.message}` : '';
    const metadata = entry.metadata ? ` | Metadata: ${JSON.stringify(entry.metadata)}` : '';

    return `${timestamp} [${level}] ${context} ${entry.message}${errorMessage}${metadata}`;
  }

  private printLog(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const level = entry.level.toUpperCase();
    const context = entry.context ? `[${entry.context}]` : '';
    const errorMessage = entry.error ? `\nError: ${entry.error.message}\n${entry.error.stack}` : '';
    const metadata = entry.metadata ? `\nMetadata: ${JSON.stringify(entry.metadata)}` : '';

    const logMessage = `${timestamp} [${level}] ${context} ${entry.message}${errorMessage}${metadata}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        if (process.env.NODE_ENV !== 'production') {
          console.debug(logMessage);
        }
        break;
      case LogLevel.INFO:
        console.info(logMessage);
        break;
      case LogLevel.WARN:
        console.warn(logMessage);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(logMessage);
        break;
    }
  }

  debug(message: string, context?: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context, undefined, metadata);
  }

  info(message: string, context?: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context, undefined, metadata);
  }

  warn(message: string, context?: string, error?: Error, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context, error, metadata);
  }

  error(message: string, context?: string, error?: Error, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, context, error, metadata);
  }

  fatal(message: string, context?: string, error?: Error, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.FATAL, message, context, error, metadata);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  close(): void {
    if (this.writeStream) {
      this.writeStream.end();
      this.writeStream = null;
    }
  }
}

export const logger = Logger.getInstance();
