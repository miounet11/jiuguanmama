"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsers = void 0;
const getUsers = async (req, res) => {
    try {
        res.status(501).json({ message: 'Not implemented yet' });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getUsers = getUsers;
//# sourceMappingURL=user.js.map