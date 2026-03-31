'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PasswordChangePopupProps {
  isOpen: boolean;
  onClose: (success: boolean) => void;
  userRole: string;
}

export default function PasswordChangePopup({ isOpen, onClose, userRole }: PasswordChangePopupProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{
    passwordMatch?: string;
    passwordLength?: string;
    samePassword?: string;
    apiError?: string;
  }>({});
  const { toast } = useToast();

  // Validate all fields and return validation errors
  const validateForm = useCallback(() => {
    const newErrors: typeof errors = {};

    // Check if new password and confirm password match (only if both have values)
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      newErrors.passwordMatch = 'New passwords do not match';
    }

    // Check if password is at least 6 characters (only if newPassword has value)
    if (newPassword && newPassword.length < 6) {
      newErrors.passwordLength = 'Password must be at least 6 characters long';
    }

    // Check if current password and new password are the same
    if (currentPassword && newPassword && currentPassword === newPassword) {
      newErrors.samePassword = 'Current password and new password should not be the same';
    }

    setErrors(prev => {
      // Keep API errors, update validation errors
      const { apiError } = prev;
      return { ...newErrors, ...(apiError ? { apiError } : {}) };
    });
    
    return Object.keys(newErrors).length === 0;
  }, [currentPassword, newPassword, confirmPassword]);

  // Validate on field changes (real-time validation)
  useEffect(() => {
    if (currentPassword || newPassword || confirmPassword) {
      validateForm();
    } else {
      // Clear validation errors if all fields are empty (but keep API errors)
      setErrors(prev => {
        const { apiError } = prev;
        return apiError ? { apiError } : {};
      });
    }
  }, [currentPassword, newPassword, confirmPassword, validateForm]);

  // Check if form has validation errors (excluding API errors)
  const hasValidationErrors = Object.keys(errors).some(key => key !== 'apiError' && errors[key as keyof typeof errors]);
  // Form is valid only if: all fields filled, no validation errors, and not loading
  const isFormValid = !hasValidationErrors && 
                      currentPassword.trim().length > 0 && 
                      newPassword.trim().length > 0 && 
                      confirmPassword.trim().length > 0;

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
      console.log('PasswordChangePopup - Token from localStorage:', token ? token.substring(0, 20) + '...' : 'null');
      console.log('PasswordChangePopup - Current localStorage keys:', Object.keys(localStorage));
      
      if (!token) {
        throw new Error('No access token found. Please login again.');
      }
      
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

      console.log('PasswordChangePopup - Response status:', response.status);
      
      if (!response.ok) {
        const data = await response.json();
        console.log('PasswordChangePopup - Error response:', data);
        throw new Error(data.message || 'Password change failed');
      }

      // Update user info to remove mustChangePassword flag
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        const user = JSON.parse(userInfo);
        user.mustChangePassword = false;
        localStorage.setItem('userInfo', JSON.stringify(user));
      }

      toast({
        title: "Success",
        description: "Password changed successfully! You can now access the system.",
        duration: 5000,
      });

      toast({
        title: "Success",
        description: "Password changed successfully! You can now access the system.",
        duration: 5000,
      });

      onClose(true);
    } catch (err: any) {
      console.error('❌ Password change error:', err);
      const errorMessage = err.message || 'Password change failed';
      
      setErrors(prev => ({
        ...prev,
        apiError: errorMessage
      }));
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
        duration: 15000,
      });
      
      // IMPORTANT: Don't call onClose on error - popup must stay open
      // User needs to see the error and try again
      setLoading(false);
      // Popup remains open, user can correct the error and try again
    }
  };

  const handleClose = () => {
    // Prevent closing the dialog until password is successfully changed
    return false;
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => false}>
      <DialogContent 
        className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto" 
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Password Change Required
          </DialogTitle>
          <DialogDescription>
            For security purposes, you must change your temporary password before accessing the system.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password (Temporary Password)</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your temporary password"
                required
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter your new password"
                required
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                required
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Display all validation errors */}
          {(errors.passwordMatch || errors.passwordLength || errors.samePassword || errors.apiError) && (
            <div className="rounded-md bg-red-50 p-4 space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-red-800 mb-2">Please fix the following errors:</h3>
              <div className="space-y-1">
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
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="submit"
              disabled={loading || !isFormValid}
              className="w-full"
            >
              {loading ? 'Changing Password...' : 'Change Password'}
            </Button>
          </DialogFooter>
        </form>

        <div className="text-xs text-gray-500 text-center">
          This dialog cannot be closed until you change your password for security reasons.
        </div>
      </DialogContent>
    </Dialog>
  );
}
