"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sandboxService = exports.SandboxService = void 0;
const vm2_1 = require("vm2");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const events_1 = require("events");
const logger_1 = require("../../utils/logger");
class SandboxService extends events_1.EventEmitter {
    contexts = new Map();
    defaultOptions = {
        timeout: 5000, // 5 seconds
        memoryLimit: 64 * 1024 * 1024, // 64MB
        allowedModules: ['lodash', 'moment', 'uuid'],
        allowedGlobals: ['Buffer', 'console'],
        maxExecutionTime: 10000, // 10 seconds
        maxOutputSize: 1024 * 1024, // 1MB
        enableLogging: true
    };
    stats = {
        totalContexts: 0,
        activeContexts: 0,
        totalExecutions: 0,
        averageExecutionTime: 0,
        memoryUsage: 0,
        errorRate: 0,
        byExtension: {}
    };
    constructor() {
        super();
        this.startCleanupInterval();
    }
    /**
     * Create a new sandbox context for an extension
     */
    async createContext(extensionId, options = {}) {
        try {
            const contextId = (0, uuid_1.v4)();
            const mergedOptions = { ...this.defaultOptions, ...options };
            // Create VM with security restrictions
            const vm = new vm2_1.VM({
                timeout: mergedOptions.timeout,
                sandbox: this.createSecureSandbox(extensionId, mergedOptions),
                require: {
                    external: mergedOptions.allowedModules,
                    builtin: [],
                    root: process.cwd(),
                    mock: this.createMockModules()
                },
                wasm: false,
                eval: false
            });
            const context = {
                id: contextId,
                extensionId,
                vm,
                isActive: true,
                createdAt: new Date(),
                lastActivity: new Date(),
                executionCount: 0,
                memoryUsage: 0,
                cpuTime: 0,
                errors: []
            };
            this.contexts.set(contextId, context);
            this.stats.totalContexts++;
            this.stats.activeContexts++;
            // Initialize extension stats
            if (!this.stats.byExtension[extensionId]) {
                this.stats.byExtension[extensionId] = {
                    executions: 0,
                    errors: 0,
                    avgTime: 0,
                    memoryUsage: 0
                };
            }
            this.emit('contextCreated', { contextId, extensionId });
            logger_1.logger.info('Sandbox context created', {
                contextId,
                extensionId,
                options: mergedOptions
            });
            return contextId;
        }
        catch (error) {
            logger_1.logger.error('Failed to create sandbox context', {
                extensionId,
                error: error instanceof Error ? error.message : String(error)
            });
            throw new Error('Failed to create sandbox context');
        }
    }
    /**
     * Execute code in sandbox context
     */
    async execute(contextId, code, args = {}) {
        const startTime = Date.now();
        const context = this.contexts.get(contextId);
        if (!context || !context.isActive) {
            throw new Error(`Sandbox context ${contextId} not found or inactive`);
        }
        try {
            // Update activity
            context.lastActivity = new Date();
            context.executionCount++;
            this.stats.totalExecutions++;
            this.stats.byExtension[context.extensionId].executions++;
            // Memory check before execution
            const initialMemory = process.memoryUsage().heapUsed;
            // Prepare execution environment
            const wrappedCode = this.wrapCode(code, args);
            // Execute with timeout and memory monitoring
            const result = await this.executeWithMonitoring(context, wrappedCode);
            // Calculate metrics
            const executionTime = Date.now() - startTime;
            const memoryUsed = process.memoryUsage().heapUsed - initialMemory;
            const outputSize = JSON.stringify(result).length;
            // Update stats
            context.memoryUsage += memoryUsed;
            context.cpuTime += executionTime;
            const extStats = this.stats.byExtension[context.extensionId];
            extStats.avgTime = (extStats.avgTime * (extStats.executions - 1) + executionTime) / extStats.executions;
            extStats.memoryUsage += memoryUsed;
            this.stats.averageExecutionTime = (this.stats.averageExecutionTime * (this.stats.totalExecutions - 1) + executionTime) / this.stats.totalExecutions;
            this.stats.memoryUsage += memoryUsed;
            // Validate output size
            if (outputSize > this.defaultOptions.maxOutputSize) {
                throw new Error(`Output size ${outputSize} exceeds limit ${this.defaultOptions.maxOutputSize}`);
            }
            this.emit('executionCompleted', {
                contextId,
                extensionId: context.extensionId,
                executionTime,
                memoryUsed,
                outputSize
            });
            logger_1.logger.debug('Sandbox execution completed', {
                contextId,
                extensionId: context.extensionId,
                executionTime,
                memoryUsed,
                outputSize
            });
            return {
                success: true,
                result,
                executionTime,
                memoryUsed,
                outputSize
            };
        }
        catch (error) {
            const executionTime = Date.now() - startTime;
            const sandboxError = this.createSandboxError(error, context.extensionId);
            context.errors.push(sandboxError);
            this.stats.byExtension[context.extensionId].errors++;
            this.stats.errorRate = this.calculateErrorRate();
            this.emit('executionError', {
                contextId,
                extensionId: context.extensionId,
                error: sandboxError
            });
            logger_1.logger.error('Sandbox execution failed', {
                contextId,
                extensionId: context.extensionId,
                error: sandboxError.message,
                executionTime
            });
            return {
                success: false,
                error: sandboxError,
                executionTime,
                memoryUsed: 0,
                outputSize: 0
            };
        }
    }
    /**
     * Load and execute extension script
     */
    async loadExtension(contextId, extensionPath) {
        try {
            const mainFile = path_1.default.join(extensionPath, 'index.js');
            const code = await promises_1.default.readFile(mainFile, 'utf-8');
            return await this.execute(contextId, code);
        }
        catch (error) {
            logger_1.logger.error('Failed to load extension', {
                contextId,
                extensionPath,
                error: error instanceof Error ? error.message : String(error)
            });
            throw error;
        }
    }
    /**
     * Call extension function
     */
    async callFunction(contextId, functionName, args = []) {
        const code = `
      if (typeof ${functionName} === 'function') {
        return ${functionName}(...arguments[0]);
      } else {
        throw new Error('Function ${functionName} not found or not callable');
      }
    `;
        return await this.execute(contextId, code, { arguments: [args] });
    }
    /**
     * Destroy sandbox context
     */
    async destroyContext(contextId) {
        try {
            const context = this.contexts.get(contextId);
            if (!context) {
                return false;
            }
            context.isActive = false;
            this.contexts.delete(contextId);
            this.stats.activeContexts--;
            this.emit('contextDestroyed', {
                contextId,
                extensionId: context.extensionId,
                executionCount: context.executionCount,
                totalMemoryUsage: context.memoryUsage,
                totalCpuTime: context.cpuTime,
                errorCount: context.errors.length
            });
            logger_1.logger.info('Sandbox context destroyed', {
                contextId,
                extensionId: context.extensionId,
                lifetime: Date.now() - context.createdAt.getTime()
            });
            return true;
        }
        catch (error) {
            logger_1.logger.error('Failed to destroy sandbox context', {
                contextId,
                error: error instanceof Error ? error.message : String(error)
            });
            return false;
        }
    }
    /**
     * Get sandbox statistics
     */
    getStats() {
        return JSON.parse(JSON.stringify(this.stats));
    }
    /**
     * Get context information
     */
    getContext(contextId) {
        const context = this.contexts.get(contextId);
        return context ? JSON.parse(JSON.stringify(context)) : null;
    }
    /**
     * List all active contexts
     */
    getActiveContexts() {
        return Array.from(this.contexts.values())
            .filter(ctx => ctx.isActive)
            .map(ctx => JSON.parse(JSON.stringify(ctx)));
    }
    /**
     * Kill all contexts for an extension
     */
    async killExtensionContexts(extensionId) {
        let killedCount = 0;
        for (const [contextId, context] of this.contexts.entries()) {
            if (context.extensionId === extensionId && context.isActive) {
                await this.destroyContext(contextId);
                killedCount++;
            }
        }
        logger_1.logger.info('Killed extension contexts', { extensionId, killedCount });
        return killedCount;
    }
    /**
     * Emergency stop all contexts
     */
    async emergencyStop() {
        logger_1.logger.warn('Emergency stop initiated - destroying all sandbox contexts');
        for (const contextId of this.contexts.keys()) {
            await this.destroyContext(contextId);
        }
        this.contexts.clear();
        this.stats.activeContexts = 0;
        this.emit('emergencyStop');
    }
    // Private helper methods
    createSecureSandbox(extensionId, options) {
        const sandbox = {
            // Safe globals
            Object,
            Array,
            String,
            Number,
            Boolean,
            Date,
            Math,
            JSON,
            RegExp,
            Error,
            TypeError,
            RangeError,
            parseInt,
            parseFloat,
            isNaN,
            isFinite,
            encodeURIComponent,
            decodeURIComponent,
            // Limited console
            console: this.createSecureConsole(extensionId),
            // Extension API
            extension: this.createExtensionAPI(extensionId),
            // Utility functions
            setTimeout: (fn, delay) => {
                if (delay > 5000)
                    delay = 5000; // Max 5 second delay
                return setTimeout(fn, delay);
            },
            setInterval: (fn, delay) => {
                if (delay < 100)
                    delay = 100; // Min 100ms interval
                return setInterval(fn, delay);
            },
            clearTimeout,
            clearInterval
        };
        // Add allowed globals
        for (const global of options.allowedGlobals) {
            if (global in globalThis) {
                sandbox[global] = globalThis[global];
            }
        }
        return sandbox;
    }
    createSecureConsole(extensionId) {
        return {
            log: (...args) => {
                logger_1.logger.info(`Extension ${extensionId}:`, ...args);
            },
            warn: (...args) => {
                logger_1.logger.warn(`Extension ${extensionId}:`, ...args);
            },
            error: (...args) => {
                logger_1.logger.error(`Extension ${extensionId}:`, ...args);
            },
            debug: (...args) => {
                logger_1.logger.debug(`Extension ${extensionId}:`, ...args);
            }
        };
    }
    createExtensionAPI(extensionId) {
        return {
            id: extensionId,
            version: '1.0.0',
            // Storage API
            storage: {
                get: async (key) => {
                    // Implement secure storage access
                    return null;
                },
                set: async (key, value) => {
                    // Implement secure storage write
                    return true;
                },
                remove: async (key) => {
                    // Implement secure storage removal
                    return true;
                }
            },
            // Event API
            events: {
                on: (event, handler) => {
                    // Implement secure event subscription
                },
                emit: (event, data) => {
                    // Implement secure event emission
                },
                off: (event, handler) => {
                    // Implement secure event unsubscription
                }
            },
            // HTTP API (restricted)
            http: {
                get: async (url) => {
                    // Implement secure HTTP GET with whitelist
                    throw new Error('HTTP access not implemented');
                },
                post: async (url, data) => {
                    // Implement secure HTTP POST with whitelist
                    throw new Error('HTTP access not implemented');
                }
            }
        };
    }
    createMockModules() {
        return {
            'fs': {
                readFile: () => { throw new Error('File system access denied'); },
                writeFile: () => { throw new Error('File system access denied'); }
            },
            'child_process': {
                exec: () => { throw new Error('Process execution denied'); },
                spawn: () => { throw new Error('Process execution denied'); }
            },
            'net': {
                createServer: () => { throw new Error('Network server creation denied'); }
            },
            'http': {
                createServer: () => { throw new Error('HTTP server creation denied'); }
            }
        };
    }
    wrapCode(code, args) {
        const argsString = Object.entries(args)
            .map(([key, value]) => `const ${key} = ${JSON.stringify(value)};`)
            .join('\n');
        return `
      ${argsString}

      (function() {
        'use strict';
        ${code}
      })();
    `;
    }
    async executeWithMonitoring(context, code) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Execution timeout exceeded'));
            }, this.defaultOptions.maxExecutionTime);
            try {
                const result = context.vm.run(code);
                clearTimeout(timeout);
                resolve(result);
            }
            catch (error) {
                clearTimeout(timeout);
                reject(error);
            }
        });
    }
    createSandboxError(error, extensionId) {
        let type = 'runtime';
        let message = error instanceof Error ? error.message : String(error);
        // Classify error type
        if (message.includes('timeout')) {
            type = 'timeout';
        }
        else if (message.includes('memory')) {
            type = 'memory';
        }
        else if (message.includes('denied') || message.includes('not allowed')) {
            type = 'security';
        }
        else if (message.includes('permission')) {
            type = 'permission';
        }
        return {
            id: (0, uuid_1.v4)(),
            timestamp: new Date(),
            type,
            message,
            stack: error instanceof Error ? error.stack : undefined,
            context: { extensionId }
        };
    }
    calculateErrorRate() {
        if (this.stats.totalExecutions === 0)
            return 0;
        const totalErrors = Object.values(this.stats.byExtension)
            .reduce((sum, ext) => sum + ext.errors, 0);
        return totalErrors / this.stats.totalExecutions;
    }
    startCleanupInterval() {
        setInterval(() => {
            this.cleanupInactiveContexts();
        }, 60000); // Every minute
    }
    cleanupInactiveContexts() {
        const now = Date.now();
        const maxIdleTime = 30 * 60 * 1000; // 30 minutes
        let cleanedCount = 0;
        for (const [contextId, context] of this.contexts.entries()) {
            if (context.isActive &&
                now - context.lastActivity.getTime() > maxIdleTime) {
                this.destroyContext(contextId);
                cleanedCount++;
            }
        }
        if (cleanedCount > 0) {
            logger_1.logger.info('Cleaned up inactive sandbox contexts', { count: cleanedCount });
        }
    }
    /**
     * Shutdown the sandbox service
     */
    async shutdown() {
        logger_1.logger.info('Shutting down sandbox service');
        await this.emergencyStop();
        this.removeAllListeners();
    }
}
exports.SandboxService = SandboxService;
// Singleton instance
exports.sandboxService = new SandboxService();
// Graceful shutdown
process.on('SIGTERM', () => {
    exports.sandboxService.shutdown();
});
process.on('SIGINT', () => {
    exports.sandboxService.shutdown();
});
//# sourceMappingURL=SandboxService.js.map