interface ErrorLog {
    timestamp: string;
    level: 'ERROR' | 'WARN' | 'INFO';
    endpoint?: string;
    method?: string;
    statusCode?: number;
    message: string;
    userId?: string;
    ip?: string;
    userAgent?: string;
    stack?: string;
}
declare class ErrorLogger {
    private logFile;
    private currentDate;
    constructor();
    private checkDateAndRotate;
    private formatLog;
    log(log: Partial<ErrorLog>): void;
    error(message: string, details?: any): void;
    warn(message: string, details?: any): void;
    info(message: string, details?: any): void;
    getRecentLogs(lines?: number): string[];
    cleanOldLogs(): void;
}
export declare const errorLogger: ErrorLogger;
export default errorLogger;
//# sourceMappingURL=errorLogger.d.ts.map