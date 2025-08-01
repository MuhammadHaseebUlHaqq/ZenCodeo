'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Snippet, supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { User, Heart, MessageCircle, Crown } from 'lucide-react'
import { AuthModals } from '@/components/auth-modals'

interface SnippetWithUser extends Snippet {
  user_email?: string
}

interface SnippetCardProps {
  snippet: SnippetWithUser
  onRefresh?: () => void
}

export function SnippetCard({ snippet, onRefresh }: SnippetCardProps) {
  const { user } = useAuth()
  const [likesCount, setLikesCount] = useState(snippet.likes_count || 0)
  const [isLiked, setIsLiked] = useState(false)
  const [commentsCount, setCommentsCount] = useState(0)
  const [loading, setLoading] = useState(false)
  
  const isOwnSnippet = user && snippet.user_id === user.id

  useEffect(() => {
    fetchLikesAndComments()
  }, [snippet.id])

  const fetchLikesAndComments = async () => {
    try {
      // Fetch likes count
      const { count: likesCount } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('snippet_id', snippet.id)

      // Fetch comments count
      const { count: commentsCount } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('snippet_id', snippet.id)

      setLikesCount(likesCount || 0)
      setCommentsCount(commentsCount || 0)

      // Check if current user has liked this snippet
      if (user) {
        const { data: userLike } = await supabase
          .from('likes')
          .select('*')
          .eq('snippet_id', snippet.id)
          .eq('user_id', user.id)
          .single()

        setIsLiked(!!userLike)
      }
    } catch (error) {
      console.error('Error fetching likes and comments:', error)
    }
  }

  const handleLike = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      if (isLiked) {
        // Unlike
        await supabase
          .from('likes')
          .delete()
          .eq('snippet_id', snippet.id)
          .eq('user_id', user.id)
        
        setLikesCount(prev => prev - 1)
        setIsLiked(false)
      } else {
        // Like
        await supabase
          .from('likes')
          .insert({
            snippet_id: snippet.id,
            user_id: user.id
          })
        
        setLikesCount(prev => prev + 1)
        setIsLiked(true)
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCodePreview = (code: string) => {
    const lines = code.split('\n').slice(0, 3)
    return lines.map((line, index) => `${index + 1}. ${line}`).join('\n')
  }

  return (
    <Card className="h-full hover:shadow-lg transition-all duration-200 cursor-pointer bg-card text-card-foreground border-border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg line-clamp-2 text-card-foreground">{snippet.title}</CardTitle>
          <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
            {snippet.language}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          <span>{isOwnSnippet ? 'You' : 'Anonymous'}</span>
          {isOwnSnippet && (
            <div title="Your snippet">
              <Crown className="h-3 w-3 text-yellow-500" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="bg-muted p-3 rounded-md mb-4 border border-border">
          <pre className="text-xs text-muted-foreground overflow-hidden line-clamp-3 font-mono">
            <code>{getCodePreview(snippet.code)}</code>
          </pre>
        </div>
        {snippet.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {snippet.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {!user ? (
              <AuthModals>
                <button
                  className="flex items-center gap-1 transition-colors text-muted-foreground hover:text-red-500"
                  title="Login to like snippets"
                >
                  <Heart className="h-4 w-4" />
                  <span>{likesCount}</span>
                </button>
              </AuthModals>
            ) : (
              <button
                onClick={handleLike}
                disabled={loading}
                className={`flex items-center gap-1 transition-colors ${
                  isLiked 
                    ? 'text-red-500 hover:text-red-600' 
                    : 'text-muted-foreground hover:text-red-500'
                }`}
              >
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                <span>{likesCount}</span>
              </button>
            )}
            <div className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              <span>{commentsCount}</span>
            </div>
          </div>
          <Link href={`/snippet/${snippet.id}`}>
            <span className="text-primary hover:text-primary/80 text-sm">Read More</span>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
} 