"use client"

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Book, ChevronRight, X, Send, User, Bot, Users, Search, MoreVertical, Trash2, Palette } from 'lucide-react'
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

interface Message {
  _id: string
  content: string
  senderId: string
  receiverId: string
  type: string
  createdAt: string
  isRead: boolean
}

export default function ParentCommunication() {
  const { user } = useAuth()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [thread, setThread] = useState<any[]>([])
  const [pendingReceiver, setPendingReceiver] = useState<Contact | null>(null)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")

  // Load conversations from localStorage on mount
  useEffect(() => {
    const savedConversations = localStorage.getItem('parentConversations');
    const savedContacts = localStorage.getItem('parentContacts');
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
      const savedMessages = localStorage.getItem(`parentMessages_${selectedConversation._id}`);
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
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showSearch, setShowSearch] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showClearDialog, setShowClearDialog] = useState(false)
  const [chatTheme, setChatTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('chatTheme') || 'light'
    }
    return 'light'
  })
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }

  // Get user ID from localStorage userInfo (same pattern as teacher page)
  const meId = (() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('userInfo') || '{}')
      return storedUser?.id || storedUser?._id || user?.id || localStorage.getItem('userId') || ''
    } catch {
      return user?.id || localStorage.getItem('userId') || ''
    }
  })()

  const fetchContacts = async () => {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
      console.log('Fetching contacts with token:', token ? 'Token exists' : 'No token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/communication/contacts`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      console.log('Contacts response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('Contacts data received:', data)
        console.log('Number of contacts:', data?.length || 0)
        console.log('Teachers in contacts:', data?.filter((c: any) => c.role === 'TEACHER')?.length || 0)
        setContacts(data || [])
        localStorage.setItem('parentContacts', JSON.stringify(data || []))
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Error fetching contacts:', response.status, errorData)
        toast.error('Failed to load contacts')
      }
    } catch (error) {
      console.error('Error fetching contacts:', error)
    }
  }

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
      console.log('Fetching conversations with token:', token ? 'Token exists' : 'No token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/communication/conversations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      console.log('Conversations response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        const list = Array.isArray(data) ? data : (data?.data || [])
        setConversations(list)
        localStorage.setItem('parentConversations', JSON.stringify(list))
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Error fetching conversations:', response.status, errorData)
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    }
  }

  const load = async () => {
    setLoading(true)
    await Promise.all([fetchContacts(), fetchConversations()])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const openConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation)
    setPendingReceiver(null)
    setThread([])
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
      
      // Add cache busting to ensure fresh messages
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/communication/conversations/${conversation._id}/messages?page=1&limit=50&_=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const messages = await response.json()
        console.log('Loaded messages for conversation:', conversation._id, 'Message count:', messages?.length || 0)
        
        // Ensure messages is an array
        const messagesArray = Array.isArray(messages) ? messages : []
        setThread(messagesArray)
        localStorage.setItem(`parentMessages_${conversation._id}`, JSON.stringify(messagesArray))
        scrollToBottom()
        
        // Join conversation room for real-time updates
        if (socketManager.isConnected()) {
          socketManager.joinConversation(conversation._id)
          console.log('Parent joined conversation room:', conversation._id)
        } else {
          console.warn('Parent socket not connected, cannot join conversation room')
        }
        
        // Mark unread messages as read
        try {
          const unread = Array.isArray(messagesArray) && meId ? messagesArray.filter((m: any) => {
            const receiverIdStr = m.receiverId?.toString?.() || m.receiverId
            const meIdStr = meId.toString()
            return receiverIdStr === meIdStr && !m.isRead
          }) : []
          
          if (unread.length > 0) {
            console.log('Marking', unread.length, 'messages as read')
            await Promise.all(unread.map((m: any) => socketManager.markMessageAsRead(m._id)))
          }
        } catch (readError) {
          console.error('Error marking messages as read:', readError)
        }
      } else {
        const errorText = await response.text()
        console.error('Failed to load messages:', response.status, errorText)
        toast.error('Failed to load messages')
      }
    } catch (error) {
      console.error('Error loading messages:', error)
      toast.error('Failed to load messages')
    }
  }

  const handleSend = async () => {
    if (!input.trim() && !selectedFile) return

    const receiverId = selectedConversation 
      ? selectedConversation.participants.find(p => p._id !== meId)?._id 
      : pendingReceiver?._id

    if (!receiverId) return

    const messageContent = input.trim()
    
    try {
      if (selectedFile) {
        // Handle file upload
        const formData = new FormData()
        formData.append('file', selectedFile)
        formData.append('receiverId', receiverId)
        formData.append('type', fileInputRef.current?.files?.[0]?.type.startsWith('audio') ? 'audio' : fileInputRef.current?.files?.[0]?.type.startsWith('image') ? 'image' : 'file')

        const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
        const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/communication/messages/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        })

        if (response.ok) {
          toast.success('File uploaded successfully')
          setSelectedFile(null)
          if (fileInputRef.current) fileInputRef.current.value = ''
          // Refresh conversation to show new message
          if (selectedConversation) {
            await openConversation(selectedConversation)
          } else {
            load()
          }
        } else {
          toast.error('Failed to upload file')
        }
      } else {
        // Handle text message
        setInput('')
        
        // Use Socket.IO for real-time sending if connected, fallback to HTTP
        if (socketManager.isConnected()) {
          try {
            // Optimistic update
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
            socketManager.sendMessage(receiverId, messageContent, 'text')
            
            if (pendingReceiver) {
              setTimeout(async () => {
                await load()
                const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
                const raw = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/communication/conversations`, {
                  headers: { 'Authorization': `Bearer ${token}` }
                }).then(r => r.json())
                const convs = Array.isArray(raw) ? raw : (raw?.data || [])
                const receiverStr = (receiverId && (typeof receiverId === 'string' ? receiverId : (receiverId._id || receiverId.id || receiverId)?.toString?.())) || ''
                const found = convs.find((cv: any) => (cv.participants || []).some((p: any) => (p._id || p.id || p)?.toString?.() === receiverStr))
                if (found) {
                  await openConversation(found)
                  setPendingReceiver(null)
                }
              }, 500)
            } else if (selectedConversation) {
            }
          } catch (socketError) {
            console.error('Socket.IO send error:', socketError)
            // Fallback to HTTP if Socket.IO fails
            throw socketError
          }
        } else {
          // Fallback to HTTP API
          const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
          const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/communication/messages`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              receiverId,
              content: messageContent,
              type: 'text'
            }),
          })

          if (response.ok) {
            await load()
            const raw = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/communication/conversations`, {
              headers: { 'Authorization': `Bearer ${token}` }
            }).then(r => r.json())
            const convs = Array.isArray(raw) ? raw : (raw?.data || [])
            const receiverStr = (receiverId && (typeof receiverId === 'string' ? receiverId : (receiverId._id || receiverId.id || receiverId)?.toString?.())) || ''
            const found = convs.find((cv: any) => (cv.participants || []).some((p: any) => (p._id || p.id || p)?.toString?.() === receiverStr))
            if (found) {
              await openConversation(found)
              setPendingReceiver(null)
            } else if (selectedConversation) {
              await openConversation(selectedConversation)
            }
          } else {
            const errorData = await response.json().catch(() => ({ message: 'Failed to send message' }))
            console.error('Failed to send message:', response.status, errorData)
            toast.error(errorData.message || 'Failed to send message')
            setInput(messageContent)
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
      if (!selectedFile) {
        setInput(messageContent)
      }
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleFileUpload = async (file: File) => {
    if (!file || (!selectedConversation && !pendingReceiver)) return;
    
    setIsUploading(true);
    try {
      const receiverId = selectedConversation 
        ? selectedConversation.participants.find(p => p._id !== meId)?._id 
        : pendingReceiver?._id;
      if (!receiverId) {
        toast.error('No recipient selected');
        return;
      }

      const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
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
          await load();
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
    }
  }

  const handleClearChat = async () => {
    if (!selectedConversation) return

    try {
      setIsClearingChat(true)
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/communication/conversations/${selectedConversation._id}/messages`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const clearedConvoId = selectedConversation._id
        setThread([])
        localStorage.removeItem(`parentMessages_${clearedConvoId}`)
        setConversations(prev => prev.map(c => c._id === clearedConvoId ? { ...c, lastMessageId: null, lastMessageAt: new Date().toISOString() } : c))
        setShowClearDialog(false)
        toast.success('Chat cleared successfully')
        await load()
      } else {
        const err = await response.json().catch(() => ({}))
        toast.error(err.message || 'Failed to clear chat')
        setShowClearDialog(false)
      }
    } catch (error) {
      console.error('Error clearing chat:', error)
      toast.error('Failed to clear chat')
      setShowClearDialog(false)
    } finally {
      setIsClearingChat(false)
    }
  }

  const handleSearch = async (query: string) => {
    if (!query.trim() || !selectedConversation) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/communication/conversations/${selectedConversation._id}/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const results = await response.json()
        setSearchResults(results)
        setShowSearch(true)
      } else {
        setSearchResults([])
        setShowSearch(false)
      }
    } catch (error) {
      console.error('Error searching messages:', error)
      setSearchResults([])
      setShowSearch(false)
    }
  }

  const debouncedSearch = useRef<NodeJS.Timeout>()
  useEffect(() => {
    if (debouncedSearch.current) {
      clearTimeout(debouncedSearch.current)
    }
    debouncedSearch.current = setTimeout(() => {
      if (searchQuery) {
        handleSearch(searchQuery)
      } else {
        setSearchResults([])
        setShowSearch(false)
      }
    }, 300)
  }, [searchQuery])

  const toggleTheme = () => {
    const newTheme = chatTheme === 'light' ? 'dark' : 'light'
    setChatTheme(newTheme)
    localStorage.setItem('chatTheme', newTheme)
  }

  // Socket.IO integration
  useEffect(() => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
    if (!token) return

    // Initialize socket connection
    const socket = socketManager.connect(token)
    console.log('Parent socket connection initialized, connected:', socketManager.isConnected())
    
    // Set up event listeners
    socketManager.onNewMessage((data) => {
      console.log('Parent: New message received via socket:', data)
      
      // Always update conversations list when new message arrives
      fetchConversations()
      
      // If this message is for the currently selected conversation, add it to the thread
      if (selectedConversation && data.conversationId === selectedConversation._id) {
        setThread(prev => {
          // Check if this message already exists (to avoid duplicates from optimistic updates)
          const exists = prev.some(msg => msg._id === data.message._id);
          if (exists) return prev;
          
          // Remove any temporary messages with the same content (from optimistic updates)
          const filtered = prev.filter(msg => !msg._id.startsWith('tmp-') || msg.content !== data.message.content);
          
          const updated = [...filtered, data.message];
          // Save updated messages to localStorage
          localStorage.setItem(`parentMessages_${selectedConversation._id}`, JSON.stringify(updated));
          return updated;
        });
        scrollToBottom()
      } else if (data.conversationId) {
        // If message is for a different conversation, update that conversation's cached messages
        try {
          const cachedMessages = localStorage.getItem(`parentMessages_${data.conversationId}`)
          if (cachedMessages) {
            const messages = JSON.parse(cachedMessages)
            const exists = messages.some((msg: any) => msg._id === data.message._id)
            if (!exists) {
              messages.push(data.message)
              localStorage.setItem(`parentMessages_${data.conversationId}`, JSON.stringify(messages))
            }
          } else {
            // If no cached messages, create new array with this message
            localStorage.setItem(`parentMessages_${data.conversationId}`, JSON.stringify([data.message]))
          }
        } catch (e) {
          console.error('Error updating cached messages:', e)
        }
      }
    })

    socketManager.onMessageRead((data) => {
      console.log('Message read:', data)
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

    socketManager.onMessageSent(() => {
    })

    return () => {
      socketManager.disconnect()
    }
  }, [selectedConversation])

  // Group contacts by role
  const teachers = contacts.filter(contact => contact.role === 'TEACHER')
  // Children are not shown in parent chat - only teachers
  // const children = contacts.filter(contact => contact.role === 'STUDENT')
  
  // Debug logging
  useEffect(() => {
    console.log('Contacts:', contacts)
    console.log('Teachers filtered:', teachers)
    console.log('Number of teachers:', teachers.length)
  }, [contacts, teachers])

  const [isClearingChat, setIsClearingChat] = useState(false)

  return (
    <>
      <div className={`h-screen overflow-hidden ${chatTheme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="container mx-auto h-full flex">
          <div className="flex h-full bg-white rounded-lg shadow-lg overflow-hidden w-full">
            {/* Left Sidebar - Contacts */}
            <div className={`w-1/3 border-r ${chatTheme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} flex flex-col h-full overflow-hidden`}>
              <div className={`p-4 border-b ${chatTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} flex-shrink-0`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`text-xl font-semibold ${chatTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Messages
                  </h2>
                  <div className="relative menu-container">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowMenu(!showMenu)}
                      className="p-2"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                    {showMenu && (
                      <div className={`absolute right-0 top-10 z-50 w-48 rounded-md shadow-lg ${chatTheme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                        <div className="py-1">
                          <button
                            onClick={() => {
                              setShowClearDialog(true)
                              setShowMenu(false)
                            }}
                            className={`flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 ${chatTheme === 'dark' ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700'}`}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Clear Chat
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Search */}
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${chatTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                  <Input 
                    placeholder="Search teachers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`pl-10 ${chatTheme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  />
                </div>
              </div>

              <ScrollArea className="flex-1 overflow-hidden">
                {/* Start New Chat Section - Teachers First */}
                <div className={`p-4 border-b ${chatTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h3 className={`text-sm font-medium mb-3 ${chatTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    Start New Chat
                  </h3>
                  
                  {/* Teachers Section - Always show if teachers exist */}
                  <div>
                    <h4 className={`text-xs font-medium mb-2 flex items-center ${chatTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      <Users className="mr-1 h-3 w-3" />
                      Teachers
                    </h4>
                    {teachers.filter(t => 
                      !searchQuery.trim() || 
                      `${t.firstName} ${t.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      t.email?.toLowerCase().includes(searchQuery.toLowerCase())
                    ).length > 0 ? (
                      teachers.filter(t => 
                        !searchQuery.trim() || 
                        `${t.firstName} ${t.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        t.email?.toLowerCase().includes(searchQuery.toLowerCase())
                      ).map((teacher) => (
                        <div
                          key={teacher._id}
                          className={`flex items-center p-2 rounded-lg cursor-pointer hover:bg-gray-100 mb-1 ${chatTheme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} ${pendingReceiver?._id === teacher._id ? (chatTheme === 'dark' ? 'bg-gray-700' : 'bg-blue-50') : ''}`}
                          onClick={() => {
                            setSelectedConversation(null)
                            setPendingReceiver(teacher)
                            setThread([])
                          }}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${chatTheme === 'dark' ? 'bg-green-600' : 'bg-green-500'}`}>
                            <span className="text-white text-sm font-medium">
                              {teacher.firstName?.[0] || ''}{teacher.lastName?.[0] || ''}
                            </span>
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${chatTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                              {teacher.firstName} {teacher.lastName}
                            </p>
                            <p className={`text-xs ${chatTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                              {teacher.email}
                            </p>
                          </div>
                          <Button size="sm" variant="outline" className="text-xs">
                            Chat
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className={`text-xs ${chatTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'} py-2`}>
                        {searchQuery.trim() ? 'No teachers found matching your search.' : 'No teachers available.'}
                      </p>
                    )}
                  </div>

                  {/* Children section removed - parents only chat with teachers */}
                </div>

                {/* Existing Conversations */}
                <div className="p-4 border-t">
                  <h3 className={`text-sm font-medium mb-3 ${chatTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    Recent Conversations
                  </h3>
                  {conversations.map((conversation) => {
                    const otherParticipant = conversation.participants.find(p => p._id !== meId)
                    if (!otherParticipant) return null

                    // Calculate unread count
                    let unreadCount = 0;
                    if (conversation.unreadCount) {
                      if (typeof conversation.unreadCount === 'number') {
                        unreadCount = conversation.unreadCount;
                      } else if (conversation.unreadCount instanceof Map) {
                        unreadCount = conversation.unreadCount.get(meId?.toString() || '') || 0;
                      } else if (typeof conversation.unreadCount === 'object') {
                        unreadCount = (conversation.unreadCount as Record<string, number>)[meId?.toString() || ''] || 0;
                      }
                    }
                    
                    // If unreadCount is 0, try to calculate from messages
                    if (unreadCount === 0 && selectedConversation?._id !== conversation._id) {
                      try {
                        const cachedMessages = localStorage.getItem(`parentMessages_${conversation._id}`);
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
                        key={conversation._id}
                        className={`flex items-center p-3 rounded-lg cursor-pointer mb-2 relative ${
                          hasUnread
                            ? (chatTheme === 'dark' ? 'bg-blue-900/20 border-l-4 border-blue-500' : 'bg-blue-50 border-l-4 border-blue-500')
                            : (chatTheme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100')
                        } ${
                          selectedConversation?._id === conversation._id 
                            ? (chatTheme === 'dark' ? 'bg-gray-700' : 'bg-blue-50') 
                            : ''
                        }`}
                        onClick={() => openConversation(conversation)}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                          otherParticipant.role === 'TEACHER' 
                            ? (chatTheme === 'dark' ? 'bg-green-600' : 'bg-green-500')
                            : (chatTheme === 'dark' ? 'bg-blue-600' : 'bg-blue-500')
                        }`}>
                          <span className="text-white text-sm font-medium">
                            {otherParticipant.firstName[0]}{otherParticipant.lastName[0]}
                          </span>
                          </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-medium ${chatTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                              {otherParticipant.firstName} {otherParticipant.lastName}
                            </p>
                            {hasUnread && (
                              <span className="ml-2 flex-shrink-0 bg-blue-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                {unreadCount > 9 ? '9+' : unreadCount}
                              </span>
                            )}
                          </div>
                              <p className={`text-xs ${chatTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                Teacher
                              </p>
                              </div>
                        <ChevronRight className={`h-4 w-4 ${chatTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                            </div>
                    )
                  })}
                        </div>
                      </ScrollArea>
                    </div>

            {/* Right Side - Chat Area */}
            <div className={`flex-1 flex flex-col ${chatTheme === 'dark' ? 'bg-gray-800' : 'bg-white'} overflow-hidden`}>
              {selectedConversation || pendingReceiver ? (
                <>
                  {/* Chat Header */}
                  <div className={`p-4 border-b ${chatTheme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} flex-shrink-0`}>
                    <div className="flex items-center">
                      {(() => {
                        const otherParticipant = selectedConversation 
                          ? selectedConversation.participants.find(p => p._id !== meId)
                          : pendingReceiver
                        if (!otherParticipant) return null

                        return (
                          <>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                              otherParticipant.role === 'TEACHER' 
                                ? (chatTheme === 'dark' ? 'bg-green-600' : 'bg-green-500')
                                : (chatTheme === 'dark' ? 'bg-blue-600' : 'bg-blue-500')
                            }`}>
                              <span className="text-white text-sm font-medium">
                                {otherParticipant.firstName[0]}{otherParticipant.lastName[0]}
                              </span>
                      </div>
                          <div>
                              <h3 className={`text-lg font-semibold ${chatTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                {otherParticipant.firstName} {otherParticipant.lastName}
                              </h3>
                              <p className={`text-sm ${chatTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                Teacher
                              </p>
                            </div>
                          </>
                        )
                      })()}
                          </div>
                        </div>

                  {/* Messages */}
                  <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
                    <div className="space-y-4">
                      {thread.map((message, index) => {
                        const isMe = message.senderId?.toString() === meId || message.senderId === meId
                        
                        // Determine file type - check both message type and content URL
                        const contentUrl = typeof message.content === 'string' ? message.content : '';
                        const isImageType = message.type === 'image' || (contentUrl && /\.(jpg|jpeg|png|gif|webp|bmp)(\?|$)/i.test(contentUrl));
                        const isVideoType = message.type === 'video' || (contentUrl && /\.(mp4|webm|ogg|mov|avi)(\?|$)/i.test(contentUrl));
                        const isAudioType = message.type === 'audio' || (contentUrl && /\.(mp3|wav|ogg|m4a|aac)(\?|$)/i.test(contentUrl));
                        const isFileType = message.type === 'file' || (contentUrl && !isImageType && !isVideoType && !isAudioType && contentUrl.includes('amazonaws.com'));
                        
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
                        const isUnread = !isMe && !message.isRead && (message.receiverId?.toString() === meId || message.receiverId === meId);
                        
                        return (
                          <div key={message._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-2 ${isUnread ? 'animate-pulse' : ''}`}>
                            <div className={`max-w-xs lg:max-w-md rounded-lg ${
                              isMe 
                                ? (chatTheme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                                : (chatTheme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900')
                            } ${isImageType || isVideoType ? 'p-0 overflow-hidden' : 'px-4 py-2'} ${isUnread ? 'ring-2 ring-blue-400 ring-offset-2' : ''}`}>
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
                                      (e.target as HTMLImageElement).style.display = 'none';
                                      (e.target as HTMLImageElement).parentElement!.innerHTML = `<div class="p-2 text-xs text-gray-500">Failed to load image</div>`;
                                    }}
                                  />
                                  <p className={`text-xs px-2 pb-1 ${
                                    isMe 
                                      ? (chatTheme === 'dark' ? 'text-blue-200' : 'text-blue-100')
                                      : (chatTheme === 'dark' ? 'text-gray-400' : 'text-gray-500')
                                  }`}>
                                    {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
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
                                  <p className={`text-xs px-2 pb-1 ${
                                    isMe 
                                      ? (chatTheme === 'dark' ? 'text-blue-200' : 'text-blue-100')
                                      : (chatTheme === 'dark' ? 'text-gray-400' : 'text-gray-500')
                                  }`}>
                                    {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                              ) : isAudioType ? (
                                <div className="space-y-2 px-4 py-2">
                                  <audio controls src={fileUrl} className="w-full" />
                                  <p className={`text-xs ${
                                    isMe 
                                      ? (chatTheme === 'dark' ? 'text-blue-200' : 'text-blue-100')
                                      : (chatTheme === 'dark' ? 'text-gray-400' : 'text-gray-500')
                                  }`}>
                                    {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                              ) : isFileType ? (
                                <div className="space-y-2 px-4 py-2">
                                  <div className={`flex items-center gap-2 p-2 ${isMe ? 'bg-blue-400' : 'bg-gray-100 dark:bg-gray-600'} rounded-lg`}>
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                                    </svg>
                                    <a 
                                      href={fileUrl} 
                                      target="_blank" 
                                      rel="noreferrer" 
                                      className={`underline ${isMe ? 'text-white hover:text-blue-200' : 'hover:text-blue-600'}`}
                                      download
                                    >
                                      {contentUrl.split('/').pop()?.split('?')[0] || 'Download file'}
                                    </a>
                                  </div>
                                  <p className={`text-xs ${
                                    isMe 
                                      ? (chatTheme === 'dark' ? 'text-blue-200' : 'text-blue-100')
                                      : (chatTheme === 'dark' ? 'text-gray-400' : 'text-gray-500')
                                  }`}>
                                    {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                              ) : (
                                <>
                                  <p className="text-sm">{message.content}</p>
                                  <p className={`text-xs mt-1 ${
                                    isMe 
                                      ? (chatTheme === 'dark' ? 'text-blue-200' : 'text-blue-100')
                                      : (chatTheme === 'dark' ? 'text-gray-400' : 'text-gray-500')
                                  }`}>
                                    {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    {otherUserTyping && (
                      <div className="flex justify-start mb-2">
                        <div className="px-3 py-2 rounded-2xl bg-gray-200 dark:bg-gray-700 text-sm text-muted-foreground">
                          Teacher is typing...
                        </div>
                      </div>
                    )}
                                </div>
                  </ScrollArea>

                  {/* Message Input */}
                  <div className={`p-4 border-t ${chatTheme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} flex-shrink-0`}>
                    {selectedFile && (
                      <div className="mb-2 p-2 bg-gray-100 rounded-lg flex items-center justify-between">
                        <span className="text-sm text-gray-600 flex-1 truncate">📎 {selectedFile.name}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedFile(null)
                            if (fileInputRef.current) fileInputRef.current.value = ''
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <div className="flex space-x-2">
                      <input
                        type="file"
                        accept="image/*,video/*,application/pdf,audio/*"
                        ref={fileInputRef}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setSelectedFile(file);
                        }}
                        className="hidden"
                        id="file-upload-parent"
                      />
                      {/* <label
                        htmlFor="file-upload-parent"
                        className="cursor-pointer p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        title="Select file"
                      >
                        📎
                      </label> */}
                      <Input
                        value={input}
                        onChange={(e) => {
                          setInput(e.target.value)
                          
                          // Typing indicator
                          if (selectedConversation && socketManager.isConnected()) {
                            if (!isTyping && e.target.value.length > 0) {
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
                        }}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type a message..."
                        className={`flex-1 ${chatTheme === 'dark' ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'}`}
                      />
                      <Button 
                        onClick={async () => {
                          if (selectedFile) {
                            await handleFileUpload(selectedFile);
                            setSelectedFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          } else {
                            handleSend();
                          }
                        }}
                        disabled={isUploading || (!input.trim() && !selectedFile)}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className={`flex-1 flex items-center justify-center ${chatTheme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                  <div className="text-center">
                    <Book className={`h-16 w-16 mx-auto mb-4 ${chatTheme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
                    <h3 className={`text-xl font-semibold mb-2 ${chatTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Welcome to Parent Communication
                    </h3>
                    <p className={`${chatTheme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      Select a conversation or start a new chat with your child's teachers
                    </p>
                  </div>
                            </div>
              )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
      {/* Clear Chat Dialog */}
      {showClearDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`bg-white rounded-lg p-6 max-w-md w-full mx-4 ${chatTheme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${chatTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Clear Chat
            </h3>
            <p className={`mb-6 ${chatTheme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Are you sure you want to clear this chat? This action cannot be undone.
            </p>
            <div className="flex space-x-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowClearDialog(false)}
                className={chatTheme === 'dark' ? 'border-gray-600 text-gray-300' : ''}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleClearChat}
                disabled={isClearingChat}
              >
                {isClearingChat ? 'Clearing...' : 'Clear Chat'}
              </Button>
                              </div>
                            </div>
                          </div>
      )}
    </>
  )
}