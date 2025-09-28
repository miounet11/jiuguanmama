"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getModels = void 0;
const getModels = async (req, res) => {
    try {
        res.status(501).json({ message: 'Not implemented yet' });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getModels = getModels;
//# sourceMappingURL=model.js.map