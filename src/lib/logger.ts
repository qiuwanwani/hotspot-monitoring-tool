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
  metadata?: Record<string, any>;
}

export class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private log(level: LogLevel, message: string, context?: string, error?: Error, metadata?: Record<string, any>) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      error,
      metadata
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    this.printLog(entry);
  }

  private printLog(entry: LogEntry) {
    const timestamp = entry.timestamp.toISOString();
    const level = entry.level.toUpperCase();
    const context = entry.context ? `[${entry.context}]` : '';
    const errorMessage = entry.error ? `
Error: ${entry.error.message}
${entry.error.stack}` : '';
    const metadata = entry.metadata ? `
Metadata: ${JSON.stringify(entry.metadata)}` : '';

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
        console.error(logMessage);
        break;
      case LogLevel.FATAL:
        console.error(logMessage);
        break;
    }
  }

  debug(message: string, context?: string, metadata?: Record<string, any>) {
    this.log(LogLevel.DEBUG, message, context, undefined, metadata);
  }

  info(message: string, context?: string, metadata?: Record<string, any>) {
    this.log(LogLevel.INFO, message, context, undefined, metadata);
  }

  warn(message: string, context?: string, error?: Error, metadata?: Record<string, any>) {
    this.log(LogLevel.WARN, message, context, error, metadata);
  }

  error(message: string, context?: string, error?: Error, metadata?: Record<string, any>) {
    this.log(LogLevel.ERROR, message, context, error, metadata);
  }

  fatal(message: string, context?: string, error?: Error, metadata?: Record<string, any>) {
    this.log(LogLevel.FATAL, message, context, error, metadata);
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }
}

export const logger = Logger.getInstance();