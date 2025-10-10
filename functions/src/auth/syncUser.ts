import { Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import { db, auth } from '../config/firebase';

interface SyncUserRequest {
  email: string;
  password: string;
  uid?: string;
  makeAdmin?: boolean;
}

export const syncUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, uid, makeAdmin = true } = req.body as SyncUserRequest;

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    let firebaseUser;

    if (uid) {
      try {
        firebaseUser = await auth.getUser(uid);
      } catch (error) {
        res.status(404).json({ error: 'User not found in Firebase Auth' });
        return;
      }
    } else {
      try {
        firebaseUser = await auth.getUserByEmail(email);
      } catch (error) {
        res.status(404).json({
          error: 'User not found in Firebase Auth',
          message: 'Please provide the correct email or UID'
        });
        return;
      }
    }

    const usersRef = db.collection('users');
    const existingDoc = await usersRef.doc(firebaseUser.uid).get();

    const roles = makeAdmin ? ['admin', 'user'] : ['user'];

    let passwordHash = '';
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    } else if (existingDoc.exists && existingDoc.data()?.passwordHash) {
      passwordHash = existingDoc.data()!.passwordHash;
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
    } else {
      await usersRef.doc(firebaseUser.uid).update(userData);
    }

    if (makeAdmin) {
      await auth.setCustomUserClaims(firebaseUser.uid, {
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
  } catch (error) {
    console.error('Sync user error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
