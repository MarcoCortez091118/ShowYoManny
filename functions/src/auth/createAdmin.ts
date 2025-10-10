import { Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import { db, auth } from '../config/firebase';

interface CreateAdminRequest {
  email: string;
  password: string;
  displayName?: string;
}

export const createAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, displayName } = req.body as CreateAdminRequest;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long' });
      return;
    }

    const usersRef = db.collection('users');
    const existingUser = await usersRef.where('email', '==', email).limit(1).get();

    if (!existingUser.empty) {
      res.status(409).json({ error: 'User with this email already exists' });
      return;
    }

    let firebaseUser;
    try {
      firebaseUser = await auth.createUser({
        email,
        password,
        displayName: displayName || 'Admin',
      });
    } catch (firebaseError: any) {
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

    await auth.setCustomUserClaims(firebaseUser.uid, {
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
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
