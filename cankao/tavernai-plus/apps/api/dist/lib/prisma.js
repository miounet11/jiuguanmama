"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const { PrismaClient } = require('../../node_modules/.prisma/client');
exports.prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
});
// 优雅关闭
process.on('beforeExit', async () => {
    await exports.prisma.$disconnect();
});
//# sourceMappingURL=prisma.js.map