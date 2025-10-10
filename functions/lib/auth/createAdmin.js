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
exports.createAdmin = void 0;
const bcrypt = __importStar(require("bcryptjs"));
const firebase_1 = require("../config/firebase");
const createAdmin = async (req, res) => {
    try {
        const { email, password, displayName } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }
        if (password.length < 8) {
            res.status(400).json({ error: 'Password must be at least 8 characters long' });
            return;
        }
        const usersRef = firebase_1.db.collection('users');
        const existingUser = await usersRef.where('email', '==', email).limit(1).get();
        if (!existingUser.empty) {
            res.status(409).json({ error: 'User with this email already exists' });
            return;
        }
        let firebaseUser;
        try {
            firebaseUser = await firebase_1.auth.createUser({
                email,
                password,
                displayName: displayName || 'Admin',
            });
        }
        catch (firebaseError) {
            console.error('Firebase Auth error:', firebaseError);
            res.status(500).json({
                error: 'Failed to create Firebase user',
                message: firebaseError.message
            });
            return;
        }
        const passwordHash = await bcrypt.hash(password, 10);
        const userData = {
            email,
            passwordHash,
            displayName: displayName || 'Admin',
            roles: ['admin', 'user'],
            createdAt: new Date(),
            updatedAt: new Date(),
            firebaseUid: firebaseUser.uid,
        };
        await usersRef.doc(firebaseUser.uid).set(userData);
        await firebase_1.auth.setCustomUserClaims(firebaseUser.uid, {
            admin: true,
            roles: ['admin', 'user'],
        });
        res.status(201).json({
            success: true,
            user: {
                id: firebaseUser.uid,
                email: userData.email,
                displayName: userData.displayName,
                roles: userData.roles,
            },
        });
    }
    catch (error) {
        console.error('Create admin error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
exports.createAdmin = createAdmin;
//# sourceMappingURL=createAdmin.js.map