# ShowYo Firebase Cloud Functions

This directory contains Firebase Cloud Functions for the ShowYo application.

## Setup

1. Install dependencies:
```bash
cd functions
npm install
```

2. Build the TypeScript code:
```bash
npm run build
```

## Auth Functions

### POST /auth/login
Authenticate a user with email and password.

**Request Body:**
```json
{
  "email": "admin@showyo.app",
  "password": "Tank1224"
}
```

**Response:**
```json
{
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "email": "admin@showyo.app",
    "displayName": "Admin",
    "roles": ["admin", "user"]
  }
}
```

### POST /auth/logout
Logout the current user (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### GET /auth/session
Get current user session information (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "user-id",
  "email": "admin@showyo.app",
  "displayName": "Admin",
  "roles": ["admin", "user"]
}
```

### POST /auth/create-admin
Create a new admin user.

**Request Body:**
```json
{
  "email": "admin@showyo.app",
  "password": "Tank1224",
  "displayName": "Admin (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-id",
    "email": "admin@showyo.app",
    "displayName": "Admin",
    "roles": ["admin", "user"]
  }
}
```

## Deployment

### Deploy to Firebase
```bash
firebase deploy --only functions
```

### Deploy specific function
```bash
firebase deploy --only functions:api
```

## Testing Locally

### Start Firebase Emulator
```bash
npm run serve
```

This will start:
- Functions emulator on port 5001
- Firestore emulator on port 8080
- Auth emulator on port 9099
- Storage emulator on port 9199
- Emulator UI on port 4000

### Test with curl

Create admin user:
```bash
curl -X POST http://localhost:5001/showyo-20c51/us-central1/api/auth/create-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@showyo.app",
    "password": "Tank1224"
  }'
```

Login:
```bash
curl -X POST http://localhost:5001/showyo-20c51/us-central1/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@showyo.app",
    "password": "Tank1224"
  }'
```

Get session:
```bash
curl -X GET http://localhost:5001/showyo-20c51/us-central1/api/auth/session \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Environment Variables

The following environment variables can be configured:

- `JWT_SECRET`: Secret key for JWT token generation (default: 'showyo-secret-key-change-in-production')

Set environment variables:
```bash
firebase functions:config:set jwt.secret="your-secret-key"
```

## Security

- All passwords are hashed using bcrypt before storage
- JWT tokens expire after 7 days
- Admin users have custom claims set in Firebase Auth
- CORS is enabled for all origins (adjust in production)
- Firestore security rules ensure proper access control

## Project Structure

```
functions/
├── src/
│   ├── auth/
│   │   ├── login.ts         # Login endpoint
│   │   ├── logout.ts        # Logout endpoint
│   │   ├── session.ts       # Session endpoint
│   │   └── createAdmin.ts   # Create admin endpoint
│   ├── config/
│   │   ├── firebase.ts      # Firebase Admin SDK initialization
│   │   └── jwt.ts           # JWT token utilities
│   ├── middleware/
│   │   ├── auth.ts          # Authentication middleware
│   │   └── cors.ts          # CORS middleware
│   └── index.ts             # Main entry point
├── package.json
├── tsconfig.json
└── README.md
```

## Troubleshooting

### Function deployment fails
- Ensure you're logged in: `firebase login`
- Check project is set: `firebase use showyo-20c51`
- Verify billing is enabled for the project

### TypeScript errors
- Run `npm run build` to check for compilation errors
- Ensure all dependencies are installed: `npm install`

### CORS errors
- Check CORS middleware configuration in `src/middleware/cors.ts`
- Ensure proper headers are sent from the client

### Authentication errors
- Verify JWT_SECRET is properly configured
- Check token is being sent in Authorization header
- Ensure user exists in Firestore users collection
