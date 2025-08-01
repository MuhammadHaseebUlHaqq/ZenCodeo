'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { Navigation } from '@/components/navigation'
import { SnippetCard } from '@/components/snippet-card'
import { supabase, Snippet } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'
import { useSearchParams } from 'next/navigation'
import { Plus, Code, User, Globe, TrendingUp, Star, Clock, Zap, Search, Filter } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

interface SnippetWithUser extends Snippet {
  user_email?: string
}

function HomePageContent() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [allSnippets, setAllSnippets] = useState<SnippetWithUser[]>([])
  const [trendingSnippets, setTrendingSnippets] = useState<SnippetWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [totalLikes, setTotalLikes] = useState(0)
  const [totalUsers, setTotalUsers] = useState(0)

  const categories = [
    { id: 'all', name: 'All', icon: Globe },
    { id: 'javascript', name: 'JavaScript', icon: Code },
    { id: 'python', name: 'Python', icon: Code },
    { id: 'react', name: 'React', icon: Code },
    { id: 'nodejs', name: 'Node.js', icon: Code },
    { id: 'typescript', name: 'TypeScript', icon: Code },
  ]

  useEffect(() => {
    fetchAllSnippets()
    fetchStats()
  }, [])

  useEffect(() => {
    if (searchParams.get('refresh') === 'true') {
      fetchAllSnippets()
    }
  }, [searchParams])

  const fetchAllSnippets = useCallback(async () => {
    try {
      // Fetch snippets without joins first
      const { data, error } = await supabase
        .from('snippets')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // Transform the data to include user_email
      const snippetsWithUsers = data?.map(snippet => ({
        ...snippet,
        user_email: `user_${snippet.user_id.slice(0, 8)}` // Generate a placeholder email
      })) || []

      console.log('Fetched snippets:', snippetsWithUsers)
      setAllSnippets(snippetsWithUsers)
      
      // Get trending snippets (most liked)
      await fetchTrendingSnippets()
    } catch (error) {
      console.error('Error fetching snippets:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchTrendingSnippets = async () => {
    try {
      // Get snippets with their like counts
      const { data: snippetsWithLikes, error } = await supabase
        .from('snippets')
        .select(`
          *,
          likes:likes(count)
        `)

      if (error) throw error

      // Transform the data to include user_email
      const snippetsWithUsers = snippetsWithLikes?.map(snippet => ({
        ...snippet,
        user_email: `user_${snippet.user_id.slice(0, 8)}` // Generate a placeholder email
      })) || []

      // Sort by like count and take top 3
      const sortedSnippets = snippetsWithUsers
        .sort((a, b) => (b.likes?.[0]?.count || 0) - (a.likes?.[0]?.count || 0))
        .slice(0, 3)

      setTrendingSnippets(sortedSnippets)
    } catch (error) {
      console.error('Error fetching trending snippets:', error)
    }
  }

  const fetchStats = useCallback(async () => {
    try {
      // Get total likes
      const { count: likesCount } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })

      // Get total unique users from snippets table
      const { data: uniqueUsers, error: usersError } = await supabase
        .from('snippets')
        .select('user_id')

      if (usersError) {
        console.error('Error fetching users:', usersError)
        setTotalUsers(0)
      } else {
        const uniqueUserCount = uniqueUsers ? new Set(uniqueUsers.map(u => u.user_id)).size : 0
        setTotalUsers(uniqueUserCount)
      }

      setTotalLikes(likesCount || 0)
    } catch (error) {
      console.error('Error fetching stats:', error)
      // Set default values if there's an error
      setTotalLikes(0)
      setTotalUsers(0)
    }
  }, [])

  const filteredSnippets = allSnippets.filter(snippet => {
    const matchesSearch = snippet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         snippet.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         snippet.code.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || snippet.language.toLowerCase() === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Code className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading snippets...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-muted/50 border-b">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center mb-6">
              <Code className="h-12 w-12 mr-3 text-muted-foreground" />
              <h1 className="text-5xl md:text-6xl font-bold text-foreground">Zencodeo</h1>
            </div>
            <h2 className="text-2xl md:text-3xl font-semibold mb-6 text-foreground">
              Share. Discover. Code Better.
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of developers sharing their best code snippets. Find solutions, learn new techniques, and contribute to the community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/create">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-3">
                  <Plus className="h-5 w-5 mr-2" />
                  Share Your Code
                </Button>
              </Link>
              <Link href="#trending">
                <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-accent text-lg px-8 py-3">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Explore Trending
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filter Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search snippets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background border-border focus:border-ring"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filter by:</span>
              <div className="flex gap-2">
                {categories.map((category) => (
                  <Badge
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "secondary"}
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    {category.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-muted rounded-lg">
                  <Code className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-card-foreground">{allSnippets.length}</p>
                  <p className="text-sm text-muted-foreground">Total Snippets</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-muted rounded-lg">
                  <User className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-card-foreground">{totalUsers}</p>
                  <p className="text-sm text-muted-foreground">Active Developers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-muted rounded-lg">
                  <Star className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-card-foreground">{totalLikes}</p>
                  <p className="text-sm text-muted-foreground">Likes Given</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trending Section */}
        {trendingSnippets.length > 0 && (
          <div id="trending" className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="h-6 w-6 text-muted-foreground" />
              <h2 className="text-2xl font-bold text-foreground">Trending This Week</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {trendingSnippets.map((snippet: SnippetWithUser) => (
                <div key={snippet.id} className="relative">
                  <div className="absolute -top-2 -left-2 z-10">
                    <Badge className="bg-primary text-primary-foreground">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Trending
                    </Badge>
                  </div>
                  <SnippetCard snippet={snippet} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Feed */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Latest Snippets</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Updated recently</span>
              </div>
            </div>

            {filteredSnippets.length === 0 ? (
              <Card className="bg-card border-border shadow-sm">
                <CardContent className="p-12 text-center">
                  <Code className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2 text-card-foreground">No snippets found</h3>
                  <p className="text-muted-foreground mb-6">
                    {searchQuery || selectedCategory !== 'all' 
                      ? 'Try adjusting your search or filters'
                      : 'Be the first to share a code snippet!'
                    }
                  </p>
                  <Link href="/create">
                    <Button className="bg-primary hover:bg-primary/90">
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Snippet
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filteredSnippets.map((snippet: SnippetWithUser) => (
                  <SnippetCard key={snippet.id} snippet={snippet} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:w-80 space-y-6">
            {/* Quick Actions */}
            <Card className="bg-card border-border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-card-foreground">
                  <Zap className="h-5 w-5 text-muted-foreground" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/create">
                  <Button className="w-full justify-start" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Snippet
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button className="w-full justify-start" variant="outline">
                    <User className="h-4 w-4 mr-2" />
                    My Dashboard
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Popular Languages */}
            <Card className="bg-card border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-card-foreground">Popular Languages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['JavaScript', 'Python', 'React', 'Node.js', 'TypeScript'].map((lang) => (
                    <div key={lang} className="flex items-center justify-between p-2 rounded-lg hover:bg-accent cursor-pointer">
                      <span className="text-sm text-card-foreground">{lang}</span>
                      <Badge variant="secondary" className="text-xs">
                        {allSnippets.filter(s => s.language.toLowerCase() === lang.toLowerCase()).length}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Community Stats */}
            <Card className="bg-card border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-card-foreground">Community</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Snippets</span>
                    <span className="font-semibold text-card-foreground">{allSnippets.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Active Users</span>
                    <span className="font-semibold text-card-foreground">{totalUsers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Languages</span>
                    <span className="font-semibold text-card-foreground">{new Set(allSnippets.map(s => s.language)).size}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Code className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading...</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  )
}
