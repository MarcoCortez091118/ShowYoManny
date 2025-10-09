# Showyo Dynamic Display

A digital billboard management system for displaying user-submitted content with AI moderation, payment processing, and queue management.

## Features

- User content upload with file validation
- AI-powered content moderation
- Stripe payment integration
- Content queue management
- Real-time kiosk display
- Admin dashboard with comprehensive controls
- Scheduled content display
- Custom border/frame options
- Multi-platform support (Web, iOS, Android)

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: shadcn-ui with Tailwind CSS
- **Backend**: Firebase (Authentication, Firestore, Cloud Functions, Storage)
- **Payment**: Stripe
- **AI Moderation**: OpenAI GPT-4o
- **Mobile**: Capacitor (iOS & Android)

## Prerequisites

- Node.js 18+ and npm
- Firebase project with Firestore, Storage, and Cloud Functions enabled
- Stripe account
- OpenAI API key

## Getting Started

### 1. Clone the repository

```bash
git clone <YOUR_GIT_URL>
cd showyo-dynamic-display
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_REGION=us-central1
# Optional override if you expose Cloud Functions at a custom domain
VITE_FIREBASE_API_BASE_URL=https://us-central1-your-project.cloudfunctions.net
```

### 4. Firebase Setup

1. Create a Firebase project at [firebase.google.com](https://firebase.google.com)
2. Enable Authentication, Firestore, Storage, and Cloud Functions
3. Deploy Cloud Functions that expose the following HTTP endpoints consumed by the app:
   - `auth/login`, `auth/logout`, `auth/session`
   - `auth/create-admin`, `auth/update-admin-password`
   - `orders` REST endpoints for CRUD and filtering
   - `queue` REST endpoints for playlist management
   - `kiosk/playlist` and `kiosk/report-play`
   - `payments/create-checkout-session` and `payments/confirm`
   - `logs/plays` and `logs/system-health`
4. Store your Firebase service account credentials securely in your Cloud Functions environment variables (for example, by
   setting `GOOGLE_APPLICATION_CREDENTIALS` to a JSON file that contains the provided service account from `firebase-adminsdk-fbsvc@showyo-20c51`). Do **not** commit these credentials.
5. Configure Firebase Storage and Firestore security rules to allow only authenticated admin access for management endpoints.

### 5. Stripe Setup

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Add your Stripe secret key to your Firebase Functions environment (`firebase functions:config:set stripe.secret=sk_live_...`)
3. Configure webhook endpoints in the Stripe dashboard for payment events that hit your deployed Cloud Function

### 6. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Project Structure

```
├── src/
│   ├── components/        # React components
│   │   ├── ui/           # shadcn-ui components
│   │   └── ...           # Feature components
│   ├── pages/            # Page components
│   ├── contexts/         # React contexts (Auth, etc.)
│   ├── integrations/     # Firebase HTTP client
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utility functions
│   └── assets/           # Static assets
├── shared/               # Cross-platform domain definitions (plans, borders)
└── public/               # Public static files
```

## Building for Production

### Web Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy the `dist` folder to your hosting provider:
   - Vercel
   - Netlify
   - AWS S3 + CloudFront
   - Or any static hosting service

### Mobile Deployment (iOS/Android)

1. Build the web app:
   ```bash
   npm run build
   ```

2. Sync with native platforms:
   ```bash
   npx cap sync
   ```

3. Open in native IDE:
   ```bash
   npx cap open ios      # For iOS (requires macOS + Xcode)
   npx cap open android  # For Android (requires Android Studio)
   ```

4. Build and deploy through respective app stores

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Style

- TypeScript for type safety
- ESLint for code quality
- Tailwind CSS for styling
- Component-based architecture

## Admin Dashboard

Access the admin dashboard at `/admin` with admin credentials to:
- Manage content queue
- Review moderation decisions
- Configure billing and payments
- View system logs
- Manage custom borders
- Configure display settings

## API Documentation

All backend interactions are routed through Firebase Cloud Functions. The application expects the following HTTPS endpoints to
be available:

- `auth/login`, `auth/logout`, `auth/session`
- `auth/create-admin`, `auth/update-admin-password`
- `orders` (GET/POST/PATCH/DELETE) with support for query filters such as `moderationStatus`, `status`, and `isAdminContent`
- `queue` (GET/POST/PATCH/DELETE) for playlist management
- `kiosk/playlist` and `kiosk/report-play`
- `payments/create-checkout-session` and `payments/confirm`
- `logs/plays` and `logs/system-health`

## Security

- Enforce Firebase Authentication for all admin management functions
- Protect Firestore/Storage with restrictive security rules and service accounts
- Run AI moderation for all user-submitted content before activation
- Store service account JSON, Stripe secrets, and OpenAI keys outside of source control

## License

All rights reserved.

## Support

For issues and questions, please open an issue in the repository.
