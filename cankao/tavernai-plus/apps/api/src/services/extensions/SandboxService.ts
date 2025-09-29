import { VM } from 'vm2';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';

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

export class SandboxService extends EventEmitter {
  private contexts: Map<string, SandboxContext> = new Map();
  private defaultOptions: SandboxOptions = {
    timeout: 5000, // 5 seconds
    memoryLimit: 64 * 1024 * 1024, // 64MB
    allowedModules: ['lodash', 'moment', 'uuid'],
    allowedGlobals: ['Buffer', 'console'],
    maxExecutionTime: 10000, // 10 seconds
    maxOutputSize: 1024 * 1024, // 1MB
    enableLogging: true
  };

  private stats: SandboxStats = {
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
  public async createContext(
    extensionId: string,
    options: Partial<SandboxOptions> = {}
  ): Promise<string> {
    try {
      const contextId = uuidv4();
      const mergedOptions = { ...this.defaultOptions, ...options };

      // Create VM with security restrictions
      const vm = new VM({
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

      const context: SandboxContext = {
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

      logger.info('Sandbox context created', {
        contextId,
        extensionId,
        options: mergedOptions
      });

      return contextId;
    } catch (error) {
      logger.error('Failed to create sandbox context', {
        extensionId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw new Error('Failed to create sandbox context');
    }
  }

  /**
   * Execute code in sandbox context
   */
  public async execute(
    contextId: string,
    code: string,
    args: Record<string, any> = {}
  ): Promise<SandboxExecutionResult> {
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

      logger.debug('Sandbox execution completed', {
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
    } catch (error) {
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

      logger.error('Sandbox execution failed', {
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
  public async loadExtension(
    contextId: string,
    extensionPath: string
  ): Promise<SandboxExecutionResult> {
    try {
      const mainFile = path.join(extensionPath, 'index.js');
      const code = await fs.readFile(mainFile, 'utf-8');

      return await this.execute(contextId, code);
    } catch (error) {
      logger.error('Failed to load extension', {
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
  public async callFunction(
    contextId: string,
    functionName: string,
    args: any[] = []
  ): Promise<SandboxExecutionResult> {
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
  public async destroyContext(contextId: string): Promise<boolean> {
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

      logger.info('Sandbox context destroyed', {
        contextId,
        extensionId: context.extensionId,
        lifetime: Date.now() - context.createdAt.getTime()
      });

      return true;
    } catch (error) {
      logger.error('Failed to destroy sandbox context', {
        contextId,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  /**
   * Get sandbox statistics
   */
  public getStats(): SandboxStats {
    return JSON.parse(JSON.stringify(this.stats));
  }

  /**
   * Get context information
   */
  public getContext(contextId: string): SandboxContext | null {
    const context = this.contexts.get(contextId);
    return context ? JSON.parse(JSON.stringify(context)) : null;
  }

  /**
   * List all active contexts
   */
  public getActiveContexts(): SandboxContext[] {
    return Array.from(this.contexts.values())
      .filter(ctx => ctx.isActive)
      .map(ctx => JSON.parse(JSON.stringify(ctx)));
  }

  /**
   * Kill all contexts for an extension
   */
  public async killExtensionContexts(extensionId: string): Promise<number> {
    let killedCount = 0;

    for (const [contextId, context] of this.contexts.entries()) {
      if (context.extensionId === extensionId && context.isActive) {
        await this.destroyContext(contextId);
        killedCount++;
      }
    }

    logger.info('Killed extension contexts', { extensionId, killedCount });
    return killedCount;
  }

  /**
   * Emergency stop all contexts
   */
  public async emergencyStop(): Promise<void> {
    logger.warn('Emergency stop initiated - destroying all sandbox contexts');

    for (const contextId of this.contexts.keys()) {
      await this.destroyContext(contextId);
    }

    this.contexts.clear();
    this.stats.activeContexts = 0;

    this.emit('emergencyStop');
  }

  // Private helper methods
  private createSecureSandbox(extensionId: string, options: SandboxOptions): Record<string, any> {
    const sandbox: Record<string, any> = {
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
      setTimeout: (fn: Function, delay: number) => {
        if (delay > 5000) delay = 5000; // Max 5 second delay
        return setTimeout(fn, delay);
      },
      setInterval: (fn: Function, delay: number) => {
        if (delay < 100) delay = 100; // Min 100ms interval
        return setInterval(fn, delay);
      },
      clearTimeout,
      clearInterval
    };

    // Add allowed globals
    for (const global of options.allowedGlobals) {
      if (global in globalThis) {
        sandbox[global] = (globalThis as any)[global];
      }
    }

    return sandbox;
  }

  private createSecureConsole(extensionId: string): Record<string, Function> {
    return {
      log: (...args: any[]) => {
        logger.info(`Extension ${extensionId}:`, ...args);
      },
      warn: (...args: any[]) => {
        logger.warn(`Extension ${extensionId}:`, ...args);
      },
      error: (...args: any[]) => {
        logger.error(`Extension ${extensionId}:`, ...args);
      },
      debug: (...args: any[]) => {
        logger.debug(`Extension ${extensionId}:`, ...args);
      }
    };
  }

  private createExtensionAPI(extensionId: string): Record<string, any> {
    return {
      id: extensionId,
      version: '1.0.0',

      // Storage API
      storage: {
        get: async (key: string) => {
          // Implement secure storage access
          return null;
        },
        set: async (key: string, value: any) => {
          // Implement secure storage write
          return true;
        },
        remove: async (key: string) => {
          // Implement secure storage removal
          return true;
        }
      },

      // Event API
      events: {
        on: (event: string, handler: Function) => {
          // Implement secure event subscription
        },
        emit: (event: string, data: any) => {
          // Implement secure event emission
        },
        off: (event: string, handler: Function) => {
          // Implement secure event unsubscription
        }
      },

      // HTTP API (restricted)
      http: {
        get: async (url: string) => {
          // Implement secure HTTP GET with whitelist
          throw new Error('HTTP access not implemented');
        },
        post: async (url: string, data: any) => {
          // Implement secure HTTP POST with whitelist
          throw new Error('HTTP access not implemented');
        }
      }
    };
  }

  private createMockModules(): Record<string, any> {
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

  private wrapCode(code: string, args: Record<string, any>): string {
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

  private async executeWithMonitoring(
    context: SandboxContext,
    code: string
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Execution timeout exceeded'));
      }, this.defaultOptions.maxExecutionTime);

      try {
        const result = context.vm.run(code);
        clearTimeout(timeout);
        resolve(result);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  private createSandboxError(error: any, extensionId: string): SandboxError {
    let type: SandboxError['type'] = 'runtime';
    let message = error instanceof Error ? error.message : String(error);

    // Classify error type
    if (message.includes('timeout')) {
      type = 'timeout';
    } else if (message.includes('memory')) {
      type = 'memory';
    } else if (message.includes('denied') || message.includes('not allowed')) {
      type = 'security';
    } else if (message.includes('permission')) {
      type = 'permission';
    }

    return {
      id: uuidv4(),
      timestamp: new Date(),
      type,
      message,
      stack: error instanceof Error ? error.stack : undefined,
      context: { extensionId }
    };
  }

  private calculateErrorRate(): number {
    if (this.stats.totalExecutions === 0) return 0;

    const totalErrors = Object.values(this.stats.byExtension)
      .reduce((sum, ext) => sum + ext.errors, 0);

    return totalErrors / this.stats.totalExecutions;
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupInactiveContexts();
    }, 60000); // Every minute
  }

  private cleanupInactiveContexts(): void {
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
      logger.info('Cleaned up inactive sandbox contexts', { count: cleanedCount });
    }
  }

  /**
   * Shutdown the sandbox service
   */
  public async shutdown(): Promise<void> {
    logger.info('Shutting down sandbox service');
    await this.emergencyStop();
    this.removeAllListeners();
  }
}

// Singleton instance
export const sandboxService = new SandboxService();

// Graceful shutdown
process.on('SIGTERM', () => {
  sandboxService.shutdown();
});

process.on('SIGINT', () => {
  sandboxService.shutdown();
});