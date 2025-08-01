'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Code, User, LogOut, Home, Plus, Settings, BookOpen } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'

export function Navigation() {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="p-2 bg-zinc-900 rounded-lg group-hover:scale-105 transition-transform">
            <Code className="h-6 w-6 text-white" />
          </div>
          <span className="font-bold text-xl text-foreground">
            Zencodeo
          </span>
        </Link>

        {/* Center Navigation */}
        <div className="hidden md:flex items-center space-x-1">
          <Link href="/">
            <Button variant="ghost" className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-accent">
              <Home className="h-4 w-4" />
              <span className="font-medium">Home</span>
            </Button>
          </Link>
          <Link href="/about">
            <Button variant="ghost" className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-accent">
              <BookOpen className="h-4 w-4" />
              <span className="font-medium">About</span>
            </Button>
          </Link>
          {user && (
            <Link href="/dashboard">
              <Button variant="ghost" className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-accent">
                <User className="h-4 w-4" />
                <span className="font-medium">Dashboard</span>
              </Button>
            </Link>
          )}
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-3">
          <ThemeToggle />
          {user ? (
            <>
              <Link href="/create">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-center">
                  <div className="flex items-center justify-center w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Create</span>
                  </div>
                </Button>
              </Link>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full border-2 border-border hover:border-border/50 transition-colors flex items-center justify-center">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                        {user.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 mt-2" align="end" forceMount>
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-sm font-medium">{user.email}</p>
                    <p className="text-xs text-muted-foreground">Developer</p>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="flex items-center cursor-pointer">
                      <User className="mr-3 h-4 w-4" />
                      <div>
                        <p className="font-medium">Dashboard</p>
                        <p className="text-xs text-muted-foreground">Manage your snippets</p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/create" className="flex items-center cursor-pointer">
                      <Plus className="mr-3 h-4 w-4" />
                      <div>
                        <p className="font-medium">Create Snippet</p>
                        <p className="text-xs text-muted-foreground">Share new code</p>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="flex items-center cursor-pointer text-destructive">
                    <LogOut className="mr-3 h-4 w-4" />
                    <div>
                      <p className="font-medium">Sign Out</p>
                      <p className="text-xs text-muted-foreground">Log out of your account</p>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" className="px-4 py-2 rounded-lg hover:bg-accent">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
} 