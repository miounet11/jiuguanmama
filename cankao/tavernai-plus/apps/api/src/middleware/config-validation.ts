import { Request, Response, NextFunction } from 'express';
import { advancedConfigService } from '../services/config/AdvancedConfigService';
import { sillyTavernService } from '../services/config/SillyTavernService';
import { logger } from '../utils/logger';

export interface ConfigRequest extends Request {
  config?: {
    isValid: boolean;
    errors: Array<{ path: string; message: string; value: any }>;
    warnings: string[];
  };
}

/**
 * Middleware to validate configuration structure
 */
export const validateConfigStructure = async (
  req: ConfigRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { config } = req.body;

    if (!config || typeof config !== 'object') {
      return res.status(400).json({
        error: 'Invalid configuration format',
        code: 'INVALID_CONFIG_FORMAT'
      });
    }

    // Validate configuration against schema
    const validation = await advancedConfigService.validateConfig(config);

    // Add validation results to request
    req.config = {
      isValid: validation.valid,
      errors: validation.errors,
      warnings: []
    };

    // If validation fails, return early
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Configuration validation failed',
        code: 'CONFIG_VALIDATION_FAILED',
        details: validation.errors
      });
    }

    next();
  } catch (error) {
    logger.error('Config structure validation failed', {
      userId: req.user?.id,
      error: error instanceof Error ? error.message : String(error)
    });

    res.status(500).json({
      error: 'Configuration validation error',
      code: 'CONFIG_VALIDATION_ERROR'
    });
  }
};

/**
 * Middleware to validate template variables
 */
export const validateTemplateVariables = async (
  req: ConfigRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { templateId, variables } = req.body;

    if (!templateId) {
      return next(); // Skip if no template
    }

    const template = await advancedConfigService.getTemplate(templateId);

    if (!template) {
      return res.status(404).json({
        error: 'Template not found',
        code: 'TEMPLATE_NOT_FOUND'
      });
    }

    // Validate required variables
    const requiredVariables = template.variables.filter(v => v.required);
    const missingVariables = requiredVariables.filter(v =>
      !variables || variables[v.name] === undefined
    );

    if (missingVariables.length > 0) {
      return res.status(400).json({
        error: 'Missing required template variables',
        code: 'MISSING_TEMPLATE_VARIABLES',
        missingVariables: missingVariables.map(v => v.name),
        requiredVariables: requiredVariables.map(v => ({
          name: v.name,
          type: v.type,
          description: v.description
        }))
      });
    }

    // Validate variable types
    const typeErrors: string[] = [];
    if (variables) {
      for (const variable of template.variables) {
        const value = variables[variable.name];
        if (value !== undefined) {
          const expectedType = variable.type;
          const actualType = typeof value;

          if (expectedType === 'number' && actualType !== 'number') {
            typeErrors.push(`Variable '${variable.name}' must be a number, got ${actualType}`);
          } else if (expectedType === 'boolean' && actualType !== 'boolean') {
            typeErrors.push(`Variable '${variable.name}' must be a boolean, got ${actualType}`);
          } else if (expectedType === 'string' && actualType !== 'string') {
            typeErrors.push(`Variable '${variable.name}' must be a string, got ${actualType}`);
          }
        }
      }
    }

    if (typeErrors.length > 0) {
      return res.status(400).json({
        error: 'Template variable type validation failed',
        code: 'TEMPLATE_VARIABLE_TYPE_ERROR',
        typeErrors
      });
    }

    next();
  } catch (error) {
    logger.error('Template variable validation failed', {
      templateId: req.body.templateId,
      userId: req.user?.id,
      error: error instanceof Error ? error.message : String(error)
    });

    res.status(500).json({
      error: 'Template validation error',
      code: 'TEMPLATE_VALIDATION_ERROR'
    });
  }
};

/**
 * Middleware to validate SillyTavern import
 */
export const validateSillyTavernImport = async (
  req: ConfigRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { config } = req.body;

    if (!config) {
      return res.status(400).json({
        error: 'SillyTavern configuration is required',
        code: 'MISSING_SILLYTAVERN_CONFIG'
      });
    }

    // Check compatibility
    const compatibility = await sillyTavernService.checkCompatibility(config);

    if (!compatibility.compatible) {
      const warnings = [
        ...compatibility.missingFeatures,
        ...compatibility.deprecatedSettings.map(s => `Deprecated setting: ${s}`)
      ];

      // Add warnings to request context
      if (!req.config) {
        req.config = { isValid: true, errors: [], warnings: [] };
      }
      req.config.warnings = warnings;

      // Log compatibility issues
      logger.warn('SillyTavern compatibility issues detected', {
        userId: req.user?.id,
        missingFeatures: compatibility.missingFeatures,
        deprecatedSettings: compatibility.deprecatedSettings,
        migrationRequired: compatibility.migrationRequired
      });
    }

    next();
  } catch (error) {
    logger.error('SillyTavern import validation failed', {
      userId: req.user?.id,
      error: error instanceof Error ? error.message : String(error)
    });

    res.status(500).json({
      error: 'SillyTavern validation error',
      code: 'SILLYTAVERN_VALIDATION_ERROR'
    });
  }
};

/**
 * Middleware to validate configuration security
 */
