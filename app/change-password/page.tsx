'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    passwordMatch?: string;
    passwordLength?: string;
    samePassword?: string;
    apiError?: string;
  }>({});
  const router = useRouter();
  const { user } = useAuth();

  // Validate all fields and return validation errors
  const validateForm = useCallback(() => {
    const newErrors: typeof errors = {};

    // Only validate if fields have values
    if (newPassword && confirmPassword) {
      // Check if new password and confirm password match
      if (newPassword !== confirmPassword) {
        newErrors.passwordMatch = 'New passwords do not match';
      }
    }

    // Check if password is at least 6 characters (only if newPassword has value)
    if (newPassword && newPassword.length < 6) {
      newErrors.passwordLength = 'Password must be at least 6 characters long';
    }

    // Check if current password and new password are the same
    if (currentPassword && newPassword && currentPassword === newPassword) {
      newErrors.samePassword = 'Current password and new password should not be the same';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [currentPassword, newPassword, confirmPassword]);

  // Validate on field changes (only if user has started typing)
  useEffect(() => {
    // Only validate if at least one field has a value
    if (currentPassword || newPassword || confirmPassword) {
      validateForm();
    } else {
      // Clear errors if all fields are empty
      setErrors({});
    }
  }, [currentPassword, newPassword, confirmPassword, validateForm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear API errors but keep validation errors
    setErrors(prev => {
      const { apiError, ...validationErrors } = prev;
      return validationErrors;
    });

    // Validate all fields (create a fresh validation)
    const validationErrors: typeof errors = {};
    
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      validationErrors.passwordMatch = 'New passwords do not match';
    }

    if (newPassword && newPassword.length < 6) {
      validationErrors.passwordLength = 'Password must be at least 6 characters long';
    }

    if (currentPassword && newPassword && currentPassword === newPassword) {
      validationErrors.samePassword = 'Current password and new password should not be the same';
    }
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Password change failed');
      }

      // Update user info to remove mustChangePassword flag
      const updatedUser = { ...user, mustChangePassword: false };
      localStorage.setItem('userInfo', JSON.stringify(updatedUser));

      // Redirect to appropriate dashboard
      switch(user?.role) {
        case 'SUPER_ADMIN':
          router.push('/super-admin/dashboard');
          break;
        case 'ADMIN':
          router.push('/admin/dashboard');
          break;
        case 'TEACHER':
          router.push('/teacher/dashboard');
          break;
        case 'STUDENT':
          router.push('/student/dashboard');
          break;
        case 'PARENT':
          router.push('/parent/dashboard');
          break;
        case 'NURSE':
          router.push('/nurse/dashboard');
          break;
        default:
          router.push('/dashboard');
      }
    } catch (err: any) {
      setErrors(prev => ({
        ...prev,
        apiError: err.message || 'Password change failed'
      }));
    } finally {
      setLoading(false);
    }
  };

  // Check if form has validation errors (excluding API errors)
  const hasValidationErrors = Object.keys(errors).some(key => key !== 'apiError' && errors[key as keyof typeof errors]);
  // Form is valid only if: all fields filled, no validation errors, and not loading
  const isFormValid = !hasValidationErrors && 
                      currentPassword.trim().length > 0 && 
                      newPassword.trim().length > 0 && 
                      confirmPassword.trim().length > 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Change Your Password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            You must change your password before continuing
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="current-password" className="sr-only">
                Current Password
              </label>
              <input
                id="current-password"
                name="current-password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Current Password (Temporary Password)"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="new-password" className="sr-only">
                New Password
              </label>
              <input
                id="new-password"
                name="new-password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="New Password (min 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirm-password" className="sr-only">
                Confirm New Password
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Display all validation errors */}
          {(errors.passwordMatch || errors.passwordLength || errors.samePassword || errors.apiError) && (
            <div className="rounded-md bg-red-50 p-4 space-y-2">
              {errors.passwordMatch && (
                <div className="text-sm text-red-700">• {errors.passwordMatch}</div>
              )}
              {errors.passwordLength && (
                <div className="text-sm text-red-700">• {errors.passwordLength}</div>
              )}
              {errors.samePassword && (
                <div className="text-sm text-red-700">• {errors.samePassword}</div>
              )}
              {errors.apiError && (
                <div className="text-sm text-red-700">• {errors.apiError}</div>
              )}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Changing Password...' : 'Change Password'}
            </button>
          </div>

          <div className="text-sm text-center text-gray-600">
            <p>Security Requirements:</p>
            <ul className="mt-2 text-xs">
              <li>• Password must be at least 6 characters long</li>
              <li>• Choose a strong, unique password</li>
              <li>• Avoid using personal information</li>
            </ul>
          </div>
        </form>
      </div>
    </div>
  );
}
