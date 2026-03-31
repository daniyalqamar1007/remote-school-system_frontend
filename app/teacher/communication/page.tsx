"use client"
import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getTokenFromCookie } from "@/lib/utils"
import { toast } from "sonner"
import socketManager from '@/lib/socket'

interface Contact { _id: string; firstName: string; lastName: string; email: string; role: string }
interface Conversation { 
  _id: string; 
  participants: Contact[]; 
  lastMessageId?: any; 
  lastMessageAt?: string;
  unreadCount?: Map<string, number> | Record<string, number> | number;
}

export default function CommunicationPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [pendingReceiver, setPendingReceiver] = useState<Contact | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [otherUserTyping, setOtherUserTyping] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [messageSearchQuery, setMessageSearchQuery] = useState('')
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
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
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

  // Load conversations from localStorage on mount
  useEffect(() => {
    const savedConversations = localStorage.getItem('teacherConversations');
    const savedContacts = localStorage.getItem('teacherContacts');
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
      const savedMessages = localStorage.getItem(`teacherMessages_${selectedConversation._id}`);
      if (savedMessages) {
        try {
          const messages = JSON.parse(savedMessages);
          setMessages(messages);
          scrollToBottom();
        } catch (e) {
          console.error('Error loading saved messages:', e);
        }
      }
    }
  }, [selectedConversation]);

  const token = typeof window !== 'undefined' ? (localStorage.getItem('accessToken') || getTokenFromCookie()) : ''

  const load = async () => {
      try {
        setIsLoading(true)
        const [c1, c2] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/communication/contacts`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/communication/conversations`, { headers: { 'Authorization': `Bearer ${token}` } }),
        ])
        if (c1.ok) {
          const contactsData = await c1.json();
          setContacts(contactsData);
          localStorage.setItem('teacherContacts', JSON.stringify(contactsData));
        } else {
          toast.error('Failed to load contacts');
        }
        if (c2.ok) {
          const conversationsData = await c2.json();
          setConversations(conversationsData);
          localStorage.setItem('teacherConversations', JSON.stringify(conversationsData));
        } else {
          toast.error('Failed to load conversations');
        }
      } catch (e) {
        console.error(e)
        setError('Failed to load communication data')
      } finally {
        setIsLoading(false)
      }
    }

  useEffect(() => {
    load()
    
    // Initialize socket connection
    if (token) {
      const socket = socketManager.connect(token)
      
      // Set up event listeners
      socketManager.onNewMessage((data) => {
        console.log('New message received:', data)
        
        // Always update conversations list when new message arrives
        load()
        
        // If this message is for the currently selected conversation, add it to the messages
        if (selectedConversation && data.conversationId === selectedConversation._id) {
          setMessages(prev => {
            // Check if this message already exists (to avoid duplicates from optimistic updates)
            const exists = prev.some(msg => msg._id === data.message._id);
            if (exists) return prev;
            
            // Remove any temporary messages with the same content (from optimistic updates)
            const filtered = prev.filter(msg => !msg._id.startsWith('tmp-') || msg.content !== data.message.content);
            
            const updated = [...filtered, data.message];
            // Save updated messages to localStorage
            localStorage.setItem(`teacherMessages_${selectedConversation._id}`, JSON.stringify(updated));
            return updated;
          });
          scrollToBottom()
        } else if (data.conversationId) {
          // If message is for a different conversation, update that conversation's cached messages
          try {
            const cachedMessages = localStorage.getItem(`teacherMessages_${data.conversationId}`)
            if (cachedMessages) {
              const messages = JSON.parse(cachedMessages)
              const exists = messages.some((msg: any) => msg._id === data.message._id)
              if (!exists) {
                messages.push(data.message)
                localStorage.setItem(`teacherMessages_${data.conversationId}`, JSON.stringify(messages))
              }
            } else {
              // If no cached messages, create new array with this message
              localStorage.setItem(`teacherMessages_${data.conversationId}`, JSON.stringify([data.message]))
            }
          } catch (e) {
            console.error('Error updating cached messages:', e)
          }
        }
      })

      socketManager.onMessageRead((data) => {
        console.log('Message read:', data)
        setMessages(prev => prev.map(msg => 
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
        setMessages(prev => prev.filter(msg => !msg._id.startsWith('tmp-')))
      })

      return () => {
        socketManager.disconnect()
      }
    }
  }, [token, selectedConversation])

  const openConversation = async (conversation: Conversation) => {
    try {
      setSelectedConversation(conversation)
      
      // Add cache busting to ensure fresh messages
      const res = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/communication/conversations/${conversation._id}/messages?page=1&limit=50&_=${Date.now()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      let messagesArray: any[] = []
      
      if (res.ok) {
        const messages = await res.json()
        console.log('Loaded messages for conversation:', conversation._id, 'Message count:', messages?.length || 0)
        
        // Ensure messages is an array
        messagesArray = Array.isArray(messages) ? messages : []
        setMessages(messagesArray)
        // Save messages to localStorage for persistence
        localStorage.setItem(`teacherMessages_${conversation._id}`, JSON.stringify(messagesArray));
        scrollToBottom()
      } else {
        const errorText = await res.text()
        console.error('Failed to load messages:', res.status, res.statusText, errorText)
        toast.error('Failed to load messages')
      }
      
      // Join conversation room for real-time updates
      if (socketManager.isConnected()) {
        socketManager.joinConversation(conversation._id)
        console.log('Joined conversation room:', conversation._id)
      } else {
        console.warn('Socket not connected, cannot join conversation room')
      }
      
      // Mark unread messages as read
      try {
        const storedUser = (() => { try { return JSON.parse(localStorage.getItem('userInfo') || '{}') } catch { return {} } })();
        const meId: string | undefined = storedUser?.id || storedUser?._id;
        const unread = messagesArray && meId ? messagesArray.filter((m: any) => {
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
    } catch (e) {
      console.error('Error loading messages:', e)
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

  const handleSend = async () => {
    if (!selectedConversation && !pendingReceiver) return
    const storedUser = (() => { try { return JSON.parse(localStorage.getItem('userInfo') || '{}') } catch { return {} } })();
    const myId: string | undefined = storedUser?.id || storedUser?._id;
    
    let receiver;
    if (selectedConversation) {
      // Find receiver - can be either STUDENT or PARENT
      receiver = selectedConversation.participants.find(p => (p.role === 'STUDENT' || p.role === 'PARENT') && p._id !== myId) || 
                 selectedConversation.participants.find(p => p.role === 'STUDENT' || p.role === 'PARENT')
    } else if (pendingReceiver) {
      receiver = pendingReceiver
    }
    
    if (!receiver || !input.trim()) return
    
    const messageContent = input.trim()
    setInput('')
    
    try {
      // Use Socket.IO for real-time sending if connected, fallback to HTTP
      if (socketManager.isConnected()) {
        // Optimistic update
        const tempMessage = { 
          _id: `tmp-${Date.now()}`, 
          senderId: myId, 
          content: messageContent,
          createdAt: new Date(),
          type: 'text'
        }
        setMessages(prev => [...prev, tempMessage])
        scrollToBottom()
        
        // Send via Socket.IO
        socketManager.sendMessage(receiver._id, messageContent, 'text')
        
        // If starting new conversation, reload conversations list
        if (pendingReceiver) {
          setTimeout(() => {
            load()
          }, 500)
        }
        } else {
        // Fallback to HTTP API
        const res = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/communication/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ receiverId: receiver._id, content: messageContent })
        })
        if (!res.ok) throw new Error('Failed to send')
        
        // Reload conversations to show new conversation in list
        await load()
        
        if (selectedConversation) {
          openConversation(selectedConversation)
        } else if (pendingReceiver) {
          // Find the new conversation and open it
          const convs = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/communication/conversations`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }).then(r => r.json())
          const found = convs.find((cv: any) => (cv.participants || []).some((p: any) => p._id === receiver._id))
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
    if (!file || !selectedConversation) return;
    
    setIsUploading(true);
    try {
      const storedUser = (() => { try { return JSON.parse(localStorage.getItem('userInfo') || '{}') } catch { return {} } })();
      const myId: string | undefined = storedUser?.id || storedUser?._id;
      const receiver = selectedConversation.participants.find(p => (p.role === 'STUDENT' || p.role === 'PARENT') && p._id !== myId);
      if (!receiver) {
        toast.error('No recipient found');
        return;
      }

      const form = new FormData();
      form.append('file', file);
      form.append('receiverId', receiver._id);
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
        await openConversation(selectedConversation);
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
  };

  const [isClearingChat, setIsClearingChat] = useState(false)

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
        setMessages([])
        localStorage.removeItem(`teacherMessages_${selectedConversation._id}`)
        toast.success('Chat cleared successfully')
        load()
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

  const handleMessageSearch = async (query: string) => {
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

  // Debounced message search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (messageSearchQuery.trim()) {
        handleMessageSearch(messageSearchQuery)
      } else {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [messageSearchQuery, selectedConversation]);

  // Remove polling intervals as we now use Socket.IO for real-time updates
  // Keep a fallback polling for conversations list in case socket disconnects
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!socketManager.isConnected()) {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_SRS_SERVER}/communication/conversations`, { headers: { 'Authorization': `Bearer ${token}` } })
          if (res.ok) setConversations(await res.json())
        } catch {}
      }
    }, 30000) // Reduced frequency to 30 seconds as fallback
    return () => clearInterval(interval)
  }, [token])

  return (
    <>
      <div className={`h-screen overflow-hidden ${chatTheme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
        <div className="mx-auto max-w-6xl h-full grid grid-cols-1 md:grid-cols-3">
        <div className={`border-r ${chatTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} md:col-span-1 flex flex-col h-full overflow-hidden`}>
          <div className="p-4 font-semibold text-lg border-b">Chats</div>
          {/* Start new chat section at top */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="text-sm mb-2 font-medium">Start new chat</div>
            <Input
              placeholder="Search students or parents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-2"
            />
            <div className="space-y-2 max-h-48 overflow-auto">
              {/* Students Section */}
              {contacts.filter(c => 
                c.role === 'STUDENT' && 
                (!searchQuery.trim() || 
                 `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                 c.email?.toLowerCase().includes(searchQuery.toLowerCase()))
              ).length > 0 && (
                <div className="mb-3">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Students</div>
                  {contacts.filter(c => 
                    c.role === 'STUDENT' && 
                    (!searchQuery.trim() || 
                     `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     c.email?.toLowerCase().includes(searchQuery.toLowerCase()))
                  ).map(s => (
                    <div key={s._id} className="flex items-center justify-between text-sm p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-green-600 dark:text-green-300 text-xs font-medium">
                          {s.firstName?.[0]}{s.lastName?.[0]}
                        </div>
                        <div>
                          <div className="font-medium">{s.firstName} {s.lastName}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{s.email}</div>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => { 
                          setPendingReceiver(s); 
                          setSelectedConversation(null); 
                          setMessages([]); 
                        }}
                        className="hover:bg-green-50 dark:hover:bg-green-900"
                      >
                        Chat
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Parents Section */}
              {contacts.filter(c => 
                c.role === 'PARENT' && 
                (!searchQuery.trim() || 
                 `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                 c.email?.toLowerCase().includes(searchQuery.toLowerCase()))
              ).length > 0 && (
                <div>
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Parents</div>
                  {contacts.filter(c => 
                    c.role === 'PARENT' && 
                    (!searchQuery.trim() || 
                     `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     c.email?.toLowerCase().includes(searchQuery.toLowerCase()))
                  ).map(p => (
                    <div key={p._id} className="flex items-center justify-between text-sm p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300 text-xs font-medium">
                          {p.firstName?.[0]}{p.lastName?.[0]}
                        </div>
                        <div>
                          <div className="font-medium">{p.firstName} {p.lastName}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{p.email}</div>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => { 
                          setPendingReceiver(p); 
                          setSelectedConversation(null); 
                          setMessages([]); 
                        }}
                        className="hover:bg-blue-50 dark:hover:bg-blue-900"
                      >
                        Chat
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {contacts.length === 0 && (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  <div className="text-sm">No contacts available</div>
                  <div className="text-xs mt-1">Contact your administrator</div>
                </div>
              )}
            </div>
          </div>
          <div className="px-4 pb-2 pt-2 text-sm text-muted-foreground border-b">Recent Conversations</div>
          <ScrollArea className="flex-1 overflow-hidden">
            {conversations.map((cv) => {
              const storedUser = (() => { try { return JSON.parse(localStorage.getItem('userInfo') || '{}') } catch { return {} } })();
              const myId: string | undefined = storedUser?.id || storedUser?._id;
              const otherParticipant = cv.participants.find(p => (p.role === 'STUDENT' || p.role === 'PARENT') && p._id !== myId);
              if (!otherParticipant) return null;
              const roleLabel = otherParticipant.role === 'STUDENT' ? 'Student' : 'Parent';
              
              // Calculate unread count
              let unreadCount = 0;
              if (cv.unreadCount) {
                if (typeof cv.unreadCount === 'number') {
                  unreadCount = cv.unreadCount;
                } else if (cv.unreadCount instanceof Map) {
                  unreadCount = cv.unreadCount.get(myId?.toString() || '') || 0;
                } else if (typeof cv.unreadCount === 'object') {
                  unreadCount = (cv.unreadCount as Record<string, number>)[myId?.toString() || ''] || 0;
                }
              }
              
              // If unreadCount is 0, try to calculate from messages
              if (unreadCount === 0 && selectedConversation?._id !== cv._id) {
                try {
                  const cachedMessages = localStorage.getItem(`teacherMessages_${cv._id}`);
                  if (cachedMessages) {
                    const messages = JSON.parse(cachedMessages);
                    const myIdStr = myId?.toString() || '';
                    unreadCount = messages.filter((m: any) => {
                      const receiverIdStr = m.receiverId?.toString?.() || m.receiverId;
                      return receiverIdStr === myIdStr && !m.isRead;
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
                  onClick={() => openConversation(cv)}
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
                    <span className="font-medium">{roleLabel}</span> • {cv.lastMessageId?.content || 'Start chatting'}
                  </div>
                </div>
              );
            })}
            {conversations.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground">No conversations yet. Start a new chat above.</div>
            )}
          </ScrollArea>
        </div>
        <div className="md:col-span-2 flex flex-col h-full overflow-hidden">
          <div className={`p-4 border-b ${chatTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between flex-shrink-0`}>
            <div className="font-semibold">
              {selectedConversation ? (() => {
                const storedUser = (() => { try { return JSON.parse(localStorage.getItem('userInfo') || '{}') } catch { return {} } })();
                const myId: string | undefined = storedUser?.id || storedUser?._id;
                const otherParticipant = selectedConversation.participants.find(p => (p.role === 'STUDENT' || p.role === 'PARENT') && p._id !== myId);
                if (!otherParticipant) return 'Select a conversation';
                const roleLabel = otherParticipant.role === 'STUDENT' ? 'Student' : 'Parent';
                return `${otherParticipant.firstName || ''} ${otherParticipant.lastName || ''} (${roleLabel})`.trim();
              })() : pendingReceiver ? `${pendingReceiver.firstName} ${pendingReceiver.lastName} (${pendingReceiver.role === 'STUDENT' ? 'Student' : 'Parent'})` : 'Select a conversation'}
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
                  value={messageSearchQuery}
                  onChange={(e) => setMessageSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            {messages.map((m, index) => {
              // Fix sender identification - compare ObjectId strings properly
              const storedUser = (() => { try { return JSON.parse(localStorage.getItem('userInfo') || '{}') } catch { return {} } })();
              const meId: string | undefined = storedUser?.id || storedUser?._id;
              const isMine = m.senderId?.toString() === meId || m.senderId === meId;
              
              const bubbleClass = isMine ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 dark:text-white';
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
              
              return (
                <div key={m._id} className={`mb-2 flex ${align}`}>
                  <div className={`rounded-2xl max-w-[70%] ${isImageType || isVideoType ? 'p-0 overflow-hidden' : 'px-3 py-2'} ${bubbleClass}`}>
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
                            // Safely check if parentElement exists before modifying
                            if (imgElement.parentElement) {
                              imgElement.parentElement.innerHTML = `<div class="p-2 text-xs text-gray-500">Failed to load image</div>`;
                            }
                          }}
                        />
                        <div className={`text-xs px-2 pb-1 ${isMine ? 'text-blue-200' : 'text-gray-500'}`}>
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
                        <div className={`text-xs px-2 pb-1 ${isMine ? 'text-blue-200' : 'text-gray-500'}`}>
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ) : isAudioType ? (
                      <div className="space-y-2">
                        <audio controls src={fileUrl} className="w-full" />
                        <div className={`text-xs ${isMine ? 'text-blue-200' : 'text-gray-500'}`}>
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ) : isFileType ? (
                      <div className="space-y-2">
                        <div className={`flex items-center gap-2 p-2 ${isMine ? 'bg-blue-500' : 'bg-gray-100 dark:bg-gray-600'} rounded-lg`}>
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                          </svg>
                          <a 
                            href={fileUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className={`underline ${isMine ? 'text-white hover:text-blue-200' : 'hover:text-blue-600'}`}
                            download
                          >
                            {contentUrl.split('/').pop()?.split('?')[0] || 'Download file'}
                          </a>
                        </div>
                        <div className={`text-xs ${isMine ? 'text-blue-200' : 'text-gray-500'}`}>
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div>{m.content}</div>
                        <div className={`text-xs mt-1 ${isMine ? 'text-blue-200' : 'text-gray-500'}`}>
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
            {messages.length === 0 && (
              <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">No messages yet.</div>
            )}
            {otherUserTyping && (
              <div className="flex justify-start mb-2">
                <div className="px-3 py-2 rounded-2xl bg-gray-200 dark:bg-gray-700 text-sm text-muted-foreground">
                  Student is typing...
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
                id="file-upload-teacher"
              />
              {/* <label 
                htmlFor="file-upload-teacher" 
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
                onKeyDown={e => e.key === 'Enter' && handleSend()} 
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
                    handleSend();
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