export const validateConfigSecurity = (
  req: ConfigRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { config } = req.body;

    if (!config) {
      return next();
    }

    const securityIssues: string[] = [];
    const warnings: string[] = [];

    // Check for potential security issues
    const configString = JSON.stringify(config);

    // Check for hardcoded secrets
    const secretPatterns = [
      /sk-[a-zA-Z0-9]{48}/g, // OpenAI API keys
      /sk-ant-[a-zA-Z0-9-_]{95}/g, // Anthropic API keys
      /xoxb-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24}/g, // Slack tokens
      /ghp_[a-zA-Z0-9]{36}/g, // GitHub tokens
      /AKIA[0-9A-Z]{16}/g, // AWS access keys
    ];

    for (const pattern of secretPatterns) {
      if (pattern.test(configString)) {
        securityIssues.push('Potential API key or token detected in configuration');
        break;
      }
    }

    // Check for suspicious URLs
    const urlPattern = /https?:\/\/[^\s"']+/g;
    const urls = configString.match(urlPattern) || [];

    for (const url of urls) {
      // Check for localhost or private IP ranges
      if (url.includes('localhost') ||
          url.includes('127.0.0.1') ||
          url.includes('192.168.') ||
          url.includes('10.0.') ||
          url.includes('172.16.')) {
        warnings.push(`Private/localhost URL detected: ${url}`);
      }

      // Check for suspicious domains
      const suspiciousDomains = ['bit.ly', 'tinyurl.com', 'pastebin.com'];
      if (suspiciousDomains.some(domain => url.includes(domain))) {
        warnings.push(`Potentially suspicious URL detected: ${url}`);
      }
    }

    // Check for script injection attempts
    const scriptPatterns = [
      /<script[^>]*>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi, // Event handlers like onclick=
      /eval\s*\(/gi,
      /Function\s*\(/gi
    ];

    for (const pattern of scriptPatterns) {
      if (pattern.test(configString)) {
        securityIssues.push('Potential script injection detected in configuration');
        break;
      }
    }

    // If security issues found, block the request
    if (securityIssues.length > 0) {
      logger.error('Configuration security validation failed', {
        userId: req.user?.id,
        securityIssues,
        ip: req.ip
      });

      return res.status(400).json({
        error: 'Configuration contains potential security issues',
        code: 'CONFIG_SECURITY_VIOLATION',
        issues: securityIssues
      });
    }

    // Add warnings to request context
    if (warnings.length > 0) {
      if (!req.config) {
        req.config = { isValid: true, errors: [], warnings: [] };
      }
      req.config.warnings.push(...warnings);

      logger.warn('Configuration security warnings', {
        userId: req.user?.id,
        warnings
      });
    }

    next();
  } catch (error) {
    logger.error('Config security validation failed', {
      userId: req.user?.id,
      error: error instanceof Error ? error.message : String(error)
    });

    res.status(500).json({
      error: 'Security validation error',
      code: 'SECURITY_VALIDATION_ERROR'
    });
  }
};

/**
 * Middleware to validate configuration size limits
 */
export const validateConfigSize = (
  maxSize: number = 1024 * 1024 // 1MB default
) => {
  return (req: ConfigRequest, res: Response, next: NextFunction) => {
    try {
      const { config } = req.body;

      if (!config) {
        return next();
      }

      const configSize = JSON.stringify(config).length;

      if (configSize > maxSize) {
        return res.status(413).json({
          error: `Configuration too large. Maximum size is ${maxSize / 1024}KB`,
          code: 'CONFIG_TOO_LARGE',
          currentSize: configSize,
          maxSize
        });
      }

      // Warn if approaching limit
      if (configSize > maxSize * 0.8) {
        if (!req.config) {
          req.config = { isValid: true, errors: [], warnings: [] };
        }
        req.config.warnings.push(
          `Configuration size (${Math.round(configSize / 1024)}KB) is approaching the limit (${Math.round(maxSize / 1024)}KB)`
        );
      }

      next();
    } catch (error) {
      logger.error('Config size validation failed', {
        userId: req.user?.id,
        error: error instanceof Error ? error.message : String(error)
      });

      res.status(500).json({
        error: 'Size validation error',
        code: 'SIZE_VALIDATION_ERROR'
      });
    }
  };
};

/**
 * Middleware to sanitize configuration input
 */
export const sanitizeConfig = (
  req: ConfigRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { config } = req.body;

    if (!config || typeof config !== 'object') {
      return next();
    }

    // Recursively sanitize strings in configuration
    const sanitizeValue = (value: any): any => {
      if (typeof value === 'string') {
        // Remove potential HTML/script tags
        return value
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<[^>]*>/g, '')
          .replace(/javascript:/gi, '')
          .trim();
      } else if (Array.isArray(value)) {
        return value.map(sanitizeValue);
      } else if (value && typeof value === 'object') {
        const sanitized: any = {};
        for (const [key, val] of Object.entries(value)) {
          // Sanitize key names
          const sanitizedKey = key.replace(/[<>'"]/g, '');
          sanitized[sanitizedKey] = sanitizeValue(val);
        }
        return sanitized;
      }
      return value;
    };

    req.body.config = sanitizeValue(config);
    next();
  } catch (error) {
    logger.error('Config sanitization failed', {
      userId: req.user?.id,
      error: error instanceof Error ? error.message : String(error)
    });

    res.status(500).json({
      error: 'Configuration sanitization error',
      code: 'CONFIG_SANITIZATION_ERROR'
    });
  }
};

/**
 * Composite middleware for configuration validation
 */
export const configValidationMiddleware = [
  validateConfigSize(),
  sanitizeConfig,
  validateConfigSecurity,
  validateConfigStructure
];

/**
 * Composite middleware for template validation
 */
export const templateValidationMiddleware = [
  validateTemplateVariables
];

/**
 * Composite middleware for SillyTavern import validation
 */
export const sillyTavernValidationMiddleware = [
  validateConfigSize(2 * 1024 * 1024), // 2MB for SillyTavern imports
  sanitizeConfig,
  validateConfigSecurity,
  validateSillyTavernImport
];