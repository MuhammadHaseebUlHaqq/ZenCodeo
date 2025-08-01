'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { supabase, Snippet, Comment } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/lib/auth'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { User, Heart, MessageCircle, ArrowLeft, Copy, Check } from 'lucide-react'
import Link from 'next/link'
import { AuthModals } from '@/components/auth-modals'

type SnippetWithUser = Snippet

type CommentWithUser = Comment

export default function SnippetPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [snippet, setSnippet] = useState<SnippetWithUser | null>(null)
  const [comments, setComments] = useState<CommentWithUser[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [commentLoading, setCommentLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)

  useEffect(() => {
    if (params.id) {
      fetchSnippet()
      fetchComments()
      // Check if user has liked this snippet
      if (user) {
        checkIfLiked()
      }
    }
  }, [params.id, user])

  const fetchSnippet = async () => {
    try {
      const { data, error } = await supabase
        .from('snippets')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error
      setSnippet(data)
      setLikeCount(data.likes_count || 0)
    } catch (error) {
      console.error('Error fetching snippet:', error)
      setError('Snippet not found')
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('snippet_id', params.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setComments(data || [])
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }

  const checkIfLiked = async () => {
    if (!user || !params.id) return
    
    try {
      const { data, error } = await supabase
        .from('likes')
        .select('*')
        .eq('snippet_id', params.id)
        .eq('user_id', user.id)
        .single()

      if (!error && data) {
        setIsLiked(true)
      }
    } catch (error) {
      // User hasn't liked this snippet
      setIsLiked(false)
    }
  }

  const toggleLike = async () => {
    if (!user) {
      setError('You must be logged in to like snippets')
      return
    }

    try {
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('snippet_id', params.id)
          .eq('user_id', user.id)

        if (error) throw error
        setIsLiked(false)
        setLikeCount(prev => Math.max(0, prev - 1))
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert({
            snippet_id: params.id,
            user_id: user.id,
          })

        if (error) throw error
        setIsLiked(true)
        setLikeCount(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      setError('You must be logged in to comment')
      return
    }

    if (!newComment.trim()) return

    setCommentLoading(true)
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          content: newComment.trim(),
          snippet_id: params.id,
          user_id: user.id,
        })

      if (error) throw error

      setNewComment('')
      fetchComments()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setCommentLoading(false)
    }
  }

  const copyToClipboard = async () => {
    if (snippet) {
      await navigator.clipboard.writeText(snippet.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const getAuthorName = (email: string) => {
    return email.split('@')[0].replace(/[0-9]/g, '').replace(/[^a-zA-Z]/g, '') || 'Anonymous'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading snippet...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !snippet) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Alert variant="destructive">
              <AlertDescription>
                {error || 'Snippet not found'}
              </AlertDescription>
            </Alert>
            <div className="mt-4">
              <Button onClick={() => router.push('/')} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <div className="mb-6">
            <Button onClick={() => router.push('/')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>

          {/* Snippet Details */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-2xl mb-2">{snippet.title}</CardTitle>
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{snippet.user_id === user?.id ? 'You' : 'Anonymous'}</span>
                  </div>
                  <span>•</span>
                  <span>{formatDate(snippet.created_at)}</span>
                                     <span>•</span>
                   <Badge variant="secondary">{snippet.language}</Badge>
                   <span>•</span>
                  {!user ? (
                    <AuthModals>
                      <button
                        className="flex items-center gap-1 transition-colors text-muted-foreground hover:text-red-500"
                        title="Login to like snippets"
                      >
                        <Heart className="h-4 w-4" />
                        <span>{likeCount}</span>
                      </button>
                    </AuthModals>
                  ) : (
                    <button
                      onClick={toggleLike}
                      className={`flex items-center gap-1 transition-colors ${
                        isLiked 
                          ? 'text-red-500 hover:text-red-600' 
                          : 'text-muted-foreground hover:text-red-500'
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                      <span>{likeCount}</span>
                    </button>
                  )}
                </div>
                </div>
                <Button onClick={copyToClipboard} variant="outline" size="sm">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied!' : 'Copy Code'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {snippet.description && (
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground">{snippet.description}</p>
                </div>
              )}
              
              <div>
                <h3 className="font-semibold mb-2">Code</h3>
                <div className="border rounded-md overflow-hidden">
                  <SyntaxHighlighter
                    language={snippet.language}
                    style={tomorrow}
                    customStyle={{
                      margin: 0,
                      borderRadius: 0,
                      fontSize: '14px',
                    }}
                    showLineNumbers
                  >
                    {snippet.code}
                  </SyntaxHighlighter>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comments Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Comments ({comments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add Comment Form */}
              {user ? (
                <form onSubmit={handleAddComment} className="space-y-4">
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                  />
                  <div className="flex justify-end">
                    <Button type="submit" disabled={commentLoading || !newComment.trim()}>
                      {commentLoading ? 'Posting...' : 'Post Comment'}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground mb-2">
                    You must be logged in to comment
                  </p>
                  <Link href="/login">
                    <Button>Sign In</Button>
                  </Link>
                </div>
              )}

              {/* Comments List */}
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No comments yet. Be the first to comment!
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="border-b pb-4 last:border-b-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {comment.user_id === user?.id ? 'You' : 'Anonymous'}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(comment.created_at)}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 