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
- **Backend**: Supabase (Database, Auth, Storage, Edge Functions)
- **Payment**: Stripe
- **AI Moderation**: OpenAI GPT-4o
- **Mobile**: Capacitor (iOS & Android)

## Prerequisites

- Node.js 18+ and npm
- Supabase account
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
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_id
```

### 4. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run migrations from `supabase/migrations/` directory
3. Configure the following secrets in your Supabase project settings:
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_DB_URL`
   - `OPENAI_API_KEY`
   - `STRIPE_SECRET_KEY`
4. Deploy edge functions using Supabase CLI:
   ```bash
   supabase functions deploy
   ```

### 5. Stripe Setup

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Add your Stripe secret key to Supabase secrets
3. Configure webhook endpoints in Stripe dashboard for payment events

### 6. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:8080`

## Project Structure

```
├── src/
│   ├── components/        # React components
│   │   ├── ui/           # shadcn-ui components
│   │   └── ...           # Feature components
│   ├── pages/            # Page components
│   ├── contexts/         # React contexts (Auth, etc.)
│   ├── integrations/     # Supabase integration
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utility functions
│   └── assets/           # Static assets
├── supabase/
│   ├── functions/        # Edge functions
│   └── migrations/       # Database migrations
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

### Edge Functions

- `content-upload` - Handle file uploads
- `ai-moderator` - AI content moderation
- `process-content` - Process uploaded content
- `get-queue` - Retrieve content queue
- `create-checkout-session` - Stripe checkout
- `cleanup-expired-content` - Clean expired content
- `generate-playlist` - Generate display playlist
- `report-play` - Track content plays

## Security

- Row Level Security (RLS) enabled on all tables
- Admin authentication required for management functions
- AI moderation for all user-submitted content
- Secure file storage with Supabase Storage
- Environment variables for sensitive data

## License

All rights reserved.

## Support

For issues and questions, please open an issue in the repository.
