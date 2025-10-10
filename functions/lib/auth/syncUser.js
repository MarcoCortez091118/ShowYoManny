"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncUser = void 0;
const bcrypt = __importStar(require("bcryptjs"));
const firebase_1 = require("../config/firebase");
const syncUser = async (req, res) => {
    try {
        const { email, password, uid, makeAdmin = true } = req.body;
        if (!email) {
            res.status(400).json({ error: 'Email is required' });
            return;
        }
        let firebaseUser;
        if (uid) {
            try {
                firebaseUser = await firebase_1.auth.getUser(uid);
            }
            catch (error) {
                res.status(404).json({ error: 'User not found in Firebase Auth' });
                return;
            }
        }
        else {
            try {
                firebaseUser = await firebase_1.auth.getUserByEmail(email);
            }
            catch (error) {
                res.status(404).json({
                    error: 'User not found in Firebase Auth',
                    message: 'Please provide the correct email or UID'
                });
                return;
            }
        }
        const usersRef = firebase_1.db.collection('users');
        const existingDoc = await usersRef.doc(firebaseUser.uid).get();
        const roles = makeAdmin ? ['admin', 'user'] : ['user'];
        let passwordHash = '';
        if (password) {
            passwordHash = await bcrypt.hash(password, 10);
        }
        else if (existingDoc.exists && existingDoc.data()?.passwordHash) {
            passwordHash = existingDoc.data().passwordHash;
        }
        const userData = {
            email: firebaseUser.email || email,
            displayName: firebaseUser.displayName || 'Admin',
            roles,
            firebaseUid: firebaseUser.uid,
            updatedAt: new Date(),
            ...(passwordHash && { passwordHash }),
        };
        if (!existingDoc.exists) {
            await usersRef.doc(firebaseUser.uid).set({
                ...userData,
                createdAt: new Date(),
            });
        }
        else {
            await usersRef.doc(firebaseUser.uid).update(userData);
        }
        if (makeAdmin) {
            await firebase_1.auth.setCustomUserClaims(firebaseUser.uid, {
                admin: true,
                roles: ['admin', 'user'],
            });
        }
        res.status(200).json({
            success: true,
            message: existingDoc.exists ? 'User updated successfully' : 'User synced successfully',
            user: {
                id: firebaseUser.uid,
                email: userData.email,
                displayName: userData.displayName,
                roles: userData.roles,
            },
        });
    }
    catch (error) {
        console.error('Sync user error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.syncUser = syncUser;
//# sourceMappingURL=syncUser.js.map