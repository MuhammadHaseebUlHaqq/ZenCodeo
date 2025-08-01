'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { supabase, Snippet } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/lib/auth'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'

type SnippetWithUser = Snippet

export default function EditSnippetPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [snippet, setSnippet] = useState<SnippetWithUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Form state
  const [title, setTitle] = useState('')
  const [language, setLanguage] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (params.id) {
      fetchSnippet()
    }
  }, [params.id])

  const fetchSnippet = async () => {
    try {
      const { data, error } = await supabase
        .from('snippets')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error
      
      // Check if user owns this snippet
      if (data.user_id !== user?.id) {
        setError('You can only edit your own snippets')
        return
      }

      setSnippet(data)
      setTitle(data.title)
      setLanguage(data.language)
      setCode(data.code)
      setDescription(data.description || '')
    } catch (error) {
      console.error('Error fetching snippet:', error)
      setError('Snippet not found')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !snippet) return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const { error } = await supabase
        .from('snippets')
        .update({
          title: title.trim(),
          language: language.trim(),
          code: code.trim(),
          description: description.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', snippet.id)
        .eq('user_id', user.id)

      if (error) throw error

      setSuccess('Snippet updated successfully!')
      setTimeout(() => {
        router.push(`/snippet/${snippet.id}`)
      }, 1500)
    } catch (error: unknown) {
      console.error('Error updating snippet:', error)
      setError(error instanceof Error ? error.message : 'Failed to update snippet')
    } finally {
      setSaving(false)
    }
  }

  const languages = [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust',
    'Swift', 'Kotlin', 'Dart', 'R', 'MATLAB', 'Scala', 'Haskell', 'Clojure', 'Elixir', 'F#',
    'HTML/CSS', 'SQL', 'Bash', 'PowerShell', 'YAML', 'JSON', 'XML', 'Markdown', 'Dockerfile',
    'Assembly', 'C', 'Objective-C', 'Perl', 'Lua', 'Groovy', 'COBOL', 'Fortran', 'Pascal'
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
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
              <Button onClick={() => router.push('/dashboard')} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
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
            <Button onClick={() => router.push('/dashboard')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>

          {/* Edit Form */}
          <Card>
            <CardHeader>
              <CardTitle>Edit Snippet</CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {success && (
                <Alert className="mb-4">
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium">
                    Title
                  </label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter snippet title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="language" className="text-sm font-medium">
                    Language
                  </label>
                  <Select value={language} onValueChange={setLanguage} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang} value={lang}>
                          {lang}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium">
                    Description (Optional)
                  </label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what this snippet does..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="code" className="text-sm font-medium">
                    Code
                  </label>
                  <Textarea
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Paste your code here..."
                    rows={15}
                    className="font-mono text-sm"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/snippet/${snippet.id}`)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 