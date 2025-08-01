import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Snippet {
  id: string
  title: string
  language: string
  code: string
  description?: string
  user_id: string
  created_at: string
  updated_at: string
  likes_count?: number
}

export interface Comment {
  id: string
  content: string
  snippet_id: string
  user_id: string
  created_at: string
  updated_at: string
}

export interface Like {
  id: string
  snippet_id: string
  user_id: string
  created_at: string
}

export interface User {
  id: string
  email: string
  created_at: string
} 