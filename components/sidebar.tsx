import React from 'react'
import { Bell, Calendar, ChevronDown, Layout, MessageSquare, PieChart, Search, Settings, Users } from "lucide-react"

const Sidebar = () => {
  return (
   <>
    {/* Sidebar */}
    <aside className="w-64 bg-white shadow-md">
        <div className="p-4">
          <h1 className="text-2xl font-bold text-blue-600">SRS Dashboard</h1>
        </div>
        <nav className="mt-6">
          <a className="flex items-center py-2 px-4 bg-blue-100 text-blue-700" >
            <Layout className="mr-3" size={20} />
            Dashboard
          </a>
          <a href="/student" className="flex items-center py-2 px-4 text-gray-600 hover:bg-gray-100" >
            <Users className="mr-3" size={20} />
            Students
          </a>
          <a href="/attendance"  className="flex items-center py-2 px-4 text-gray-600 hover:bg-gray-100" >
            <Calendar className="mr-3" size={20} />
            Attendance
          </a>
          <a href="/grade"  className="flex items-center py-2 px-4 text-gray-600 hover:bg-gray-100" >
            <PieChart className="mr-3" size={20} />
            Grades
          </a>
          <a href="/communication"  className="flex items-center py-2 px-4 text-gray-600 hover:bg-gray-100" >
            <MessageSquare className="mr-3" size={20} />
            Communication
          </a>
          <a href="/setting"  className="flex items-center py-2 px-4 text-gray-600 hover:bg-gray-100" >
            <Settings className="mr-3" size={20} />
            Settings
          </a>
        </nav>
      </aside>
   </>
  )
}

export default Sidebar