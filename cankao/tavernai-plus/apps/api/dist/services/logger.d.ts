export declare const logger: import("winston").Logger;
export declare const requestLogger: (req: any, res: any, next: any) => void;
export declare class ApiUsageLogger {
    static logApiCall(data: {
        userId?: string;
        endpoint: string;
        method: string;
        statusCode: number;
        responseTime: number;
        ip?: string;
        userAgent?: string;
    }): Promise<void>;
    static getUsageStats(timeframe?: 'hour' | 'day' | 'week' | 'month'): Promise<any>;
}
export declare class ErrorTracker {
    static trackError(error: Error, context?: any): Promise<void>;
    static createAlert(data: {
        type: 'error' | 'warning' | 'info';
        severity: 'low' | 'medium' | 'high' | 'critical';
        title: string;
        message: string;
        source?: string;
        metadata?: any;
    }): Promise<void>;
}
export default logger;
//# sourceMappingURL=logger.d.ts.map