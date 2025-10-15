import { VM } from 'vm2';
import { EventEmitter } from 'events';
export interface SandboxOptions {
    timeout: number;
    memoryLimit: number;
    allowedModules: string[];
    allowedGlobals: string[];
    maxExecutionTime: number;
    maxOutputSize: number;
    enableLogging: boolean;
}
export interface SandboxContext {
    id: string;
    extensionId: string;
    vm: VM;
    isActive: boolean;
    createdAt: Date;
    lastActivity: Date;
    executionCount: number;
    memoryUsage: number;
    cpuTime: number;
    errors: SandboxError[];
}
export interface SandboxError {
    id: string;
    timestamp: Date;
    type: 'timeout' | 'memory' | 'security' | 'runtime' | 'permission';
    message: string;
    stack?: string;
    context: Record<string, any>;
}
export interface SandboxExecutionResult {
    success: boolean;
    result?: any;
    error?: SandboxError;
    executionTime: number;
    memoryUsed: number;
    outputSize: number;
}
export interface SandboxStats {
    totalContexts: number;
    activeContexts: number;
    totalExecutions: number;
    averageExecutionTime: number;
    memoryUsage: number;
    errorRate: number;
    byExtension: Record<string, {
        executions: number;
        errors: number;
        avgTime: number;
        memoryUsage: number;
    }>;
}
export declare class SandboxService extends EventEmitter {
    private contexts;
    private defaultOptions;
    private stats;
    constructor();
    /**
     * Create a new sandbox context for an extension
     */
    createContext(extensionId: string, options?: Partial<SandboxOptions>): Promise<string>;
    /**
     * Execute code in sandbox context
     */
    execute(contextId: string, code: string, args?: Record<string, any>): Promise<SandboxExecutionResult>;
    /**
     * Load and execute extension script
     */
    loadExtension(contextId: string, extensionPath: string): Promise<SandboxExecutionResult>;
    /**
     * Call extension function
     */
    callFunction(contextId: string, functionName: string, args?: any[]): Promise<SandboxExecutionResult>;
    /**
     * Destroy sandbox context
     */
    destroyContext(contextId: string): Promise<boolean>;
    /**
     * Get sandbox statistics
     */
    getStats(): SandboxStats;
    /**
     * Get context information
     */
    getContext(contextId: string): SandboxContext | null;
    /**
     * List all active contexts
     */
    getActiveContexts(): SandboxContext[];
    /**
     * Kill all contexts for an extension
     */
    killExtensionContexts(extensionId: string): Promise<number>;
    /**
     * Emergency stop all contexts
     */
    emergencyStop(): Promise<void>;
    private createSecureSandbox;
    private createSecureConsole;
    private createExtensionAPI;
    private createMockModules;
    private wrapCode;
    private executeWithMonitoring;
    private createSandboxError;
    private calculateErrorRate;
    private startCleanupInterval;
    private cleanupInactiveContexts;
    /**
     * Shutdown the sandbox service
     */
    shutdown(): Promise<void>;
}
export declare const sandboxService: SandboxService;
//# sourceMappingURL=SandboxService.d.ts.map