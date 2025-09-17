"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLogs = void 0;
const getLogs = async (req, res) => {
    try {
        res.status(501).json({ message: 'Not implemented yet' });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getLogs = getLogs;
//# sourceMappingURL=log.js.map