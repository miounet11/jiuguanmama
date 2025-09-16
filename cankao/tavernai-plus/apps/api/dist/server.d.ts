import { Application } from 'express';
import { PrismaClient } from '@prisma/client';
import WebSocketServer from './websocket';
declare const app: Application;
export declare const prisma: PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
declare const wsServer: WebSocketServer;
export declare const io: import("socket.io").Server<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
export { wsServer };
export { app };
//# sourceMappingURL=server.d.ts.map