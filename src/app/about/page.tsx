import { Navigation } from '@/components/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Code, Users, Share2, Sparkles } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">About Zencodeo</h1>
            <p className="text-lg text-muted-foreground">
              A platform for developers to share, discover, and collaborate on code snippets
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-12">
            <Card>
              <CardHeader className="text-center">
                <Code className="h-8 w-8 mx-auto mb-2 text-primary" />
                <CardTitle>Share Code</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground">
                  Upload and share your code snippets with syntax highlighting and language detection
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                <CardTitle>Community</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground">
                  Connect with other developers, comment on snippets, and learn from the community
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <Share2 className="h-8 w-8 mx-auto mb-2 text-primary" />
                <CardTitle>Discover</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground">
                  Find useful code snippets, explore different programming languages, and get inspired
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Our Mission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Zencodeo was created with a simple mission: to make code sharing easier and more collaborative. 
                Instead of logging and finding code scattered across different platforms, we provide a centralized 
                space where developers can share their knowledge and learn from each other.
              </p>
              <p className="text-muted-foreground">
                Whether you're a beginner looking to learn from others or an experienced developer wanting to 
                share your expertise, Zencodeo is the place for you. Join our growing community and start 
                sharing your code today!
              </p>
            </CardContent>
          </Card>

          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to get started?</h2>
            <p className="text-muted-foreground mb-6">
              Join thousands of developers who are already sharing and discovering code on Zencodeo
            </p>
            <a 
              href="/"
              className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Start Sharing Code
            </a>
          </div>
        </div>
      </div>
    </div>
  )
} 