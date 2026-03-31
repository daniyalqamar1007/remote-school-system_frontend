"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle } from 'lucide-react'

export default function ParentAuthRestore() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const router = useRouter()

  const handleRestore = async () => {
    setIsLoading(true)
    setMessage('')
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'parent@defaultschool.edu',
          password: '123'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Store authentication data
        localStorage.setItem('authToken', data.access_token);
        localStorage.setItem('parentId', data.user._id);
        localStorage.setItem('id', data.user._id);
        localStorage.setItem('role', 'PARENT');
        
        const userProfile = {
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          email: data.user.email,
          role: 'PARENT'
        };
        localStorage.setItem('userProfile', JSON.stringify(userProfile));
        
        setMessage('Authentication restored successfully! Redirecting...');
        setIsSuccess(true);
        
        // Redirect to parent dashboard after a short delay
        setTimeout(() => {
          router.push('/parent/dashboard');
        }, 2000);
        
      } else {
        setMessage('Failed to restore authentication. Please check your credentials.');
        setIsSuccess(false);
      }
    } catch (error) {
      setMessage('Error connecting to server. Please try again.');
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Parent Portal Authentication</CardTitle>
          <CardDescription>
            Restore your parent portal access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Click the button below to restore your authentication for the parent portal.
          </p>
          
          <Button 
            onClick={handleRestore} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Restoring...' : 'Restore Parent Access'}
          </Button>
          
          {message && (
            <Alert className={isSuccess ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              {isSuccess ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={isSuccess ? 'text-green-800' : 'text-red-800'}>
                {message}
              </AlertDescription>
            </Alert>
          )}
          
          <Button 
            variant="outline" 
            onClick={() => router.push('/')}
            className="w-full"
          >
            Back to Login
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
