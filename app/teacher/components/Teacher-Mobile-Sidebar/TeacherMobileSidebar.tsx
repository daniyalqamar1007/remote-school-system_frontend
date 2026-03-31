import React, { useEffect, useState } from 'react'
import {  Menu} from "lucide-react"
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { usePathname } from 'next/navigation'
import MobileNavProfile from '@/components/MobileNavProfile'

const TeacherMobileSidebar = ({isSidebarOpen,setIsSidebarOpen}:{isSidebarOpen:boolean,setIsSidebarOpen:any})=> {
    const pathname = usePathname()
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Close sidebar when route changes on mobile
  useEffect(() => {
    setIsSidebarOpen(false)
  }, [pathname])


  if (!isMounted) {
    return null
  }

  return (
    <>
    {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    <div className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b bg-white px-4 shadow-sm sm:gap-x-6 lg:hidden">
    <Button
      variant="ghost"
      size="icon"
      className="-m-2.5 p-2.5 text-gray-700"
      onClick={() => setIsSidebarOpen(true)}
    >
      <span className="sr-only">Open sidebar</span>
      <Menu className="h-6 w-6" />
    </Button>

    {/* Logo for Mobile */}
    <div className="flex flex-1 items-center gap-x-3">
      <Image src={'/Logo/srs.png'} alt='srs logo' height={8} width={8}  className="h-8 w-8 rounded-full" />
      <span className="text-xl font-semibold">SRS Teacher</span>
    </div>

    {/* Mobile Profile Menu */}
    <MobileNavProfile/>
  </div>
  </>

  )
}

export default TeacherMobileSidebar