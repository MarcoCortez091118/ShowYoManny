import { Request, Response } from 'express';
import * as bcrypt from 'bcryptjs';
import { db } from '../config/firebase';
import { generateToken } from '../config/jwt';

interface LoginRequest {
  email: string;
  password: string;
}

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as LoginRequest;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).limit(1).get();

    if (snapshot.empty) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    const passwordMatch = await bcrypt.compare(password, userData.passwordHash);

    if (!passwordMatch) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = generateToken({
      uid: userDoc.id,
      email: userData.email,
      roles: userData.roles || ['user'],
    });

    await usersRef.doc(userDoc.id).update({
      lastLoginAt: new Date(),
    });

    res.status(200).json({
      token,
      user: {
        id: userDoc.id,
        email: userData.email,
        displayName: userData.displayName || null,
        roles: userData.roles || ['user'],
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
