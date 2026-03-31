'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import Image from 'next/image';
import PasswordChangePopup from '@/components/PasswordChangePopup';
import ForgotPasswordModal from '@/components/ForgotPasswordModal';
import RouteGuard from '@/components/RouteGuard';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_SRS_SERVER || 'http://localhost:3014';

function LoginPageContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswordChangePopup, setShowPasswordChangePopup] = useState(false);
  const [tempUser, setTempUser] = useState<any>(null);
  const [showMFAInput, setShowMFAInput] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaEmail, setMfaEmail] = useState('');
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const router = useRouter();

  // Clear any existing authentication data when page loads to prevent conflicts
  useEffect(() => {
    // Only clear if we're not in the middle of a password change process
    // and there's no tempUser data (which would indicate a password change flow)
    if (!showPasswordChangePopup && !tempUser) {
      console.log('Clearing localStorage on page load');
      localStorage.removeItem('userProfile');
      localStorage.removeItem('userInfo');
      localStorage.removeItem('parentId');
      localStorage.removeItem('authToken');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('role');
      localStorage.removeItem('id');
    }
  }, [showPasswordChangePopup, tempUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Clear any old cached data FIRST to prevent conflicts
      // But be selective - only clear if it's from a different user AND we're not in password change flow
      if (!showPasswordChangePopup && !tempUser) {
        const existingUserInfo = localStorage.getItem('userInfo');
        if (existingUserInfo) {
          try {
            const parsedUserInfo = JSON.parse(existingUserInfo);
            if (parsedUserInfo.email !== email) {
              // Different user, clear everything
              console.log('Clearing localStorage for different user:', parsedUserInfo.email, 'vs', email);
              localStorage.removeItem('userProfile');
              localStorage.removeItem('userInfo');
              localStorage.removeItem('parentId');
              localStorage.removeItem('authToken');
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              localStorage.removeItem('role');
              localStorage.removeItem('id');
            }
          } catch {
            // Invalid JSON, clear everything
            console.log('Clearing localStorage due to invalid JSON');
            localStorage.removeItem('userProfile');
            localStorage.removeItem('userInfo');
            localStorage.removeItem('parentId');
            localStorage.removeItem('authToken');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('role');
            localStorage.removeItem('id');
          }
        }
      }
      
      // Debug logging
      const serverUrl = API_BASE_URL;
      console.log('Attempting to connect to:', `${serverUrl}/auth/login`);
      
      // Use only the unified authentication system
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password
      });
      
      if (!response) {
        throw new Error('Network error: Could not connect to server');
      }

      console.log('Login response:', response.data);
      console.log('Login response success:', response.data.success);

      if (response.data.success === false) {
        console.log('Login failed:', response.data.message);
        throw new Error(response.data.message || 'Login failed. Please check your credentials.');
      }
      
      const data = response.data.data;
      
      console.log('Login response data:', data);
      console.log('Login successful for:', data.user?.email);
      console.log('mustChangePassword:', data.user?.mustChangePassword);
      console.log('requiresMFA:', (data as any).requiresMFA);
      console.log('Available tokens:', {
        accessToken: data.accessToken || data.access_token,
        refreshToken: data.refreshToken || data.refresh_token
      });

      // Check if MFA is required
      if ((data as any).requiresMFA) {
        console.log('MFA required, showing MFA input');
        setMfaEmail(email);
        setShowMFAInput(true);
        setError('');
        
        // Log the MFA code for development (remove in production)
        if ((data as any).mfaCode) {
          console.log('🔐 MFA Code (DEV ONLY):', (data as any).mfaCode);
          alert(`Development MFA Code: ${(data as any).mfaCode}`);
        }
        return;
      }

      // Check if OTP is required (after successful email/password verification)
      if ((data as any).requiresOTP) {
        console.log('OTP required, redirecting to OTP page');
        // Redirect to OTP verification page with email as query parameter
        router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
        return;
      }
      
      // Check if user must change password before storing tokens
      if (data.user.mustChangePassword === true) {
        console.log('User must change password, showing popup');
        
        // Store the access token temporarily for password change API call
        // Try both possible token field names
        const accessToken = data.accessToken || data.access_token;
        const refreshToken = data.refreshToken || data.refresh_token;
        
        if (!accessToken) {
          throw new Error('No access token received from server');
        }
        
        localStorage.setItem('accessToken', accessToken);
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }
        localStorage.setItem('userInfo', JSON.stringify(data.user));
        
        console.log('Stored tokens for password change:', { accessToken: accessToken.substring(0, 20) + '...' });
        
        setTempUser(data); // Store the login data temporarily
        setShowPasswordChangePopup(true);
        return; // Don't proceed with normal login flow
      }
      
      // Normal login flow - store tokens and redirect
      await completeLogin(data);
      
    } catch (err: any) {
      console.error('Login error:', err);
      // Safely extract error message
      const errorMessage = 
        err?.response?.data?.message || 
        err?.message || 
        'Login failed. Please check your credentials.'
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleMFASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Debug: Check if email is available
    console.log('MFA Submit - Email:', mfaEmail, 'Code:', mfaCode);
    
    if (!mfaEmail) {
      setError('Email information missing. Please try logging in again.');
      setLoading(false);
      setShowMFAInput(false);
      return;
    }

    if (!mfaCode || mfaCode.length !== 6) {
      setError('Please enter a valid 6-digit verification code.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-mfa`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: mfaEmail,
          mfaCode: mfaCode 
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          throw new Error('Invalid verification code. Please check and try again.');
        }
        throw new Error(errorData.message || 'MFA verification failed');
      }

      const data = await response.json();
      console.log('MFA verification successful:', data);

      // Complete login after successful MFA
      await completeLogin(data);

    } catch (err: any) {
      console.error('MFA verification error:', err);
      setError(err.message || 'MFA verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMFAResend = async () => {
    if (!mfaEmail) {
      setError('Email information missing. Please try logging in again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Trigger a new login attempt to get a fresh MFA code
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: mfaEmail, password: 'resend-mfa' }),
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if ((data as any).requiresMFA) {
          setError('');
          alert('New verification code sent to your email!');
        }
      } else {
        // Use a dedicated resend endpoint if available
        const resendResponse = await fetch(`${API_BASE_URL}/auth/resend-mfa`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: mfaEmail }),
          credentials: 'include'
        });

        if (resendResponse.ok) {
          alert('New verification code sent to your email!');
        } else {
          setError('Failed to resend code. Please try logging in again.');
        }
      }
    } catch (err: any) {
      console.error('MFA resend error:', err);
      setError('Failed to resend code. Please try logging in again.');
    } finally {
      setLoading(false);
    }
  };

  const completeLogin = async (data: any) => {
    try {
      console.log('🔄 Starting completeLogin with data:', data);
      
      // Clear any old cached data first to prevent showing wrong user info
      localStorage.removeItem('userProfile');
      localStorage.removeItem('userInfo');
      localStorage.removeItem('parentId');
      localStorage.removeItem('authToken');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('role');
      localStorage.removeItem('id');
      
      // Store tokens securely
      let authToken = null;
      
      if (data.access_token) {
        authToken = data.access_token;
        localStorage.setItem('accessToken', data.access_token);
        localStorage.setItem('authToken', data.access_token);
        console.log('✅ Stored access_token');
        if (data.refresh_token) {
          localStorage.setItem('refreshToken', data.refresh_token);
          console.log('✅ Stored refresh_token');
        }
      }
      
      if (data.token && !authToken) {
        authToken = data.token;
        localStorage.setItem('accessToken', data.token);
        localStorage.setItem('authToken', data.token);
        console.log('✅ Stored token');
      }
      
      if (!authToken) {
        console.error('❌ No auth token found in data:', data);
        throw new Error('No authentication token received. Please try again.');
      }
      
      console.log('🔐 Stored authToken:', !!authToken);
      
      // Store user info
      const userInfo = data.user || data;
      if (!userInfo) {
        console.error('❌ No user info found in data:', data);
        throw new Error('No user information received. Please try again.');
      }
      
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
      console.log('✅ Stored userInfo:', userInfo.email);
      
      const userRole = userInfo.role || userInfo.type;
      const rolesList = userInfo.roles && Array.isArray(userInfo.roles) ? userInfo.roles : (userRole ? [userRole] : []);
      if (!userRole && (!rolesList || rolesList.length === 0)) {
        console.error('❌ No role found in userInfo:', userInfo);
        throw new Error('No user role found. Please contact administrator.');
      }
      
      const userId = userInfo._id || userInfo.id;
      if (userId) {
        localStorage.setItem('id', userId);
        console.log('✅ Stored userId:', userId);
      }
      
      if (rolesList.length > 1) {
        localStorage.setItem('role', rolesList[0]);
        console.log('✅ Multiple roles, redirecting to select dashboard');
        router.push('/select-dashboard');
        return;
      }
      
      const singleRole = userRole || rolesList[0];
      localStorage.setItem('role', singleRole);
      console.log('✅ Stored role:', singleRole);
      
      if (singleRole === 'Parent' || singleRole === 'PARENT') {
        localStorage.setItem('parentId', userInfo._id || userInfo.id);
        localStorage.setItem('authToken', data.token || data.access_token);
      }
      
      console.log('🚀 Redirecting to dashboard for role:', singleRole);
      switch(singleRole) {
        case 'SuperAdmin':
        case 'SUPER_ADMIN':
          router.push('/super-admin/dashboard');
          break;
        case 'Admin':
        case 'ADMIN':
          router.push('/admin/dashboard');
          break;
        case 'Teacher':
        case 'TEACHER':
          router.push('/teacher/dashboard');
          break;
        case 'Student':
        case 'STUDENT':
          router.push('/student/profile');
          break;
        case 'Parent':
        case 'PARENT':
          router.push('/parent/dashboard');
          break;
        case 'Nurse':
        case 'NURSE':
          router.push('/nurse/dashboard');
          break;
        case 'Secretary':
        case 'SECRETARY':
          router.push('/secretary');
          break;
        default:
          console.warn('⚠️ Unknown role, redirecting to default dashboard');
          router.push('/dashboard');
      }
    } catch (error: any) {
      console.error('❌ Error in completeLogin:', error);
      throw error; // Re-throw to let caller handle it
    }
  };

  const handlePasswordChangeComplete = (success: boolean) => {
    console.log('Password change completed, success:', success);
    
    setShowPasswordChangePopup(false);
    if (success && tempUser) {
      // Now clear old cached data and set new data
      localStorage.removeItem('userProfile');
      localStorage.removeItem('parentId');
      localStorage.removeItem('authToken');
      
      // Update the user data to remove mustChangePassword flag
      const updatedUser = { ...tempUser.user, mustChangePassword: false };
      const updatedData = { ...tempUser, user: updatedUser };
      
      console.log('Completing login for user:', updatedUser.email);
      // Complete the login process with updated data
      completeLogin(updatedData);
    } else {
      // If password change failed, clear everything
      localStorage.removeItem('userProfile');
      localStorage.removeItem('userInfo');
      localStorage.removeItem('parentId');
      localStorage.removeItem('authToken');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('role');
      localStorage.removeItem('id');
    }
    setTempUser(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-md border border-gray-100">
            <Image
              src="/Logo/srs.png"
              alt="SRS Logo"
              width={56}
              height={56}
              className="w-14 h-14 rounded-full object-cover"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Student Revelation System
          </CardTitle>
          <p className="text-gray-600">Sign in to access your portal</p>
        </CardHeader>
        <CardContent>
          {!showMFAInput ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-600">{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full"
                  disabled={loading}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full pr-10"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowForgotPasswordModal(true);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-black hover:bg-gray-800 text-white" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>
          </form>
          ) : (
            <form onSubmit={handleMFASubmit} className="space-y-4">
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-600">{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="text-center mb-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">🔐 Security Verification</h3>
                  <p className="text-sm text-blue-700">
                    We've sent a 6-digit verification code to:
                  </p>
                  <p className="text-sm font-medium text-blue-800 mt-1">
                    {mfaEmail}
                  </p>
                </div>
                <p className="text-sm text-gray-600">
                  Please check your email and enter the verification code below
                </p>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="mfaCode" className="text-sm font-medium text-gray-700">
                  Verification Code
                </label>
                <Input
                  id="mfaCode"
                  type="text"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  required
                  className="w-full text-center text-lg tracking-widest"
                  disabled={loading}
                  maxLength={6}
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-black hover:bg-gray-800 text-white" 
                disabled={loading || mfaCode.length !== 6}
              >
                {loading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Verifying...
                  </>
                ) : (
                  'Verify Code'
                )}
              </Button>
              
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline"
                  className="flex-1" 
                  onClick={handleMFAResend}
                  disabled={loading}
                >
                  Resend Code
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline"
                  className="flex-1" 
                  onClick={() => {
                    setShowMFAInput(false);
                    setMfaCode('');
                    setMfaEmail('');
                    setError('');
                  }}
                  disabled={loading}
                >
                  Back to Login
                </Button>
              </div>
            </form>
          )}
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Having trouble? Contact your system administrator
            </p>
          </div>
        </CardContent>
      </Card>
      
      {/* Password Change Popup */}
      {showPasswordChangePopup && tempUser && (
        <PasswordChangePopup
          isOpen={showPasswordChangePopup}
          onClose={handlePasswordChangeComplete}
          userRole={tempUser.user?.role || 'STUDENT'}
        />
      )}

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
      />
    </div>
  );
}

export default function LoginPage() {
  return (
    <RouteGuard allowUnauthenticated>
      <LoginPageContent />
    </RouteGuard>
  );
}
