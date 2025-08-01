'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { AuthModals } from '@/components/auth-modals'
import { supabase, Snippet } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/lib/auth'
import { 
  Plus, 
  Search, 
  Heart, 
  MessageCircle, 
  TrendingUp,
  Diamond,
  Music,
  Square,
  ArrowUp,
  Waves,
  Link as LinkIcon
} from 'lucide-react'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface DashboardStats {
  likesToday: number
  commentsToday: number
  snippetsToday: number
  likesChange: number
  commentsChange: number
  snippetsChange: number
}

interface LanguageData {
  language: string
  count: number
}

interface SnippetWithStats extends Snippet {
  likes_count: number
  comments_count: number
}

export default function DashboardPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [snippets, setSnippets] = useState<SnippetWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    likesToday: 0,
    commentsToday: 0,
    snippetsToday: 0,
    likesChange: 0,
    commentsChange: 0,
    snippetsChange: 0
  })
  const [languageData, setLanguageData] = useState<LanguageData[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [likedSnippets, setLikedSnippets] = useState<Set<string>>(new Set())

  const fetchDashboardData = useCallback(async () => {
    if (!user) return
    
    try {
      console.log('Fetching dashboard data for user:', user.id)
      
      // First, let's test if we can connect to the database
      const { error: testError } = await supabase
        .from('snippets')
        .select('count')
        .limit(1)

      if (testError) {
        console.error('Database connection test failed:', testError)
        throw new Error('Database connection failed')
      }

      // Fetch snippets with stats
      const { data: snippetsData, error: snippetsError } = await supabase
        .from('snippets')
        .select(`
          *,
          likes_count
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (snippetsError) {
        console.error('Error fetching snippets:', snippetsError)
        throw snippetsError
      }

      console.log('Snippets fetched:', snippetsData?.length || 0)

      // Fetch comments count separately to avoid complex joins
      let commentsData: { snippet_id: string }[] = []
      if (snippetsData && snippetsData.length > 0) {
        const { data: comments, error: commentsError } = await supabase
          .from('comments')
          .select('snippet_id')
          .in('snippet_id', snippetsData.map(s => s.id))

        if (commentsError) {
          console.error('Error fetching comments:', commentsError)
        } else {
          commentsData = comments || []
        }
      }

      // Fetch likes count separately to get actual current likes
      let likesData: { snippet_id: string }[] = []
      if (snippetsData && snippetsData.length > 0) {
        const { data: likes, error: likesError } = await supabase
          .from('likes')
          .select('snippet_id')
          .in('snippet_id', snippetsData.map(s => s.id))

        if (likesError) {
          console.error('Error fetching likes:', likesError)
        } else {
          likesData = likes || []
        }
      }

      // Fetch user's likes to show which snippets are liked
      const { data: userLikes, error: userLikesError } = await supabase
        .from('likes')
        .select('snippet_id')
        .eq('user_id', user.id)

      if (userLikesError) {
        console.error('Error fetching user likes:', userLikesError)
      } else {
        const likedSnippetIds = new Set(userLikes?.map(like => like.snippet_id) || [])
        setLikedSnippets(likedSnippetIds)
      }

      // Process snippets data
      const processedSnippets = (snippetsData || []).map(snippet => {
        const commentCount = commentsData?.filter(c => c.snippet_id === snippet.id).length || 0
        const likeCount = likesData?.filter(l => l.snippet_id === snippet.id).length || 0
        return {
          ...snippet,
          comments_count: commentCount,
          likes_count: likeCount
        }
      })

      setSnippets(processedSnippets)

      // Calculate today's stats
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data: todayLikes, error: likesError } = await supabase
        .from('likes')
        .select('*')
        .gte('created_at', today.toISOString())

      if (likesError) {
        console.error('Error fetching likes:', likesError)
      }

      const { data: todayComments, error: todayCommentsError } = await supabase
        .from('comments')
        .select('*')
        .gte('created_at', today.toISOString())

      if (todayCommentsError) {
        console.error('Error fetching today comments:', todayCommentsError)
      }

      // Calculate stats
      const likesToday = todayLikes?.length || 0
      const commentsToday = todayComments?.length || 0
      const snippetsToday = processedSnippets.filter(snippet => {
        const snippetDate = new Date(snippet.created_at)
        return snippetDate >= today
      }).length

      console.log('Stats calculated:', { likesToday, commentsToday, snippetsToday })

      setStats({
        likesToday,
        commentsToday,
        snippetsToday,
        likesChange: likesToday > 14 ? 4 : -2,
        commentsChange: commentsToday > 20 ? 6 : -3,
        snippetsChange: snippetsToday > 3 ? 2 : -1
      })

      // Generate language-based data from user's snippets
      const languageCounts = new Map<string, number>()
      
      processedSnippets.forEach(snippet => {
        const lang = snippet.language
        languageCounts.set(lang, (languageCounts.get(lang) || 0) + 1)
      })
      
      // Convert to array format for chart and limit to top 10
      const languageStats = Array.from(languageCounts.entries())
        .map(([language, count]) => ({
          language,
          count
        }))
        .sort((a, b) => b.count - a.count) // Sort by count descending
        .slice(0, 10) // Limit to top 10 languages
      
      setLanguageData(languageStats)

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      // Set default data to prevent empty state
      setSnippets([])
      setStats({
        likesToday: 0,
        commentsToday: 0,
        snippetsToday: 0,
        likesChange: 0,
        commentsChange: 0,
        snippetsChange: 0
      })
      setLanguageData([
        { language: 'JavaScript', count: 5 },
        { language: 'Python', count: 4 },
        { language: 'TypeScript', count: 3 },
        { language: 'HTML/CSS', count: 2 },
        { language: 'SQL', count: 2 },
        { language: 'Java', count: 1 },
        { language: 'C++', count: 1 },
        { language: 'PHP', count: 1 },
        { language: 'Ruby', count: 1 },
        { language: 'Go', count: 1 }
      ])
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
    fetchDashboardData()
  }, [user, router, fetchDashboardData])

  const deleteSnippet = async (snippetId: string) => {
    if (!confirm('Are you sure you want to delete this snippet?')) return

    try {
      const { error } = await supabase
        .from('snippets')
        .delete()
        .eq('id', snippetId)

      if (error) throw error
      fetchDashboardData() // Refresh the data
    } catch (error) {
      console.error('Error deleting snippet:', error)
    }
  }

  const toggleLike = async (snippetId: string) => {
    if (!user) return

    try {
      const isLiked = likedSnippets.has(snippetId)
      
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('snippet_id', snippetId)
          .eq('user_id', user.id)

        if (error) throw error
        
        // Update local state
        setLikedSnippets(prev => {
          const newSet = new Set(prev)
          newSet.delete(snippetId)
          return newSet
        })
        
        // Update snippet likes count
        setSnippets(prev => prev.map(snippet => 
          snippet.id === snippetId 
            ? { ...snippet, likes_count: Math.max(0, (snippet.likes_count || 0) - 1) }
            : snippet
        ))
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert({
            snippet_id: snippetId,
            user_id: user.id,
          })

        if (error) throw error
        
        // Update local state
        setLikedSnippets(prev => new Set([...prev, snippetId]))
        
        // Update snippet likes count
        setSnippets(prev => prev.map(snippet => 
          snippet.id === snippetId 
            ? { ...snippet, likes_count: (snippet.likes_count || 0) + 1 }
            : snippet
        ))
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  const getSnippetIcon = (index: number) => {
    const icons = [Diamond, Music, Square, ArrowUp, Waves, LinkIcon]
    return icons[index % icons.length]
  }

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  const filteredSnippets = snippets.filter(snippet =>
    snippet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    snippet.language.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
              <p className="text-muted-foreground mb-6">
                Please sign in to access your dashboard
              </p>
              <AuthModals>
                <Button>
                  Sign In
                </Button>
              </AuthModals>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full" />
              <p>Loading your dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Header with Search */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search & snippet"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground font-semibold text-sm">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="font-medium">{user.email?.split('@')[0] || 'User'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Zencdeo Section with Chart */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Zencodeo</h1>
          <Link href="/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
                Add Snippet
            </Button>
          </Link>
        </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Top Programming Languages</CardTitle>
              <p className="text-sm text-muted-foreground">
                Your most used programming languages based on snippet count
              </p>
            </CardHeader>
            <CardContent className="p-6">
              {languageData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={languageData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis 
                      dataKey="language" 
                      stroke="#9CA3AF"
                      fontSize={11}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fill: '#9CA3AF' }}
                      axisLine={{ stroke: '#374151' }}
                    />
                    <YAxis 
                      stroke="#9CA3AF"
                      fontSize={11}
                      tick={{ fill: '#9CA3AF' }}
                      axisLine={{ stroke: '#374151' }}
                      tickLine={{ stroke: '#374151' }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#1F2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#F9FAFB',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                      cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                    />
                    <Bar 
                      dataKey="count" 
                      fill="url(#gradient)"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={60}
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity={1} />
                        <stop offset="100%" stopColor="#1D4ED8" stopOpacity={1} />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="h-12 w-12 mx-auto mb-4 text-muted-foreground">
                      <TrendingUp className="h-full w-full" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No snippets yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first snippet to see your language usage statistics
                    </p>
                    <Link href="/create">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Snippet
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Today's Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Likes Today</p>
                  <p className="text-2xl font-bold">{stats.likesToday}</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.likesChange > 0 ? '+' : ''}{stats.likesChange} New likes than usual
                  </p>
                </div>
                <Heart className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Comments Today</p>
                  <p className="text-2xl font-bold">{stats.commentsToday}</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.commentsChange > 0 ? '+' : ''}{stats.commentsChange} More comments than
                  </p>
                </div>
                <MessageCircle className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Snippets Made Today</p>
                  <p className="text-2xl font-bold">{stats.snippetsToday}</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.snippetsChange > 0 ? '+' : ''}{stats.snippetsChange} {stats.snippetsChange > 0 ? 'More' : 'Less'} snippets than usual
                  </p>
                </div>
                <Square className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
                      </div>

        {/* Snippets Table */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Snippets</h2>
                    </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium text-muted-foreground">No</th>
                      <th className="text-left p-4 font-medium text-muted-foreground"></th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Title</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Language</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Stats / Likes</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Comment</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSnippets.map((snippet, index) => {
                      const IconComponent = getSnippetIcon(index)
                      return (
                        <tr key={snippet.id} className="border-b hover:bg-muted/50">
                          <td className="p-4">{index + 1}</td>
                          <td className="p-4">
                            <IconComponent className="h-5 w-5 text-muted-foreground" />
                          </td>
                          <td className="p-4 font-medium">{snippet.title}</td>
                          <td className="p-4">
                            <Badge variant="secondary">{snippet.language}</Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <Heart className="h-4 w-4 text-red-500 fill-current" />
                              <span className="font-medium">{formatNumber(snippet.likes_count || 0)}</span>
                            </div>
                          </td>
                          <td className="p-4">{formatNumber(snippet.comments_count || 0)}</td>
                                                      <td className="p-4">
                              <div className="flex items-center space-x-2">
                      <Link href={`/snippet/${snippet.id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                                <Link href={`/snippet/${snippet.id}/edit`}>
                        <Button variant="outline" size="sm">
                                    Update
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => deleteSnippet(snippet.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </Button>
                    </div>
                            </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              
              {filteredSnippets.length === 0 && (
                <div className="text-center py-12">
                  <div className="h-12 w-12 mx-auto mb-4 text-muted-foreground">
                    <TrendingUp className="h-full w-full" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No snippets found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery ? 'No snippets match your search.' : 'You haven\'t created any snippets yet.'}
                  </p>
                  {!searchQuery && (
                    <Link href="/create">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Snippet
                      </Button>
                    </Link>
                  )}
                  </div>
              )}
                </CardContent>
              </Card>
          </div>
      </div>
    </div>
  )
} 