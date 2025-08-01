# 🧠 Zencodeo

A full-stack platform for developers to share, review, and discuss code snippets. Built with **Next.js**, **Supabase**, and **shadcn/ui**.

## ✨ Features

- 🔐 **Authentication** - Email/password registration and login via Supabase
- 📝 **Create Snippets** - Share code with syntax highlighting and language detection
- 🏠 **Public Feed** - Browse all shared code snippets
- 💬 **Comments** - Discuss and review code with other developers
- 👤 **User Dashboard** - Manage your own snippets and activity
- 🎨 **Modern UI** - Beautiful interface built with shadcn/ui components
- 🌙 **Dark/Light Theme** - Toggle between dark and light modes with system preference support
- 📱 **Responsive** - Works perfectly on desktop and mobile devices

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd code-snippet-exchange
npm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup

Run these SQL commands in your Supabase SQL editor:

```sql
-- Create snippets table
CREATE TABLE snippets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  language TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comments table
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  snippet_id UUID REFERENCES snippets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE snippets ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Snippets are viewable by everyone" ON snippets
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own snippets" ON snippets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own snippets" ON snippets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own snippets" ON snippets
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Comments are viewable by everyone" ON comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🛠 Tech Stack

- **Frontend**: Next.js 15 with App Router
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Syntax Highlighting**: react-syntax-highlighter
- **Icons**: Lucide React
- **Charts**: Recharts (for analytics)

## 📁 Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── create/            # Create snippet page
│   ├── login/             # Login page
│   ├── register/          # Register page
│   ├── dashboard/         # User dashboard
│   └── snippet/[id]/      # Individual snippet view
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── navigation.tsx    # Main navigation
│   └── snippet-card.tsx  # Snippet display component
└── lib/                  # Utility functions
    ├── auth.tsx          # Authentication context
    ├── supabase.ts       # Supabase client
    └── utils.ts          # Utility functions
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your environment variables in Vercel dashboard
4. Deploy!

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](../../issues) page
2. Create a new issue with detailed information
3. Join our community discussions

---

Built with ❤️ by the developer community
