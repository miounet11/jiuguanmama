import { Server } from 'socket.io'
import { createServer } from 'http'

// 创建Socket.IO实例，但先不设置服务器
let io: Server | null = null

export function initializeSocket(httpServer: any) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    }
  })

  // Socket.IO 连接处理
  io.on('connection', (socket) => {
    console.log(`🔌 用户连接: ${socket.id}`)

    // 加入聊天会话房间
    socket.on('join_session', (sessionId: string) => {
      socket.join(`session:${sessionId}`)
      console.log(`用户 ${socket.id} 加入会话 ${sessionId}`)
    })

    // 离开聊天会话房间
    socket.on('leave_session', (sessionId: string) => {
      socket.leave(`session:${sessionId}`)
      console.log(`用户 ${socket.id} 离开会话 ${sessionId}`)
    })

    // 用户断开连接
    socket.on('disconnect', () => {
      console.log(`🔌 用户断开连接: ${socket.id}`)
    })
  })

  return io
}

export function getSocket(): Server {
  if (!io) {
    throw new Error('Socket.IO has not been initialized. Call initializeSocket first.')
  }
  return io
}
