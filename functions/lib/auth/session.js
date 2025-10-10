"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSession = void 0;
const firebase_1 = require("../config/firebase");
const getSession = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        const userDoc = await firebase_1.db.collection('users').doc(req.user.uid).get();
        if (!userDoc.exists) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        const userData = userDoc.data();
        res.status(200).json({
            id: userDoc.id,
            email: userData?.email,
            displayName: userData?.displayName || null,
            roles: userData?.roles || ['user'],
        });
    }
    catch (error) {
        console.error('Session error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getSession = getSession;
//# sourceMappingURL=session.js.map