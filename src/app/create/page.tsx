'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Navigation } from '@/components/navigation'
import { AuthModals } from '@/components/auth-modals'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'

const LANGUAGES = [
  'javascript', 'typescript', 'python', 'java', 'cpp', 'csharp', 'php', 'ruby',
  'go', 'rust', 'swift', 'kotlin', 'scala', 'html', 'css', 'sql', 'bash', 'json',
  'yaml', 'markdown', 'xml', 'jsx', 'tsx'
]

export default function CreateSnippetPage() {
  const [title, setTitle] = useState('')
  const [language, setLanguage] = useState('javascript')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!user) {
      setError('You must be logged in to create a snippet')
      return
    }

    if (!title.trim() || !code.trim()) {
      setError('Title and code are required')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase
        .from('snippets')
        .insert({
          title: title.trim(),
          language,
          code: code.trim(),
          description: description.trim() || null,
          user_id: user.id,
        })

      if (error) throw error

      router.push('/?refresh=true')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center">
            <Card className="w-full max-w-md">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">
                    You must be logged in to create a snippet
                  </p>
                  <AuthModals>
                    <Button>
                      Sign In
                    </Button>
                  </AuthModals>
                </div>
              </CardContent>
            </Card>
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Create New Snippet</h1>
            <p className="text-muted-foreground mt-2">
              Share your code with the developer community
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Provide the title and language for your code snippet
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter snippet title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Language *</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang} value={lang}>
                          {lang.charAt(0).toUpperCase() + lang.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what your code does..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Code</CardTitle>
                <CardDescription>
                  Write or paste your code here
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Code *</Label>
                  <Textarea
                    id="code"
                    placeholder="Paste your code here..."
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    rows={15}
                    className="font-mono text-sm"
                    required
                  />
                </div>
                {code && (
                  <div className="space-y-2">
                    <Label>Preview</Label>
                    <div className="border rounded-md overflow-hidden">
                      <SyntaxHighlighter
                        language={language}
                        style={tomorrow}
                        customStyle={{
                          margin: 0,
                          borderRadius: 0,
                        }}
                      >
                        {code}
                      </SyntaxHighlighter>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Snippet'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 