# ShowYo Deployment Guide

## Prerequisites

1. **Firebase CLI** installed globally:
```bash
npm install -g firebase-tools
```

2. **Node.js 20** installed (required for Firebase Functions)

3. **Firebase Project** created (showyo-20c51)

## Step 1: Login to Firebase

```bash
firebase login
```

Follow the browser authentication flow.

## Step 2: Set Active Project

```bash
firebase use showyo-20c51
```

## Step 3: Install Functions Dependencies

```bash
cd functions
npm install
```

## Step 4: Build Functions

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `lib/` directory.

## Step 5: Deploy Functions

Deploy all functions:
```bash
firebase deploy --only functions
```

Or deploy specific function:
```bash
firebase deploy --only functions:api
```

## Step 6: Deploy Firestore Rules and Indexes

```bash
firebase deploy --only firestore
```

## Step 7: Deploy Storage Rules

```bash
firebase deploy --only storage
```

## Step 8: Deploy Everything

```bash
firebase deploy
```

## Step 9: Create Admin User

After deployment, create the admin user by calling the endpoint:

**Using curl:**
```bash
curl -X POST https://us-central1-showyo-20c51.cloudfunctions.net/api/auth/create-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@showyo.app",
    "password": "Tank1224"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "user": {
    "id": "firebase-uid",
    "email": "admin@showyo.app",
    "displayName": "Admin",
    "roles": ["admin", "user"]
  }
}
```

## Step 10: Update Frontend Configuration

Update the `.env` file in the project root to point to the deployed functions:

```env
VITE_FIREBASE_API_BASE_URL=https://us-central1-showyo-20c51.cloudfunctions.net/api
```

Or leave it empty to use the default:
```env
VITE_FIREBASE_API_BASE_URL=
```

The client will automatically construct the URL as:
`https://us-central1-showyo-20c51.cloudfunctions.net`

## Step 11: Test the Deployment

### Test Login
```bash
curl -X POST https://us-central1-showyo-20c51.cloudfunctions.net/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@showyo.app",
    "password": "Tank1224"
  }'
```

### Test Session (with token from login)
```bash
curl -X GET https://us-central1-showyo-20c51.cloudfunctions.net/api/auth/session \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Local Development with Emulators

For local development, use Firebase Emulators:

1. Start emulators:
```bash
firebase emulators:start
```

2. Access Emulator UI:
```
http://localhost:4000
```

3. Functions will be available at:
```
http://localhost:5001/showyo-20c51/us-central1/api
```

4. Update `.env` for local development:
```env
VITE_FIREBASE_API_BASE_URL=http://localhost:5001/showyo-20c51/us-central1/api
```

## Environment Variables

### Production (Firebase Functions)

Set environment variables using Firebase CLI:

```bash
firebase functions:config:set jwt.secret="your-production-secret-key"
```

View current config:
```bash
firebase functions:config:get
```

### Local (Emulators)

Create `functions/.env` file:
```env
JWT_SECRET=your-local-secret-key
```

## Monitoring and Logs

### View function logs
```bash
firebase functions:log
```

### View specific function logs
```bash
firebase functions:log --only api
```

### Real-time logs
```bash
firebase functions:log --follow
```

## Troubleshooting

### Issue: "Firebase CLI not found"
**Solution:** Install Firebase CLI globally:
```bash
npm install -g firebase-tools
```

### Issue: "Not authenticated"
**Solution:** Login to Firebase:
```bash
firebase login
```

### Issue: "Billing account not configured"
**Solution:** Enable billing in Firebase Console:
1. Go to https://console.firebase.google.com
2. Select project "showyo-20c51"
3. Go to Settings > Usage and billing
4. Set up billing account

### Issue: "Functions deployment fails"
**Solution:**
1. Check you're using Node.js 20: `node --version`
2. Build functions first: `cd functions && npm run build`
3. Check for TypeScript errors in build output

### Issue: "CORS errors in browser"
**Solution:**
1. Verify CORS is properly configured in functions
2. Check that Authorization header is being sent
3. Ensure API URL in `.env` is correct

### Issue: "Admin user already exists"
**Solution:**
This is expected if you already created the admin user. You can:
1. Use the existing admin credentials to login
2. Or delete the user from Firebase Console and create new one

## Security Notes

⚠️ **IMPORTANT:**

1. Change the JWT_SECRET in production:
```bash
firebase functions:config:set jwt.secret="$(openssl rand -base64 32)"
```

2. Restrict CORS to your domain in `functions/src/middleware/cors.ts`

3. Review and tighten Firestore and Storage rules for production

4. Enable Firebase App Check for additional security

5. Never commit service account keys to version control

## Continuous Deployment

For automated deployments, use GitHub Actions or similar CI/CD:

```yaml
name: Deploy to Firebase

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '20'
      - run: npm ci
      - run: cd functions && npm ci && npm run build
      - uses: w9jds/firebase-action@master
        with:
          args: deploy --only functions
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
```

Generate token for CI/CD:
```bash
firebase login:ci
```

## Support

For issues or questions:
1. Check Firebase Console logs
2. Review function logs: `firebase functions:log`
3. Check Firestore security rules
4. Verify environment variables are set correctly
