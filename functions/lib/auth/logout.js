"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = void 0;
const firebase_1 = require("../config/firebase");
const logout = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        await firebase_1.db.collection('users').doc(req.user.uid).update({
            lastLogoutAt: new Date(),
        });
        res.status(200).json({ success: true, message: 'Logged out successfully' });
    }
    catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.logout = logout;
//# sourceMappingURL=logout.js.map