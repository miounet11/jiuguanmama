"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStats = void 0;
const getStats = async (req, res) => {
    try {
        res.status(501).json({ message: 'Not implemented yet' });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getStats = getStats;
//# sourceMappingURL=stats.js.map