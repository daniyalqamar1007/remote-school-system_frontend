"use client"

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Book, ChevronRight, X, Send, User, Bot } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import socketManager from '@/lib/socket'

interface Contact { _id: string; firstName: string; lastName: string; email: string; role: string }
interface Conversation { 
  _id: string; 
  participants: Contact[]; 
  lastMessageId?: any; 
  lastMessageAt?: string;
  unreadCount?: Map<string, number> | Record<string, number> | number;
}
interface Class { id: string; name: string; courseCode: string; teacher: string; teacherEmail: string; lastMessage: string; unreadCount: number; schedule?: any[] }

interface Message {
  id: number
  text: string
  sender: "user" | "bot"
}

export default function StudentCommunication() {
  const { user } = useAuth()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [thread, setThread] = useState<any[]>([])
  const [pendingReceiver, setPendingReceiver] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")

  // Load conversations from localStorage on mount
  useEffect(() => {
    const savedConversations = localStorage.getItem('studentConversations');
    const savedContacts = localStorage.getItem('studentContacts');
    if (savedConversations) {
      try {
        setConversations(JSON.parse(savedConversations));
      } catch (e) {
        console.error('Error loading saved conversations:', e);
      }
    }
    if (savedContacts) {
      try {
        setContacts(JSON.parse(savedContacts));
      } catch (e) {
        console.error('Error loading saved contacts:', e);
      }
    }
  }, []);

  // Load messages for selected conversation from localStorage
  useEffect(() => {
    if (selectedConversation) {
      const savedMessages = localStorage.getItem(`studentMessages_${selectedConversation._id}`);
      if (savedMessages) {
        try {
          const messages = JSON.parse(savedMessages);
          setThread(messages);
          scrollToBottom();
        } catch (e) {
          console.error('Error loading saved messages:', e);
        }
      }
    }
  }, [selectedConversation]);
  const [isTyping, setIsTyping] = useState(false)
  const [otherUserTyping, setOtherUserTyping] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [contactSearchQuery, setContactSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showSearch, setShowSearch] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showClearDialog, setShowClearDialog] = useState(false)
  const [isClearingChat, setIsClearingChat] = useState(false)
  const [chatTheme, setChatTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('chatTheme') || 'light'
    }
    return 'light'
  })
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get current user ID
  const storedUser = (() => { try { return JSON.parse(localStorage.getItem('userInfo') || '{}') } catch { return {} } })();
  const meId: string | undefined = (user as any)?.id || storedUser?.id || storedUser?._id || '';

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMenu && !(event.target as Element).closest('.menu-container')) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMenu]);

  useEffect(() => {
    // Load regardless of profile readiness; endpoints rely on token
    loadContactsAndConversations()
    
    // Initialize socket connection
      const token = localStorage.getItem('accessToken')
    if (token) {
      const socket = socketManager.connect(token)
      
      // Set up event listeners
      socketManager.onNewMessage((data) => {
        console.log('New message received:', data)
        if (selectedConversation && data.conversationId === selectedConversation._id) {
          setThread(prev => {
            // Check if this message already exists (to avoid duplicates from optimistic updates)
            const exists = prev.some(msg => msg._id === data.message._id);
            if (exists) return prev;
            
            // Remove any temporary messages with the same content (from optimistic updates)
            const filtered = prev.filter(msg => !msg._id.startsWith('tmp-') || msg.content !== data.message.content);
            
            const updated = [...filtered, data.message];
            // Save updated messages to localStorage
            localStorage.setItem(`studentMessages_${selectedConversation._id}`, JSON.stringify(updated));
            return updated;
          });
          scrollToBottom()
        }
        // Update conversations list
        loadContactsAndConversations()
      })

      socketManager.onMessageRead((data) => {
        console.log('Message read:', data)
        // Update message read status in thread
        setThread(prev => prev.map(msg => 
          msg._id === data.messageId ? { ...msg, isRead: true, readAt: data.readAt } : msg
        ))
      })

      socketManager.onUserTyping((data) => {
        console.log('User typing:', data)
        if (selectedConversation && data.conversationId === selectedConversation._id) {
          setOtherUserTyping(data.isTyping)
        }
      })

      socketManager.onMessageSent((data) => {
        console.log('Message sent confirmation:', data)
        // Remove optimistic message and replace with real one
        setThread(prev => prev.filter(msg => !msg._id.startsWith('tmp-')))
      })

      return () => {
        socketManager.disconnect()
      }
    }
  }, [selectedConversation])

  const loadContactsAndConversations = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      const [c1, c2] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/communication/contacts`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/communication/conversations`, { headers: { 'Authorization': `Bearer ${token}` } }),
      ])
      if (c1.ok) {
        const contactsData = await c1.json();
        setContacts(contactsData);
        localStorage.setItem('studentContacts', JSON.stringify(contactsData));
      } else {
        toast.error('Failed to load contacts');
      }
      if (c2.ok) {
        const conversationsData = await c2.json();
        setConversations(conversationsData);
        localStorage.setItem('studentConversations', JSON.stringify(conversationsData));
      } else {
        toast.error('Failed to load conversations');
      }
    } catch (e) {
      console.error(e)
      toast.error('Error loading communication data')
    } finally {
      setLoading(false)
    }
  }

  const openConversation = async (cv: Conversation) => {
    try {
      setSelectedConversation(cv)
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/communication/conversations/${cv._id}/messages?page=1&limit=50`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const messages = await res.json()
        // Backend now returns oldest first, so no need to reverse
        setThread(messages)
        // Save messages to localStorage for persistence
        localStorage.setItem(`studentMessages_${cv._id}`, JSON.stringify(messages));
        scrollToBottom()
      } else {
        console.error('Failed to load messages:', res.status, res.statusText)
        toast.error('Failed to load messages')
      }
      
      // Join conversation room for real-time updates
      if (socketManager.isConnected()) {
        socketManager.joinConversation(cv._id)
      }
      
      // mark unread messages as read
      try {
        const token2 = localStorage.getItem('accessToken')
        const storedUser = (() => { try { return JSON.parse(localStorage.getItem('userInfo') || '{}') } catch { return {} } })();
        const meId: string | undefined = (user as any)?.id || storedUser?.id || storedUser?._id;
        const unread = Array.isArray(thread) && meId ? thread.filter((m: any) => (m.receiverId?.toString?.() || m.receiverId) === meId && !m.isRead) : []
        await Promise.all(unread.map((m: any) => socketManager.markMessageAsRead(m._id)))
      } catch {}
    } catch (e) {
      console.error(e)
      toast.error('Error loading messages')
    }
  }

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }

  // Remove polling intervals as we now use Socket.IO for real-time updates
  // Keep a fallback polling for conversations list in case socket disconnects
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    const interval = setInterval(async () => {
      if (!socketManager.isConnected()) {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/communication/conversations`, { headers: { 'Authorization': `Bearer ${token}` } })
          if (res.ok) setConversations(await res.json())
        } catch {}
      }
    }, 30000) // Reduced frequency to 30 seconds as fallback
    return () => clearInterval(interval)
  }, [])

  const handleSend = async (receiverId?: string) => {
    const targetId = receiverId || pendingReceiver?._id;
    if (!input.trim() || !targetId) return;
    
    const messageContent = input.trim()
    setInput('')
    
    try {
      // Use Socket.IO for real-time sending if connected, fallback to HTTP
      if (socketManager.isConnected()) {
        // Optimistic update
        const storedUser = (() => { try { return JSON.parse(localStorage.getItem('userInfo') || '{}') } catch { return {} } })();
        const meId: string | undefined = (user as any)?.id || storedUser?.id || storedUser?._id;
        const tempMessage = { 
          _id: `tmp-${Date.now()}`, 
          senderId: meId, 
          content: messageContent,
          createdAt: new Date(),
          type: 'text'
        }
        setThread(prev => [...prev, tempMessage])
        scrollToBottom()
        
        // Send via Socket.IO
        console.log('Sending message via Socket.IO:', { targetId, messageContent, type: 'text' })
        socketManager.sendMessage(targetId, messageContent, 'text')
        
        // If starting new conversation, join the room
        if (pendingReceiver) {
          const convRes = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/communication/conversations`, { 
            headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` } 
          })
          if (convRes.ok) {
            const convs = await convRes.json()
            setConversations(convs)
            const found = convs.find((cv: any) => (cv.participants || []).some((p: any) => p._id === targetId))
            if (found) {
              await openConversation(found)
              setPendingReceiver(null)
            }
          }
        }
      } else {
        // Fallback to HTTP API
        const token = localStorage.getItem('accessToken')
        const res = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/communication/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ receiverId: targetId, content: messageContent })
        })
        if (!res.ok) throw new Error('Failed to send message')
        
        // Reload conversations
        const convRes = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/communication/conversations`, { headers: { 'Authorization': `Bearer ${token}` } })
        if (convRes.ok) {
          const convs = await convRes.json()
          setConversations(convs)
          const found = convs.find((cv: any) => (cv.participants || []).some((p: any) => p._id === targetId))
          if (found) {
            await openConversation(found)
            setPendingReceiver(null)
          }
        }
      }
    } catch (e) {
      console.error(e)
      toast.error('Failed to send message')
      // Restore input on error
      setInput(messageContent)
    }
  }

  const handleTyping = (value: string) => {
    setInput(value)
    
    if (selectedConversation && socketManager.isConnected()) {
      if (!isTyping && value.length > 0) {
        setIsTyping(true)
        socketManager.sendTypingIndicator(selectedConversation._id, true)
      }
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      // Set new timeout to stop typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false)
        socketManager.sendTypingIndicator(selectedConversation._id, false)
      }, 1000)
    }
  }

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    
    setIsUploading(true);
    try {
      const receiverId = selectedConversation 
        ? selectedConversation.participants.find(p => p._id !== meId)?._id 
        : pendingReceiver?._id;
      if (!receiverId) {
        toast.error('No recipient selected');
        return;
      }

      const token = localStorage.getItem('accessToken');
      const form = new FormData();
      form.append('file', file);
      form.append('receiverId', receiverId);
      // Determine file type from MIME type
      let fileType = 'file';
      if (file.type.startsWith('image/')) {
        fileType = 'image';
      } else if (file.type.startsWith('video/')) {
        fileType = 'video';
      } else if (file.type.startsWith('audio/')) {
        fileType = 'audio';
      }
      form.append('type', fileType);

      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/communication/messages/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: form
      });

      if (response.ok) {
        toast.success('File uploaded successfully');
        // Refresh conversation to show new message
        if (selectedConversation) {
          await openConversation(selectedConversation);
        } else {
          // Reload conversations list to show new conversation
          loadContactsAndConversations();
        }
      } else {
        const error = await response.text();
        toast.error(`Upload failed: ${error}`);
      }
    } catch (error) {
      console.error('File upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  const handleClearChat = async () => {
    if (!selectedConversation) return
    
    try {
      setIsClearingChat(true)
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/communication/conversations/${selectedConversation._id}/messages`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (res.ok) {
        setThread([])
        localStorage.removeItem(`studentMessages_${selectedConversation._id}`)
        toast.success('Chat cleared successfully')
        loadContactsAndConversations()
      } else {
        toast.error('Failed to clear chat')
      }
    } catch (e) {
      console.error(e)
      toast.error('Failed to clear chat')
    } finally {
      setIsClearingChat(false)
    }
  }

  const handleSearch = async (query: string) => {
    if (!selectedConversation || !query.trim()) {
      setSearchResults([])
      return
    }
    
    try {
      const token = localStorage.getItem('accessToken')
      const res = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/communication/conversations/${selectedConversation._id}/search?q=${encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (res.ok) {
        const results = await res.json()
        setSearchResults(results)
      } else {
        console.error('Search failed:', res.status, res.statusText)
        setSearchResults([])
      }
    } catch (e) {
      console.error('Search error:', e)
      setSearchResults([])
    }
  };

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch(searchQuery)
      } else {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery, selectedConversation]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white dark:from-gray-900 dark:to-indigo-950 p-8 flex items-center justify-center">
        <div className="text-2xl text-gray-600 dark:text-gray-400">Loading your communications...</div>
      </div>
    )
  }

  return (
    <>
      <div className={`h-screen overflow-hidden ${chatTheme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
        <div className="mx-auto max-w-6xl h-full grid grid-cols-1 md:grid-cols-3">
          {/* Conversations Sidebar */}
          <div className={`border-r ${chatTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} md:col-span-1 flex flex-col h-full overflow-hidden`}>
            <div className="p-4 font-semibold text-lg border-b">Chats</div>
            {/* Start new chat section at top */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <div className="text-sm mb-2 font-medium">Start new chat</div>
              <Input
                placeholder="Search teachers..."
                value={contactSearchQuery}
                onChange={(e) => setContactSearchQuery(e.target.value)}
                className="mb-2"
              />
              <div className="space-y-2 max-h-48 overflow-auto">
                {/* Teachers Section */}
                {contacts.filter(c => 
                  c.role === 'TEACHER' && 
                  (!contactSearchQuery.trim() || 
                   `${c.firstName} ${c.lastName}`.toLowerCase().includes(contactSearchQuery.toLowerCase()) ||
                   c.email?.toLowerCase().includes(contactSearchQuery.toLowerCase()))
                ).length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Teachers</div>
                    {contacts.filter(c => 
                      c.role === 'TEACHER' && 
                      (!contactSearchQuery.trim() || 
                       `${c.firstName} ${c.lastName}`.toLowerCase().includes(contactSearchQuery.toLowerCase()) ||
                       c.email?.toLowerCase().includes(contactSearchQuery.toLowerCase()))
                    ).map(t => (
                      <div key={t._id} className="flex items-center justify-between text-sm p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-300 text-xs font-medium">
                            {t.firstName?.[0]}{t.lastName?.[0]}
                          </div>
                          <div>
                            <div className="font-medium">{t.firstName} {t.lastName}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{t.email}</div>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => { 
                            setPendingReceiver(t); 
                            setSelectedConversation(null); 
                            setThread([]); 
                          }}
                          className="hover:bg-indigo-50 dark:hover:bg-indigo-900"
                        >
                          Chat
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {contacts.filter(c => c.role === 'TEACHER').length === 0 && (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                    <div className="text-sm">No teachers available</div>
                    <div className="text-xs mt-1">Contact your administrator</div>
                  </div>
                )}
              </div>
            </div>
            <div className="px-4 pb-2 pt-2 text-sm text-muted-foreground border-b">Recent Conversations</div>
            <ScrollArea className="flex-1 overflow-hidden">
              {conversations.map((cv) => {
                const otherParticipant = cv.participants.find(p => p._id !== meId)
                if (!otherParticipant) return null
                
                // Calculate unread count
                let unreadCount = 0;
                if (cv.unreadCount) {
                  if (typeof cv.unreadCount === 'number') {
                    unreadCount = cv.unreadCount;
                  } else if (cv.unreadCount instanceof Map) {
                    unreadCount = cv.unreadCount.get(meId?.toString() || '') || 0;
                  } else if (typeof cv.unreadCount === 'object') {
                    unreadCount = (cv.unreadCount as Record<string, number>)[meId?.toString() || ''] || 0;
                  }
                }
                
                // If unreadCount is 0, try to calculate from messages
                if (unreadCount === 0 && selectedConversation?._id !== cv._id) {
                  try {
                    const cachedMessages = localStorage.getItem(`studentMessages_${cv._id}`);
                    if (cachedMessages) {
                      const messages = JSON.parse(cachedMessages);
                      const meIdStr = meId?.toString() || '';
                      unreadCount = messages.filter((m: any) => {
                        const receiverIdStr = m.receiverId?.toString?.() || m.receiverId;
                        return receiverIdStr === meIdStr && !m.isRead;
                      }).length;
                    }
                  } catch (e) {
                    // Ignore errors
                  }
                }
                
                const hasUnread = unreadCount > 0;
                
                return (
                  <div 
                    key={cv._id} 
                    className={`px-4 py-3 cursor-pointer relative ${
                      chatTheme === 'dark' 
                        ? hasUnread ? 'hover:bg-gray-800 bg-blue-900/20 border-l-4 border-blue-500' : 'hover:bg-gray-800'
                        : hasUnread ? 'hover:bg-gray-50 bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'
                    } ${selectedConversation?._id === cv._id ? (chatTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-50') : ''}`} 
                    onClick={() => { 
                      openConversation(cv); 
                      setSelectedClass({ 
                        id: cv._id, 
                        name: '', 
                        courseCode: '', 
                        teacher: `${otherParticipant.firstName || ''} ${otherParticipant.lastName || ''}`.trim(), 
                        teacherEmail: otherParticipant.email || '', 
                        lastMessage: cv.lastMessageId?.content || '', 
                        unreadCount: unreadCount 
                      }); 
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium flex-1">{otherParticipant.firstName} {otherParticipant.lastName}</div>
                      {hasUnread && (
                        <span className="ml-2 flex-shrink-0 bg-blue-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground truncate mt-1">
                      {otherParticipant.role === 'TEACHER' ? 'Teacher' : 'Parent'} • {cv.lastMessageId?.content || 'Start chatting'}
                    </div>
                  </div>
                )
              })}
              {conversations.length === 0 && (
                <div className="p-4 text-sm text-muted-foreground">No conversations yet. Start a new chat above.</div>
              )}
            </ScrollArea>
          </div>

          {/* Chat Thread */}
          <div className="md:col-span-2 flex flex-col h-full overflow-hidden">
            <div className={`p-4 border-b ${chatTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between flex-shrink-0`}>
              <div className="font-semibold">
                {selectedConversation ? `${selectedConversation.participants.find(p => p.role === 'TEACHER')?.firstName || ''} ${selectedConversation.participants.find(p => p.role === 'TEACHER')?.lastName || ''}`.trim() : pendingReceiver ? `${pendingReceiver.firstName} ${pendingReceiver.lastName}` : 'Select a conversation'}
              </div>
              <div className="flex items-center gap-2">
                {/* Search Button */}
                <button
                  onClick={() => setShowSearch(!showSearch)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  title="Search messages"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
                
                {/* Three-dot Menu */}
                <div className="relative menu-container">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    title="More options"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                    </svg>
                  </button>
                
                  {showMenu && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                      <button
                        onClick={() => {
                          setShowClearDialog(true)
                          setShowMenu(false)
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 dark:text-red-400 rounded-lg"
                      >
                        Clear Chat
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          
          {/* Search Bar */}
          {showSearch && (
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              
              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-2 max-h-40 overflow-y-auto">
                  {searchResults.map((result) => (
                    <div key={result._id} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(result.createdAt).toLocaleString()}
                      </div>
                      <div className="text-sm">{result.content}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <ScrollArea className="flex-1 p-4 overflow-y-auto" ref={scrollAreaRef}>
            {thread.map((m, index) => {
              // Fix sender identification - compare ObjectId strings properly
              const storedUser = (() => { try { return JSON.parse(localStorage.getItem('userInfo') || '{}') } catch { return {} } })();
              const meId: string | undefined = (user as any)?.id || storedUser?.id || storedUser?._id;
              const isMine = m.senderId?.toString() === meId || m.senderId === meId;
              
              const bubbleClass = isMine ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 dark:text-white';
              const align = isMine ? 'justify-end' : 'justify-start';
              
              // Determine file type - check both message type and content URL
              const contentUrl = typeof m.content === 'string' ? m.content : '';
              const isImageType = m.type === 'image' || (contentUrl && /\.(jpg|jpeg|png|gif|webp|bmp)(\?|$)/i.test(contentUrl));
              const isVideoType = m.type === 'video' || (contentUrl && /\.(mp4|webm|ogg|mov|avi)(\?|$)/i.test(contentUrl));
              const isAudioType = m.type === 'audio' || (contentUrl && /\.(mp3|wav|ogg|m4a|aac)(\?|$)/i.test(contentUrl));
              const isFileType = m.type === 'file' || (contentUrl && !isImageType && !isVideoType && !isAudioType && contentUrl.includes('amazonaws.com'));
              
              // Get the full URL
              const getFileUrl = (url: string) => {
                if (!url) return '';
                if (url.startsWith('http://') || url.startsWith('https://')) {
                  return url;
                }
                return `${process.env.NEXT_PUBLIC_SRS_SERVER}${url}`;
              };
              
              const fileUrl = getFileUrl(contentUrl);
              
              // Check if message is unread (for received messages)
              const isUnread = !isMine && !m.isRead && (m.receiverId?.toString() === meId || m.receiverId === meId);
              
              return (
                <div key={m._id} className={`mb-2 flex ${align} ${isUnread ? 'animate-pulse' : ''}`}>
                  <div className={`rounded-2xl max-w-[70%] ${isImageType || isVideoType ? 'p-0 overflow-hidden' : 'px-3 py-2'} ${bubbleClass} ${isUnread ? 'ring-2 ring-indigo-400 ring-offset-2' : ''}`}>
                    {isImageType ? (
                      <div className="space-y-1">
                        <img 
                          src={fileUrl} 
                          alt="Image attachment" 
                          className="max-w-full h-auto rounded-lg cursor-pointer" 
                          style={{ maxHeight: '400px', objectFit: 'contain' }}
                          onClick={() => window.open(fileUrl, '_blank')}
                          onError={(e) => {
                            console.error('Image load error:', fileUrl);
                            const imgElement = e.target as HTMLImageElement;
                            imgElement.style.display = 'none';
                            const errorDiv = document.createElement('div');
                            errorDiv.className = 'p-2 text-xs text-gray-500';
                            errorDiv.textContent = 'Failed to load image. Please try refreshing.';
                            if (imgElement.parentElement) {
                              imgElement.parentElement.appendChild(errorDiv);
                            }
                          }}
                        />
                        <div className={`text-xs px-2 pb-1 ${isMine ? 'text-indigo-200' : 'text-gray-500'}`}>
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ) : isVideoType ? (
                      <div className="space-y-1">
                        <video 
                          controls 
                          src={fileUrl} 
                          className="max-w-full h-auto rounded-lg"
                          style={{ maxHeight: '400px' }}
                          onError={(e) => {
                            console.error('Video load error:', fileUrl);
                          }}
                        >
                          Your browser does not support the video tag.
                        </video>
                        <div className={`text-xs px-2 pb-1 ${isMine ? 'text-indigo-200' : 'text-gray-500'}`}>
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ) : isAudioType ? (
                      <div className="space-y-2">
                        <audio controls src={fileUrl} className="w-full" />
                        <div className={`text-xs ${isMine ? 'text-indigo-200' : 'text-gray-500'}`}>
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ) : isFileType ? (
                      <div className="space-y-2">
                        <div className={`flex items-center gap-2 p-2 ${isMine ? 'bg-indigo-500' : 'bg-gray-100 dark:bg-gray-600'} rounded-lg`}>
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                          </svg>
                          <a 
                            href={fileUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className={`underline ${isMine ? 'text-white hover:text-indigo-200' : 'hover:text-blue-600'}`}
                            download
                          >
                            {contentUrl.split('/').pop()?.split('?')[0] || 'Download file'}
                          </a>
                        </div>
                        <div className={`text-xs ${isMine ? 'text-indigo-200' : 'text-gray-500'}`}>
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div>{m.content}</div>
                        <div className={`text-xs mt-1 ${isMine ? 'text-indigo-200' : 'text-gray-500'}`}>
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
            {thread.length === 0 && (
              <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">No messages yet. Say hi!</div>
            )}
            {otherUserTyping && (
              <div className="flex justify-start mb-2">
                <div className="px-3 py-2 rounded-2xl bg-gray-200 dark:bg-gray-700 text-sm text-muted-foreground">
                  Teacher is typing...
                </div>
              </div>
            )}
          </ScrollArea>
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex-shrink-0">
            {selectedFile && (
              <div className="mb-2 flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <span className="text-sm text-gray-600 dark:text-gray-300 truncate max-w-32 flex-1">
                  {selectedFile.name}
                </span>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            )}
            <div className="flex gap-2 items-center">
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*,video/*,application/pdf,audio/*" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setSelectedFile(file);
                }}
                className="hidden"
                id="file-upload"
              />
              {/* <label 
                htmlFor="file-upload" 
                className="cursor-pointer p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                title="Select file"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </label> */}
              <Input
                value={input}
                onChange={e => handleTyping(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && handleSend(selectedConversation ? selectedConversation.participants.find(p => p.role === 'TEACHER')?._id : pendingReceiver?._id)} 
                placeholder="Type a message..." 
                disabled={isUploading}
                className={`flex-1 ${chatTheme === 'dark' ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'}`}
              />
              <Button 
                onClick={() => {
                  if (selectedFile) {
                    handleFileUpload(selectedFile);
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  } else {
                    handleSend(selectedConversation ? selectedConversation.participants.find(p => p.role === 'TEACHER')?._id : pendingReceiver?._id);
                  }
                }}
                disabled={isUploading || (!input.trim() && !selectedFile)}
              >
                Send
              </Button>
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* Clear Chat Confirmation Dialog */}
      {showClearDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Clear Chat
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to clear this chat? This action cannot be undone and will delete all messages in this conversation.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowClearDialog(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowClearDialog(false)
                  await handleClearChat()
                }}
                disabled={isClearingChat}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {isClearingChat ? 'Clearing...' : 'Clear Chat'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
