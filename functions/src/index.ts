import * as functions from 'firebase-functions';
import express from 'express';
import { corsMiddleware } from './middleware/cors';
import { authenticateToken } from './middleware/auth';
import { login } from './auth/login';
import { logout } from './auth/logout';
import { getSession } from './auth/session';
import { createAdmin } from './auth/createAdmin';
import { syncUser } from './auth/syncUser';

const app = express();

app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/auth/login', login);
app.post('/auth/logout', authenticateToken, logout);
app.get('/auth/session', authenticateToken, getSession);
app.post('/auth/create-admin', createAdmin);
app.post('/auth/sync-user', syncUser);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

export const api = functions.https.onRequest(app);
