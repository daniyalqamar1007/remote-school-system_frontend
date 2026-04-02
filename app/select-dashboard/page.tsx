'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

const ROLE_LABELS: { [key: string]: string } = {
  SUPER_ADMIN: 'Super Admin',
  SuperAdmin: 'Super Admin',
  ADMIN: 'Admin',
  Admin: 'Admin',
  TEACHER: 'Teacher',
  Teacher: 'Teacher',
  STUDENT: 'Student',
  Student: 'Student',
  PARENT: 'Parent',
  Parent: 'Parent',
  NURSE: 'Nurse',
  Nurse: 'Nurse',
  SECRETARY: 'Secretary',
  Secretary: 'Secretary',
};

const ROLE_PATHS: { [key: string]: string } = {
  SUPER_ADMIN: '/super-admin/dashboard',
  SuperAdmin: '/super-admin/dashboard',
  ADMIN: '/admin/dashboard',
  Admin: '/admin/dashboard',
  TEACHER: '/teacher/dashboard',
  Teacher: '/teacher/dashboard',
  STUDENT: '/student/profile',
  Student: '/student/profile',
  PARENT: '/parent/dashboard',
  Parent: '/parent/dashboard',
  NURSE: '/nurse/dashboard',
  Nurse: '/nurse/dashboard',
  SECRETARY: '/secretary',
  Secretary: '/secretary',
};

export default function SelectDashboardPage() {
  const router = useRouter();
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('authToken');
    const userInfoStr = localStorage.getItem('userInfo');
    if (!token || !userInfoStr) {
      router.replace('/login');
      return;
    }
    let userInfo: { roles?: string[]; role?: string } = {};
    try {
      userInfo = JSON.parse(userInfoStr);
    } catch {
      router.replace('/login');
      return;
    }
    const roleList = userInfo.roles && Array.isArray(userInfo.roles) && userInfo.roles.length > 1
      ? userInfo.roles
      : userInfo.role
        ? [userInfo.role]
        : [];
    if (roleList.length <= 1) {
      const singleRole = roleList[0] || userInfo.role;
      if (singleRole && ROLE_PATHS[singleRole]) {
        router.replace(ROLE_PATHS[singleRole]);
        return;
      }
      router.replace('/login');
      return;
    }
    setRoles(roleList);
    setLoading(false);
  }, [router]);

  const handleSelect = (role: string) => {
    localStorage.setItem('role', role);
    const userInfoStr = localStorage.getItem('userInfo');
    if (userInfoStr) {
      try {
        const userInfo = JSON.parse(userInfoStr) as { _id?: string; id?: string; roleIds?: Record<string, string> };
        const roleId = userInfo.roleIds?.[role] || userInfo.roleIds?.[role.toUpperCase()];
        if (roleId) {
          localStorage.setItem('id', roleId);
        }
        if (role === 'Parent' || role === 'PARENT') {
          const parentId = roleId || userInfo._id || userInfo.id || '';
          localStorage.setItem('parentId', parentId);
        }
      } catch {}
    }
    const path = ROLE_PATHS[role] || '/dashboard';
    router.push(path);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-md border border-gray-100">
            <Image src="/Logo/srs.png" alt="RSS Logo" width={56} height={56} />
          </div>
          <CardTitle>Which dashboard do you want to access?</CardTitle>
          <p className="text-sm text-muted-foreground">
            Your account has access to more than one portal. Choose one to continue.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {roles.map((role) => (
            <Button
              key={role}
              variant="outline"
              className="w-full justify-start h-12 text-left"
              onClick={() => handleSelect(role)}
            >
              {ROLE_LABELS[role] || role}
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
