"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Mail, UserCog, Loader2 } from 'lucide-react'
import axios from 'axios'

interface ForgotPasswordModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState('')
  const [selectedOption, setSelectedOption] = useState<'email' | 'admin' | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleEmailReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_SRS_SERVER}/auth/forgot-password`, {
        email: email.toLowerCase().trim()
      })

      if (response.data.success || response.status === 200) {
        setSuccess(true)
      } else {
        throw new Error(response.data.message || 'Failed to send reset email')
      }
    } catch (err: any) {
      console.error('Password reset error:', err)
      // Don't reveal if email exists or not for security
      setError(err?.response?.data?.message || 'If an account exists with this email, a password reset link has been sent.')
      // Still show success message for security (don't reveal if email exists)
      setSuccess(true)
    } finally {
      setLoading(false)
    }
  }

  const handleAdminRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_SRS_SERVER}/auth/request-admin-reset`, {
        email: email.toLowerCase().trim()
      })

      if (response.data.success || response.status === 200) {
        setSuccess(true)
      } else {
        throw new Error(response.data.message || 'Failed to send request to admin')
      }
    } catch (err: any) {
      console.error('Admin request error:', err)
      setError(err?.response?.data?.message || 'Failed to send request. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setEmail('')
    setSelectedOption(null)
    setSuccess(false)
    setError('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            Choose how you'd like to reset your password
          </DialogDescription>
        </DialogHeader>

        {!selectedOption && !success ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="reset-email" className="text-sm font-medium text-gray-700">
                Email Address
              </label>
              <Input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                className="w-full"
              />
            </div>

            <div className="grid gap-3">
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start h-auto p-4"
                onClick={() => setSelectedOption('email')}
                disabled={!email.trim()}
              >
                <div className="flex items-start gap-3 w-full">
                  <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-left flex-1">
                    <div className="font-semibold">Email Verification</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Receive a password reset link via email
                    </div>
                  </div>
                </div>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full justify-start h-auto p-4"
                onClick={() => setSelectedOption('admin')}
                disabled={!email.trim()}
              >
                <div className="flex items-start gap-3 w-full">
                  <UserCog className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div className="text-left flex-1">
                    <div className="font-semibold">Request Admin Reset</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Send a request to your administrator to reset your password
                    </div>
                  </div>
                </div>
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleClose}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : success ? (
          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">
                {selectedOption === 'email' 
                  ? 'If an account exists with this email, a password reset link has been sent. Please check your inbox and follow the instructions.'
                  : 'Your password reset request has been sent to the administrator. You will be notified once your password has been reset.'}
              </AlertDescription>
            </Alert>
            <Button
              type="button"
              className="w-full"
              onClick={handleClose}
            >
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={selectedOption === 'email' ? handleEmailReset : handleAdminRequest} className="space-y-4">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-600">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label htmlFor="confirm-email" className="text-sm font-medium text-gray-700">
                Confirm Email Address
              </label>
              <Input
                id="confirm-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
                className="w-full"
                disabled={loading}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                {selectedOption === 'email' 
                  ? 'A password reset link will be sent to your email address. Click the link in the email to reset your password.'
                  : 'A request will be sent to your system administrator. They will reset your password and notify you once it\'s done.'}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setSelectedOption(null)
                  setError('')
                }}
                disabled={loading}
              >
                Back
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={loading || !email.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : selectedOption === 'email' ? (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Reset Link
                  </>
                ) : (
                  <>
                    <UserCog className="mr-2 h-4 w-4" />
                    Request Reset
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

