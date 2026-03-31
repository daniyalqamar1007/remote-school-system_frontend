'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Clock, ArrowLeft } from 'lucide-react';
import PasswordChangePopup from '@/components/PasswordChangePopup';

function VerifyOTPContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60); // 1 minute in seconds (display only, backend allows 2 minutes)
  const [canResend, setCanResend] = useState(false);
  const [showPasswordChangePopup, setShowPasswordChangePopup] = useState(false);
  const [tempUserData, setTempUserData] = useState<any>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const isVerifyingRef = useRef(false); // Prevent duplicate submissions

  useEffect(() => {
    // If no email, redirect to login
    if (!email) {
      // router.push('/login');
      return;
    }

    // Focus first input on mount
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
  }, [email, router]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      setCanResend(true);
    }
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only take the last character
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6).replace(/\D/g, '');
    if (pastedData.length === 6) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      setError('');
      inputRefs.current[5]?.focus();
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
      
      // Check if user must change password - handle boolean or string values
      const mustChangePassword = userInfo.mustChangePassword === true || 
                                 userInfo.mustChangePassword === 'true' || 
                                 userInfo.mustChangePassword === 1;
      
      console.log('🔐 mustChangePassword check:', { 
        mustChangePassword, 
        value: userInfo.mustChangePassword,
        type: typeof userInfo.mustChangePassword 
      });
      
      // If user must change password, show popup instead of redirecting
      if (mustChangePassword) {
        console.log('⚠️ User must change password, showing popup');
        
        // Store tokens temporarily for password change API call
        localStorage.setItem('accessToken', authToken);
        if (data.refresh_token || data.refreshToken) {
          localStorage.setItem('refreshToken', data.refresh_token || data.refreshToken);
        }
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
        
        // Store role and user ID
        const userRole = userInfo.role || userInfo.type;
        if (userRole) {
          localStorage.setItem('role', userRole);
        }
        const userId = userInfo._id || userInfo.id;
        if (userId) {
          localStorage.setItem('id', userId);
        }
        
        // Set temp user data and show password change popup
        setTempUserData({ ...data, user: userInfo });
        setShowPasswordChangePopup(true);
        return; // Don't redirect, wait for password change
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent duplicate submissions
    if (loading || isVerifyingRef.current) {
      console.log('⚠️ Already processing, ignoring duplicate submit');
      return;
    }
    
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      setError('Please enter a complete 6-digit OTP');
      return;
    }

    if (!email) {
      setError('Email information missing. Please try logging in again.');
      return;
    }

    // Set flag to prevent duplicate requests
    isVerifyingRef.current = true;
    setLoading(true);
    setError('');

    try {
      console.log('🔄 Starting OTP verification for:', email);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/auth/verify-otp`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: email,
          otpCode: otpString 
        }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('OTP verification error response:', errorData);
        
        // Extract error message from wrapped response
        const errorMessage = errorData.message || errorData.error || 'OTP verification failed';
        
        // For ADMIN role with "No school assigned" error, show error on page without redirecting
        const lowerErrorMessage = errorMessage.toLowerCase();
        if (lowerErrorMessage.includes('no school') || 
            lowerErrorMessage.includes('school is assigned') ||
            lowerErrorMessage.includes('school assigned') ||
            lowerErrorMessage.includes('assigned to this admin')) {
          console.log('⚠️ Admin has no school assigned - showing error on page');
          setError(errorMessage);
          setLoading(false);
          isVerifyingRef.current = false;
          // Clear OTP inputs
          setOtp(['', '', '', '', '', '']);
          // Focus first input
          setTimeout(() => {
            inputRefs.current[0]?.focus();
          }, 100);
          return; // Don't throw error, just show it on the page - stay on verify-otp page
        }
        
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      console.log('✅ OTP verification response received:', responseData);

      // Backend uses customResponse which wraps data in { success, statusCode, message, data }
      // Extract the actual data from the wrapped response
      const data = responseData.data || responseData;
      
      console.log('📦 Extracted OTP verification data:', data);

      // Check if response has the expected structure
      if (!data || (!data.access_token && !data.accessToken)) {
        console.error('❌ Missing access_token in response:', data);
        throw new Error('Invalid response from server. Please try again.');
      }

      // Format data for completeLogin function
      const loginData = {
        access_token: data.access_token || data.accessToken,
        refresh_token: data.refresh_token || data.refreshToken,
        token: data.access_token || data.accessToken,
        user: {
          _id: data.user?.id || data.user?._id,
          id: data.user?.id || data.user?._id,
          email: data.user?.email || email,
          role: data.user?.role,
          type: data.user?.role,
          schoolId: data.user?.schoolId,
          mustChangePassword: data.user?.mustChangePassword || false,
          profile: data.user?.profile,
          ...data.user,
        }
      };

      console.log('✅ Formatted login data for completeLogin:', loginData);

      // Check if user is ADMIN and has no school assigned - show error on page
      const userRole = data.user?.role || data.user?.type;
      const userSchoolId = data.user?.schoolId;
      
      if (userRole === 'ADMIN' || userRole === 'Admin') {
        if (!userSchoolId) {
          const errorMsg = 'No school is assigned to this admin. Please contact the administrator to assign a school.';
          setError(errorMsg);
          setLoading(false);
          isVerifyingRef.current = false;
          // Clear OTP inputs
          setOtp(['', '', '', '', '', '']);
          // Focus first input
          setTimeout(() => {
            inputRefs.current[0]?.focus();
          }, 100);
          return; // Stay on page, don't proceed with login
        }
      }

      // Complete login after successful OTP verification
      // This will store tokens and redirect to dashboard
      try {
        await completeLogin(loginData);
        // If completeLogin succeeds, redirect will happen
        // Don't reset flags as we're redirecting
        return; // Exit early to prevent any further execution
      } catch (loginError: any) {
        console.error('❌ Error in completeLogin:', loginError);
        
        // For ADMIN role errors, show on page without redirecting
        const loginErrorMessage = loginError.message || 'Failed to complete login. Please try again.';
        if ((userRole === 'ADMIN' || userRole === 'Admin') && 
            (loginErrorMessage.toLowerCase().includes('school') || 
             loginErrorMessage.toLowerCase().includes('no school'))) {
          setError(loginErrorMessage);
          setLoading(false);
          isVerifyingRef.current = false;
          // Clear OTP inputs
          setOtp(['', '', '', '', '', '']);
          // Focus first input
          setTimeout(() => {
            inputRefs.current[0]?.focus();
          }, 100);
          return; // Stay on page, don't redirect
        }
        
        throw new Error(loginErrorMessage);
      }

    } catch (err: any) {
      console.error('❌ OTP verification error:', err);
      // Show error but stay on OTP page
      const errorMessage = err?.message || err?.response?.data?.message || 'OTP verification failed. Please try again.';
      
      // For ADMIN role errors related to school, always stay on page and show error
      const lowerErrorMessage = errorMessage.toLowerCase();
      const isAdminSchoolError = lowerErrorMessage.includes('school') || 
                                 lowerErrorMessage.includes('assigned to this admin') ||
                                 lowerErrorMessage.includes('no school is assigned');
      
      if (isAdminSchoolError) {
        console.log('⚠️ Admin school error detected - staying on verify-otp page');
      }
      
      setError(errorMessage);
      // Clear OTP inputs only on error
      setOtp(['', '', '', '', '', '']);
      // Focus first input
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
      setLoading(false); // Only set loading to false on error
      isVerifyingRef.current = false; // Reset flag on error
      
      // IMPORTANT: Don't redirect for any errors - always stay on verify-otp page
      // This ensures admin errors are shown on the page itself
    }
  };

  const handleResend = async () => {
    if (!canResend || resendLoading || !email) return;

    setResendLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/auth/resend-otp`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Failed to resend OTP');
      }

      const data = await response.json();
      console.log('OTP resent successfully:', data);
      
      // Reset OTP inputs and timer on successful resend
      setOtp(['', '', '', '', '', '']);
      setTimeLeft(60); // 1 minute in seconds (display only, backend allows 2 minutes)
      setCanResend(false);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      console.error('OTP resend error:', err);
      const errorMessage = err?.message || err?.response?.data?.message || 'Failed to resend OTP. Please try again.';
      setError(errorMessage);
    } finally {
      setResendLoading(false);
    }
  };

  if (!email) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-1 text-center bg-black text-white rounded-t-lg">
          <div className="mx-auto w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-md">
            <Mail className="h-8 w-8 text-black" />
          </div>
          <CardTitle className="text-2xl font-bold">OTP Verification</CardTitle>
          <p className="text-gray-200 text-sm">Enter the 6-digit code sent to your email</p>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-600">{error}</AlertDescription>
              </Alert>
            )}

            <div className="text-center mb-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-700 mb-1">
                  We've sent a 6-digit OTP to:
                </p>
                <p className="text-sm font-medium text-blue-800">
                  {email}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <label htmlFor="otp" className="text-sm font-medium text-gray-700 block text-center">
                Enter OTP Code
              </label>
              <div className="flex justify-center gap-2" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-14 text-center text-2xl font-bold tracking-widest border-2 focus:border-black"
                    disabled={loading}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>
                {timeLeft > 0 ? (
                  <>Code expires in <strong>{formatTime(timeLeft)}</strong></>
                ) : (
                  <span className="text-red-600">Code expired</span>
                )}
              </span>
            </div>

            <Button
              type="submit"
              className="w-full bg-black hover:bg-gray-800 text-white"
              disabled={loading || otp.join('').length !== 6 || timeLeft === 0}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : timeLeft === 0 ? (
                'OTP Expired - Please Resend'
              ) : (
                'Verify OTP'
              )}
            </Button>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleResend}
                disabled={!canResend || resendLoading || loading}
              >
                {resendLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Resend OTP'
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => router.push('/login')}
                disabled={loading || resendLoading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </div>

            <div className="text-center text-sm text-gray-600">
              <p>Didn't receive the code? Check your spam folder or try resending.</p>
            </div>
          </form>
        </CardContent>
      </Card>
      
      {/* Password Change Popup - Show when mustChangePassword is true */}
      {showPasswordChangePopup && tempUserData && (
        <PasswordChangePopup
          isOpen={showPasswordChangePopup}
          onClose={(success) => {
            // Only handle success case - on error, popup stays open (onClose is not called)
            if (success) {
              console.log('✅ Password changed successfully, redirecting to portal');
              const userInfo = localStorage.getItem('userInfo');
              if (userInfo) {
                try {
                  const user = JSON.parse(userInfo);
                  user.mustChangePassword = false;
                  localStorage.setItem('userInfo', JSON.stringify(user));
                } catch (e) {
                  console.error('Error updating userInfo:', e);
                }
              }
              const rolesList = tempUserData.user?.roles && Array.isArray(tempUserData.user.roles) ? tempUserData.user.roles : [];
              const userRole = tempUserData.user?.role || tempUserData.user?.type || localStorage.getItem('role');
              setShowPasswordChangePopup(false);
              if (rolesList.length > 1) {
                router.push('/select-dashboard');
                return;
              }
              const singleRole = userRole || rolesList[0];
              console.log('🚀 Redirecting to portal for role:', singleRole);
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
                  console.warn('⚠️ Unknown role, redirecting to login');
                  router.push('/login');
              }
            }
            // If success is false, don't close popup - let user see error and try again
          }}
          userRole={tempUserData.user?.role || tempUserData.user?.type || 'USER'}
        />
      )}
    </div>
  );
}

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-black" />
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <VerifyOTPContent />
    </Suspense>
  );
}
