import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
export declare class WebSocketServer {
    private io;
    private userSockets;
    private socketUsers;
    constructor(httpServer: HTTPServer);
    private initialize;
    private handleEvents;
    private addUserSocket;
    private removeUserSocket;
    sendToUser(userId: string, event: string, data: any): void;
    sendToSession(sessionId: string, event: string, data: any): void;
    broadcast(event: string, data: any): void;
    getIO(): SocketIOServer<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
    getOnlineUserCount(): number;
    isUserOnline(userId: string): boolean;
}
export default WebSocketServer;
//# sourceMappingURL=index.d.ts.map