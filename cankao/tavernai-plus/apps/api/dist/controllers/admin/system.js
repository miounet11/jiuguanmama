"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSystemInfo = void 0;
const getSystemInfo = async (req, res) => {
    try {
        res.status(501).json({ message: 'Not implemented yet' });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getSystemInfo = getSystemInfo;
//# sourceMappingURL=system.js.map