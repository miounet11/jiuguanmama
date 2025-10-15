import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
export declare function validateSchema(schema: ZodSchema): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare function validateQueryParams(schema: ZodSchema): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare function validateParams(schema: ZodSchema): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare function validateRequest(req: Request, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
//# sourceMappingURL=validation.d.ts.map