# AI Suggestions Platform - Setup Guide

## Overview
This is an AI-powered suggestion platform that allows users to submit ideas and collaborate with AI to refine them before admin review.

## Features
- ✅ User authentication with Supabase
- ✅ AI-powered suggestion refinement using OpenAI GPT-4
- ✅ Admin panel for reviewing and managing suggestions
- ✅ Role-based access control
- ✅ Real-time chat interface with AI
- ✅ Responsive modern UI with shadcn-ui

## Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy the environment template and configure your variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual values:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key

### 3. Database Setup
Run the database migrations to create the required tables:
```bash
# Make sure you have Supabase CLI installed
npx supabase db reset
```

### 4. Configure OpenAI (Required for AI features)
In your Supabase dashboard:
1. Go to Edge Functions → Settings
2. Add environment variable: `OPENAI_API_KEY` with your OpenAI API key

### 5. Create Admin User
After setting up, you'll need to manually set a user as admin in the database:
```sql
-- Replace 'user-uuid-here' with actual user ID from auth.users
UPDATE profiles SET role = 'admin' WHERE user_id = 'user-uuid-here';
```

### 6. Start Development Server
```bash
npm run dev
```

## Project Structure
```
src/
├── components/
│   ├── ChatInterface.tsx     # AI chat interface
│   ├── SuggestionForm.tsx    # Form for creating suggestions
│   └── ui/                   # shadcn-ui components
├── pages/
│   ├── Index.tsx            # Landing page
│   ├── Auth.tsx             # Authentication
│   ├── Dashboard.tsx        # User dashboard
│   └── Admin.tsx            # Admin panel
├── hooks/
│   └── useAuth.tsx          # Authentication hook
└── integrations/
    └── supabase/            # Supabase configuration
```

## Database Schema
- `profiles`: User profiles with role information
- `suggestions`: User suggestions with AI conversations and admin notes

## API Endpoints
- `ai-chat`: Supabase Edge Function for OpenAI integration

## Security Features
- Row Level Security (RLS) enabled
- Role-based access control
- Secure API endpoints

## Development Commands
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build

## Troubleshooting

### Common Issues
1. **Database connection issues**: Check your Supabase URL and keys
2. **AI chat not working**: Verify OpenAI API key is set in Supabase Edge Functions
3. **Admin panel access denied**: Ensure user role is set to 'admin' in database

### Getting Help
Check the console for detailed error messages and ensure all environment variables are properly configured.