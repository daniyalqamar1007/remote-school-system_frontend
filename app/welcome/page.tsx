'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  GraduationCap, 
  BookOpen, 
  Users, 
  Award, 
  Calendar,
  Shield,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  School,
  TrendingUp
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function WelcomePage() {
  const features = [
    {
      icon: GraduationCap,
      title: 'Student Management',
      description: 'Comprehensive student records and academic tracking',
      color: 'text-blue-600'
    },
    {
      icon: BookOpen,
      title: 'Academic Excellence',
      description: 'Track grades, assignments, and academic progress',
      color: 'text-green-600'
    },
    {
      icon: Users,
      title: 'Community Building',
      description: 'Connect students, teachers, and parents seamlessly',
      color: 'text-purple-600'
    },
    {
      icon: Award,
      title: 'Achievement Tracking',
      description: 'Recognize and celebrate student accomplishments',
      color: 'text-yellow-600'
    },
    {
      icon: Calendar,
      title: 'Event Management',
      description: 'Stay updated with school events and schedules',
      color: 'text-indigo-600'
    },
    {
      icon: Shield,
      title: 'Secure Platform',
      description: 'Your data is protected with enterprise-grade security',
      color: 'text-red-600'
    }
  ]

  const stats = [
    { label: 'Active Students', value: '10,000+', icon: Users },
    { label: 'Teachers', value: '500+', icon: GraduationCap },
    { label: 'Courses', value: '200+', icon: BookOpen },
    { label: 'Success Rate', value: '98%', icon: TrendingUp }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header Section */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-md border border-gray-100">
                <Image
                  src="/Logo/srs.png"
                  alt="RSS Logo"
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover"
                />
              </div>
              <span className="text-xl font-bold text-gray-900">RSS</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="outline" className="hidden sm:flex">
                  Sign In
                </Button>
              </Link>
              <Link href="/login">
                <Button className="bg-black hover:bg-gray-800 text-white">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
        <div className="text-center max-w-4xl mx-auto">
          <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">
            <Sparkles className="w-3 h-3 mr-1" />
            Welcome to Remote School System
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Empowering Education
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Through Technology
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            A comprehensive school management platform designed to streamline academic operations,
            enhance communication, and foster student success.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/login">
              <Button size="lg" className="bg-black hover:bg-gray-800 text-white w-full sm:w-auto px-8">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/admin/dashboard">
              <Button size="lg" variant="outline" className="w-full sm:w-auto px-8">
                Explore Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center border-gray-200 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center">
                  <stat.icon className="h-8 w-8 text-gray-600 mb-2" />
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm sm:text-base text-gray-600">
                    {stat.label}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Powerful Features
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Everything you need to manage your school efficiently and effectively
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <CardHeader>
                <div className="flex items-center gap-4 mb-2">
                  <div className={`p-3 rounded-lg bg-gray-50 ${feature.color}`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl text-gray-900">
                    {feature.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600 text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
        <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 border-0 shadow-xl">
          <CardContent className="p-8 sm:p-12 lg:p-16 text-center">
            <School className="h-12 w-12 text-white mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Transform Your School?
            </h2>
            <p className="text-lg sm:text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of schools already using RSS to streamline their operations
              and enhance student success.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 w-full sm:w-auto px-8">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/admin/dashboard">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white text-white hover:bg-white/10 w-full sm:w-auto px-8"
                >
                  View Demo
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12 sm:mt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Image
                  src="/Logo/srs.png"
                  alt="RSS Logo"
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <span className="text-lg font-bold text-gray-900">RSS</span>
              </div>
              <p className="text-gray-600 text-sm">
                Empowering educational institutions with comprehensive management solutions.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/login" className="text-gray-600 hover:text-gray-900 text-sm">
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link href="/admin/dashboard" className="text-gray-600 hover:text-gray-900 text-sm">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/welcome" className="text-gray-600 hover:text-gray-900 text-sm">
                    About
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Contact</h3>
              <p className="text-gray-600 text-sm">
                For support and inquiries, please contact your system administrator.
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 text-center">
            <p className="text-gray-600 text-sm">
              © {new Date().getFullYear()} Remote School System. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

