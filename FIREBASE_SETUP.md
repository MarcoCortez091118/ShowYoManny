# Firebase Setup Guide for ShowYo

## Current Status
Firebase credentials have been configured in the `.env` file. The project is ready to connect to Firebase once Cloud Functions are deployed.

## Configuration Complete

The following Firebase credentials are now configured:

- **Project ID**: `showyo-20c51`
- **Region**: `us-central1`
- **Service Account Email**: `firebase-adminsdk-fbsvc@showyo-20c51.iam.gserviceaccount.com`

## Next Steps

### 1. Deploy Firebase Cloud Functions

The ShowYo application requires the following Cloud Functions to be deployed:

#### Required Endpoints:

1. **Auth Functions** (`/auth/*`)
   - `POST /auth/login` - User authentication
   - `POST /auth/logout` - User logout
   - `GET /auth/session` - Verify session
   - `POST /auth/create-admin` - Create admin user

2. **Storage Functions** (`/storage/*`)
   - Upload and manage billboard assets

3. **Order Functions** (`/orders/*`)
   - Create and manage content orders

4. **Payment Functions** (`/payments/*`)
   - Stripe checkout integration

5. **Queue Functions** (`/queue/*`)
   - Manage billboard display queue

6. **Kiosk Functions** (`/kiosk/*`)
   - Kiosk display management

### 2. Create Admin User

Once Cloud Functions are deployed, create an admin user:

**Default Admin Credentials:**
- Email: `admin@showyo.app`
- Password: `Tank1224`

To create the admin user, you can:

1. Call the endpoint directly:
   ```bash
   curl -X POST https://us-central1-showyo-20c51.cloudfunctions.net/auth/create-admin \
     -H "Content-Type: application/json" \
     -d '{"email": "admin@showyo.app", "password": "Tank1224"}'
   ```

2. Or use the built-in utility (after functions are deployed):
   - Import `createAdminUser` from `/src/utils/createAdminUser.ts`
   - Call it during app initialization

### 3. Access Admin Dashboard

After creating the admin user:

1. Navigate to `/admin/login`
2. Login with the admin credentials
3. Access the admin dashboard at `/admin/dashboard`

## Firebase Project Structure

```
showyo-20c51/
├── Authentication (Firebase Auth)
├── Firestore Database
├── Storage (for billboard assets)
└── Cloud Functions (API endpoints)
```

## Security Notes

⚠️ **IMPORTANT**: The service account private key in `.env` should NEVER be committed to version control or exposed to the client side. It's only used for server-side operations.

## Environment Variables

Current configuration in `.env`:

```env
# Firebase Configuration (Client-side)
VITE_FIREBASE_PROJECT_ID=showyo-20c51
VITE_FIREBASE_REGION=us-central1
VITE_FIREBASE_API_BASE_URL=

# Firebase Service Account (Server-side ONLY)
FIREBASE_SERVICE_ACCOUNT_TYPE=service_account
FIREBASE_SERVICE_ACCOUNT_PROJECT_ID=showyo-20c51
# ... (other service account credentials)
```

## Troubleshooting

### Connection Issues

If you see "Firebase API base URL is not configured":
1. Ensure Cloud Functions are deployed
2. Verify the base URL in `.env`
3. Check that functions are deployed to the correct region

### Authentication Issues

If login fails:
1. Verify Cloud Functions are deployed
2. Check that the admin user was created successfully
3. Verify credentials match the created user

### Storage Issues

If file uploads fail:
1. Verify Storage rules in Firebase Console
2. Check that Storage is enabled for the project
3. Verify service account has correct permissions

## Development vs Production

- **Development**: Cloud Functions can be emulated locally
- **Production**: Functions must be deployed to Firebase

The current setup points to production Firebase (`showyo-20c51`).
