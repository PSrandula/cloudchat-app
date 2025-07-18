import React, { useState, useEffect, useRef } from 'react';
import { auth, database } from '../firebase/config';
import { ref, push, onValue, off, serverTimestamp, set, update, remove } from 'firebase/database';
import { signOut, updateProfile } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { FiMoreVertical, FiSearch, FiPaperclip, FiMic, FiImage, FiUsers, FiSend, FiBell, FiBellOff, FiVideo, FiPhone, FiLogOut } from 'react-icons/fi';
import { BsCheck2All, BsCheck2, BsEmojiSmile } from 'react-icons/bs';
import { AiOutlineClose } from 'react-icons/ai';

const ChatPage = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [user, setUser] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [activeChat, setActiveChat] = useState('general');
  const [searchTerm, setSearchTerm] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [groupChats, setGroupChats] = useState([]);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [showSidebar, setShowSidebar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [notificationMessages, setNotificationMessages] = useState([]);
  const [editingProfile, setEditingProfile] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newProfileImage, setNewProfileImage] = useState(null);
  const [callStatus, setCallStatus] = useState(null);
  const [callType, setCallType] = useState(null);
  const [callerInfo, setCallerInfo] = useState(null);
  const [ringtone, setRingtone] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const profileImageInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const navigate = useNavigate();

  // Sample contacts data
  const sampleContacts = [
    { id: '1', name: 'Alex Johnson', email: 'alex@example.com', status: 'Active now', lastSeen: null, avatar: null },
    { id: '2', name: 'Sarah Wilson', email: 'sarah@example.com', status: 'Click to start chatting', lastSeen: Date.now() - 300000, avatar: null },
    { id: '3', name: 'Mike Chen', email: 'mike@example.com', status: 'Active now', lastSeen: null, avatar: null },
    { id: '4', name: 'Emma Davis', email: 'emma@example.com', status: 'Last seen 2 hours ago', lastSeen: Date.now() - 7200000, avatar: null },
    { id: '5', name: 'John Smith', email: 'john@example.com', status: 'Active now', lastSeen: null, avatar: null },
  ];

  // Sample group chats
  const sampleGroupChats = [
    { id: 'general', name: 'General Chat', description: 'Welcome to CloudChat!', members: ['1', '2', '3', 'current'], admin: 'current' },
    { id: 'team', name: 'Team Discussion', description: 'Work-related discussions', members: ['1', '3', 'current'], admin: 'current' },
    { id: 'random', name: 'Random Chat', description: 'Random conversations', members: ['2', '4', '5', 'current'], admin: 'current' },
  ];

  // Common emojis
  const commonEmojis = ['😊', '😂', '❤️', '👍', '👎', '😢', '😮', '😡', '🎉', '🔥', '💯', '👏'];

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Upload image
  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('key', '8e6f0f56f710ecef30fa688f0a52db1b'); 
    
    try {
      setIsUploading(true);
      const response = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      return data.data.url;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Handle image selection
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Handle profile image selection
  const handleProfileImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewProfileImage(file);
    }
  };

  // Remove image
  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Typing indicator
  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      const typingRef = ref(database, `chats/${activeChat}/typing/${user.uid}`);
      set(typingRef, {
        name: user.displayName || user.email.split('@')[0],
        timestamp: serverTimestamp()
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      const typingRef = ref(database, `chats/${activeChat}/typing/${user.uid}`);
      set(typingRef, null);
    }, 1000);
  };

  // Auth state listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setContacts(sampleContacts);
        setGroupChats(sampleGroupChats);
        setNewDisplayName(currentUser.displayName || '');
        
        // Set user as online
        const userStatusRef = ref(database, `users/${currentUser.uid}/status`);
        await set(userStatusRef, {
          online: true,
          lastSeen: serverTimestamp()
        });

        // Listen for incoming calls
        const callRef = ref(database, `users/${currentUser.uid}/currentCall`);
        const unsubscribeCall = onValue(callRef, (snapshot) => {
          const callData = snapshot.val();
          if (callData) {
            setCallType(callData.type);
            setCallStatus('incoming');
            setCallerInfo({
              id: callData.from,
              name: callData.callerName
            });
            
            // Play ringtone for incoming call
            if (notifications) {
              const rt = playCallRingtone();
              setRingtone(rt);
            }
          } else {
            if (ringtone) {
              ringtone.pause();
              setRingtone(null);
            }
          }
        });

        // Handle disconnect
        const handleDisconnect = async () => {
          await set(userStatusRef, {
            online: false,
            lastSeen: serverTimestamp()
          });
          // End any ongoing calls
          await set(ref(database, `users/${currentUser.uid}/currentCall`), null);
        };

        window.addEventListener('beforeunload', handleDisconnect);
        return () => {
          window.removeEventListener('beforeunload', handleDisconnect);
          off(callRef);
          unsubscribeCall();
        };
      } else {
        navigate('/login');
      }
    });

    return () => {
      unsubscribe();
    };
  }, [navigate, notifications]);

  // Load messages
  useEffect(() => {
    if (!user || !activeChat) return;

    setLoading(true);
    const messagesRef = ref(database, `chats/${activeChat}/messages`);
    const unsubscribeMessages = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedMessages = Object.entries(data).map(([id, msg]) => ({
          id,
          ...msg,
          status: msg.status || 'sent'
        }));
        loadedMessages.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        setMessages(loadedMessages);
        
        // Mark messages as read
        loadedMessages.forEach(msg => {
          if (msg.senderId !== user.uid && msg.status !== 'read') {
            const messageRef = ref(database, `chats/${activeChat}/messages/${msg.id}/status`);
            set(messageRef, 'read');
          }
        });
      } else {
        setMessages([]);
      }
      setLoading(false);
    });

    // Typing indicators
    const typingRef = ref(database, `chats/${activeChat}/typing`);
    const unsubscribeTyping = onValue(typingRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const typingList = Object.entries(data)
          .filter(([uid]) => uid !== user.uid)
          .map(([uid, info]) => info.name);
        setTypingUsers(typingList);
      } else {
        setTypingUsers([]);
      }
    });

    // Online users
    const usersRef = ref(database, 'users');
    const unsubscribeUsers = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const online = {};
        Object.entries(data).forEach(([uid, info]) => {
          online[uid] = info.status?.online || false;
        });
        setOnlineUsers(online);
      }
    });

    return () => {
      off(messagesRef);
      off(typingRef);
      off(usersRef);
      unsubscribeMessages();
      unsubscribeTyping();
      unsubscribeUsers();
    };
  }, [activeChat, user]);

  // Notification system
  useEffect(() => {
    if (!user || !notifications) return;

    const notificationsRef = ref(database, `users/${user.uid}/notifications`);
    const unsubscribeNotifications = onValue(notificationsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const notificationList = Object.entries(data).map(([id, notification]) => ({
          id,
          ...notification
        }));
        setNotificationMessages(notificationList);
        
        // Play notification sound if new notification arrives
        if (notificationList.length > 0 && notificationList[0].timestamp > Date.now() - 1000) {
          if (notificationList[0].type === 'call') {
            playCallRingtone();
          } else {
            playNotificationSound();
          }
        }
      } else {
        setNotificationMessages([]);
      }
    });

    return () => {
      off(notificationsRef);
      unsubscribeNotifications();
    };
  }, [user, notifications]);

  const playNotificationSound = () => {
    const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3');
    audio.play().catch(e => console.log('Audio play failed:', e));
  };

  const playCallRingtone = () => {
    const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-classic-alarm-995.mp3');
    audio.loop = true;
    audio.play().catch(e => console.log('Audio play failed:', e));
    return audio;
  };

  const clearNotifications = async () => {
    try {
      const notificationsRef = ref(database, `users/${user.uid}/notifications`);
      await set(notificationsRef, null);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (message.trim() === '' && !imageFile) return;

    setIsUploading(true);
    let imageUrl = null;

    try {
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const messagesRef = ref(database, `chats/${activeChat}/messages`);
      const newMessageRef = push(messagesRef);
      
      const messageData = {
        text: message,
        senderId: user.uid,
        senderEmail: user.email,
        senderName: user.displayName || user.email.split('@')[0],
        timestamp: serverTimestamp(),
        status: 'sent',
        imageUrl: imageUrl || null,
        type: imageUrl ? 'image' : 'text'
      };

      await set(newMessageRef, messageData);
      setMessage('');
      removeImage();
      
      setIsTyping(false);
      const typingRef = ref(database, `chats/${activeChat}/typing/${user.uid}`);
      set(typingRef, null);

      setTimeout(() => {
        update(ref(database, `chats/${activeChat}/messages/${newMessageRef.key}`), { status: 'delivered' });
      }, 1000);
      
      setTimeout(() => {
        update(ref(database, `chats/${activeChat}/messages/${newMessageRef.key}`), { status: 'read' });
      }, 2000);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // Delete message
  const handleDeleteMessage = async (messageId) => {
    try {
      const messageRef = ref(database, `chats/${activeChat}/messages/${messageId}`);
      await remove(messageRef);
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  // Create group
  const handleCreateGroup = async () => {
    if (newGroupName.trim() === '' || selectedMembers.length === 0) return;

    const groupId = `group_${Date.now()}`;
    const groupRef = ref(database, `chats/${groupId}`);
    
    const groupData = {
      name: newGroupName,
      type: 'group',
      members: [...selectedMembers, user.uid],
      admin: user.uid,
      createdAt: serverTimestamp(),
      description: `Group created by ${user.displayName || user.email.split('@')[0]}`
    };

    try {
      await set(groupRef, groupData);
      setGroupChats(prev => [...prev, { id: groupId, ...groupData }]);
      setShowNewGroupModal(false);
      setNewGroupName('');
      setSelectedMembers([]);
      setActiveChat(groupId);
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  // Profile update
  const handleProfileUpdate = async () => {
    try {
      const updates = {};
      if (newDisplayName.trim() !== '') {
        updates['displayName'] = newDisplayName.trim();
      }
      
      if (newProfileImage) {
        const imageUrl = await uploadImage(newProfileImage);
        updates['photoURL'] = imageUrl;
      }
      
      await updateProfile(auth.currentUser, updates);
      setUser(auth.currentUser);
      setEditingProfile(false);
      setNewDisplayName('');
      setNewProfileImage(null);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  // Call functions
  const initiateCall = async (type) => {
    const callId = `call_${Date.now()}`;
    const callRef = ref(database, `users/${activeChat}/currentCall`);
    
    await set(callRef, {
      type,
      from: user.uid,
      callerName: user.displayName || user.email.split('@')[0],
      callId,
      timestamp: serverTimestamp()
    });
    
    setCallType(type);
    setCallStatus('calling');
    setCallerInfo({
      id: user.uid,
      name: user.displayName || user.email.split('@')[0]
    });
    
    // Set timeout for unanswered call
    setTimeout(() => {
      if (callStatus === 'calling') {
        endCall();
      }
    }, 30000); // 30 seconds timeout
  };

  const answerCall = async () => {
    setCallStatus('ongoing');
    if (ringtone) {
      ringtone.pause();
      setRingtone(null);
    }
    // In a real app, you would create an answer here and exchange ICE candidates
  };

  const endCall = async () => {
    // Clear call status for both users
    if (callStatus === 'calling' || callStatus === 'ongoing') {
      await set(ref(database, `users/${activeChat}/currentCall`), null);
    }
    await set(ref(database, `users/${user.uid}/currentCall`), null);
    
    setCallStatus(null);
    setCallType(null);
    setCallerInfo(null);
    
    if (ringtone) {
      ringtone.pause();
      setRingtone(null);
    }
  };

  const handleVoiceCall = () => initiateCall('voice');
  const handleVideoCall = () => initiateCall('video');

  // Sign out
  const handleSignOut = async () => {
    try {
      if (user) {
        const userStatusRef = ref(database, `users/${user.uid}/status`);
        await set(userStatusRef, {
          online: false,
          lastSeen: serverTimestamp()
        });
        await set(ref(database, `users/${user.uid}/currentCall`), null);
      }
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Format time
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format last seen
  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return 'Active now';
    const diff = Date.now() - lastSeen;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Active now';
    if (minutes < 60) return `Last seen ${minutes}m ago`;
    if (hours < 24) return `Last seen ${hours}h ago`;
    return `Last seen ${days}d ago`;
  };

  // Filter contacts
  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get chat info
  const getCurrentChatInfo = () => {
    if (activeChat === 'general' || activeChat.startsWith('group_')) {
      const groupChat = groupChats.find(g => g.id === activeChat);
      return {
        name: groupChat?.name || 'General Chat',
        status: groupChat?.description || 'Group chat',
        isGroup: true,
        members: groupChat?.members || []
      };
    } else {
      const contact = contacts.find(c => c.id === activeChat);
      return {
        name: contact?.name || 'Unknown',
        status: onlineUsers[activeChat] ? 'Active now' : formatLastSeen(contact?.lastSeen),
        isGroup: false,
        isOnline: onlineUsers[activeChat] || false
      };
    }
  };

  const currentChatInfo = getCurrentChatInfo();

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      {/* Sidebar */}
      <div className={`w-full md:w-1/3 lg:w-1/4 xl:w-1/5 border-r border-gray-700 flex flex-col bg-gray-800 ${showSidebar ? 'block' : 'hidden md:flex'}`}>
        {/* User header */}
        <div className="bg-gray-800 p-4 flex justify-between items-center border-b border-gray-700">
          <div className="flex items-center">
            <div className="relative">
              {user?.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt="Profile" 
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 flex items-center justify-center text-white font-bold">
                  {user?.email?.charAt(0).toUpperCase()}
                </div>
              )}
              {onlineUsers[user?.uid] && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
              )}
            </div>
            <div className="ml-3">
              <span className="font-medium block truncate">
                {user?.displayName || user?.email?.split('@')[0]}
              </span>
              <span className="text-xs text-gray-400">
                {onlineUsers[user?.uid] ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setNotifications(!notifications)}
              className="text-gray-400 hover:text-white relative"
            >
              {notifications ? <FiBell size={18} /> : <FiBellOff size={18} />}
              {notificationMessages.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {notificationMessages.length}
                </span>
              )}
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="text-gray-400 hover:text-white"
              >
                <FiMoreVertical size={18} />
              </button>
              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-50 border border-gray-700">
                  <button
                    onClick={() => {
                      setNewDisplayName(user.displayName || '');
                      setEditingProfile(true);
                      setShowProfileDropdown(false);
                    }}
                    className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 w-full text-left"
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 w-full text-left"
                  >
                    <FiLogOut className="mr-2" size={14} />
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="p-3 bg-gray-800 border-b border-gray-700">
          <div className="relative">
            <FiSearch className="absolute left-3 top-3 text-gray-500" size={16} />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full py-2 pl-10 pr-3 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm text-white placeholder-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Contacts */}
        <div className="flex-1 overflow-y-auto bg-gray-800">
          <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-700">
            Private Chats
          </div>
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className={`flex items-center p-3 cursor-pointer hover:bg-gray-700 transition-colors ${
                activeChat === contact.id ? 'bg-gray-700 border-r-2 border-purple-500' : ''
              }`}
              onClick={() => {
                setActiveChat(contact.id);
                setShowSidebar(false);
              }}
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 flex items-center justify-center text-white font-bold">
                  {contact.name.charAt(0)}
                </div>
                {onlineUsers[contact.id] && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-800"></div>
                )}
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className="font-medium truncate">{contact.name}</span>
                  {unreadCounts[contact.id] > 0 && (
                    <span className="bg-purple-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                      {unreadCounts[contact.id]}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400 truncate">
                  {onlineUsers[contact.id] ? 'Active now' : formatLastSeen(contact.lastSeen)}
                </p>
              </div>
            </div>
          ))}

          <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-700 flex justify-between items-center">
            <span>Group Chats</span>
            <button
              onClick={() => setShowNewGroupModal(true)}
              className="text-purple-400 hover:text-purple-300"
            >
              <FiUsers size={16} />
            </button>
          </div>
          {groupChats.map((group) => (
            <div
              key={group.id}
              className={`flex items-center p-3 cursor-pointer hover:bg-gray-700 transition-colors ${
                activeChat === group.id ? 'bg-gray-700 border-r-2 border-purple-500' : ''
              }`}
              onClick={() => {
                setActiveChat(group.id);
                setShowSidebar(false);
              }}
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold">
                {group.name.charAt(0)}
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className="font-medium truncate">{group.name}</span>
                  {unreadCounts[group.id] > 0 && (
                    <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                      {unreadCounts[group.id]}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400 truncate">
                  {group.members?.length || 0} members
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-gray-900">
        {/* Chat header */}
        <div className="bg-gray-800 p-4 flex justify-between items-center border-b border-gray-700">
          <div className="flex items-center">
            <button 
              onClick={() => setShowSidebar(!showSidebar)}
              className="md:hidden mr-2 text-gray-400 hover:text-white"
            >
              <FiMoreVertical size={20} />
            </button>
            
            <div className="flex items-center">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 flex items-center justify-center text-white font-bold">
                  {currentChatInfo.name.charAt(0)}
                </div>
                {!currentChatInfo.isGroup && currentChatInfo.isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                )}
              </div>
              <div className="ml-3">
                <div className="font-medium">
                  {currentChatInfo.name}
                </div>
                <div className="text-xs text-gray-400">
                  {typingUsers.length > 0 ? (
                    <span className="text-purple-400">
                      {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                    </span>
                  ) : (
                    currentChatInfo.status
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {!currentChatInfo.isGroup && (
              <>
                <button 
                  onClick={handleVoiceCall}
                  className={`p-2 rounded-full transition-colors ${
                    callStatus === 'calling' || callStatus === 'ongoing'
                      ? 'bg-green-600 text-white'
                      : 'text-gray-400 hover:text-green-500'
                  }`}
                  title="Voice call"
                  disabled={callStatus}
                >
                  <FiPhone size={20} />
                </button>
                <button 
                  onClick={handleVideoCall}
                  className={`p-2 rounded-full transition-colors ${
                    callStatus === 'calling' || callStatus === 'ongoing'
                      ? 'bg-green-600 text-white'
                      : 'text-gray-400 hover:text-green-500'
                  }`}
                  title="Video call"
                  disabled={callStatus}
                >
                  <FiVideo size={20} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-900">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-600"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center mt-8">
              <div className="inline-block bg-gray-800 rounded-lg px-6 py-4 shadow-sm">
                <p className="text-gray-400">
                  {currentChatInfo.isGroup ? 'Welcome to the group chat! 👋' : 'Start a conversation! 💬'}
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex mb-4 ${msg.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs md:max-w-md rounded-2xl p-3 shadow-sm relative group ${
                    msg.senderId === user?.uid
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                      : 'bg-gray-800 text-gray-100'
                  }`}
                >
                  {msg.senderId === user?.uid && (
                    <button
                      onClick={() => handleDeleteMessage(msg.id)}
                      className="absolute -right-2 -top-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ width: '20px', height: '20px' }}
                    >
                      <AiOutlineClose size={12} />
                    </button>
                  )}
                  
                  {msg.senderId !== user?.uid && currentChatInfo.isGroup && (
                    <p className="text-xs font-semibold text-purple-400 mb-1">
                      {msg.senderName}
                    </p>
                  )}
                  
                  {msg.type === 'image' && msg.imageUrl && (
                    <div className="mb-2">
                      <img
                        src={msg.imageUrl}
                        alt="Shared image"
                        className="rounded-lg max-w-full h-auto cursor-pointer"
                        onClick={() => window.open(msg.imageUrl, '_blank')}
                      />
                    </div>
                  )}
                  
                  {msg.text && <p className="break-words">{msg.text}</p>}
                  
                  <div className="flex items-center justify-end mt-2 space-x-1">
                    <span className={`text-xs ${msg.senderId === user?.uid ? 'text-blue-200' : 'text-gray-500'}`}>
                      {formatTime(msg.timestamp)}
                    </span>
                    {msg.senderId === user?.uid && (
                      <span className="text-xs">
                        {msg.status === 'read' ? (
                          <BsCheck2All className="text-blue-300" />
                        ) : msg.status === 'delivered' ? (
                          <BsCheck2All className="text-gray-400" />
                        ) : (
                          <BsCheck2 className="text-gray-400" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Image preview */}
        {imagePreview && (
          <div className="bg-gray-800 p-3 border-t border-gray-700">
            <div className="flex items-center space-x-3">
              <img src={imagePreview} alt="Preview" className="w-16 h-16 rounded-lg object-cover" />
              <span className="text-sm text-gray-400">Image ready to send</span>
              <button
                onClick={removeImage}
                className="text-red-500 hover:text-red-400"
              >
                <AiOutlineClose size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Message input */}
        <div className="bg-gray-800 p-4 border-t border-gray-700">
          <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/*"
              className="hidden"
            />
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-gray-400 hover:text-purple-400 transition-colors"
            >
              <FiImage size={20} />
            </button>
            
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="text-gray-400 hover:text-purple-400 transition-colors"
            >
              <BsEmojiSmile size={20} />
            </button>
            
            <div className="flex-1 relative">
              <input
                type="text"
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  handleTyping();
                }}
                placeholder="Type a message..."
                className="w-full py-3 px-4 bg-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-600 text-sm text-white placeholder-gray-400"
                disabled={isUploading}
              />
              
              {showEmojiPicker && (
                <div className="absolute bottom-12 left-0 bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-lg">
                  <div className="grid grid-cols-6 gap-2">
                    {commonEmojis.map((emoji, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setMessage(prev => prev + emoji);
                          setShowEmojiPicker(false);
                        }}
                        className="text-xl hover:bg-gray-700 p-1 rounded"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <button
              type="submit"
              disabled={isUploading || (message.trim() === '' && !imageFile)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-3 rounded-full hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <FiSend size={18} />
              )}
            </button>
          </form>
        </div>
      </div>

      {/* New Group Modal */}
      {showNewGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Create New Group</h3>
              <button
                onClick={() => {
                  setShowNewGroupModal(false);
                  setNewGroupName('');
                  setSelectedMembers([]);
                }}
                className="text-gray-400 hover:text-white"
              >
                <AiOutlineClose size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Group Name
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Enter group name"
                  className="w-full p-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 bg-gray-700 text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Select Members
                </label>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center p-2 hover:bg-gray-700 rounded-lg cursor-pointer"
                      onClick={() => {
                        setSelectedMembers(prev => 
                          prev.includes(contact.id)
                            ? prev.filter(id => id !== contact.id)
                            : [...prev, contact.id]
                        );
                      }}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                        {contact.name.charAt(0)}
                      </div>
                      <span className="ml-3 text-sm">{contact.name}</span>
                      {selectedMembers.includes(contact.id) && (
                        <div className="ml-auto text-purple-400">
                          <BsCheck2 size={16} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowNewGroupModal(false);
                    setNewGroupName('');
                    setSelectedMembers([]);
                  }}
                  className="px-4 py-2 text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateGroup}
                  disabled={newGroupName.trim() === '' || selectedMembers.length === 0}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Group
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Edit Modal */}
      {editingProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit Profile</h3>
              <button
                onClick={() => setEditingProfile(false)}
                className="text-gray-400 hover:text-white"
              >
                <AiOutlineClose size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  {user?.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt="Profile" 
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 flex items-center justify-center text-white font-bold text-4xl">
                      {user?.email?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <button
                    onClick={() => profileImageInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-gray-700 p-2 rounded-full hover:bg-gray-600"
                  >
                    <FiImage size={16} />
                  </button>
                  <input
                    type="file"
                    ref={profileImageInputRef}
                    onChange={handleProfileImageSelect}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full p-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 bg-gray-700 text-white"
                />
              </div>
              
              {newProfileImage && (
                <div className="bg-gray-700 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">New profile image selected</span>
                    <button
                      onClick={() => setNewProfileImage(null)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <AiOutlineClose size={16} />
                    </button>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setEditingProfile(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProfileUpdate}
                  disabled={newDisplayName.trim() === '' && !newProfileImage}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Call Modal */}
      {callStatus && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-8 w-full max-w-md text-center">
            <div className="mb-6">
              {callStatus === 'calling' ? (
                <p className="text-xl">Calling {currentChatInfo.name}...</p>
              ) : callStatus === 'incoming' ? (
                <p className="text-xl">Incoming {callType} call from {callerInfo.name}</p>
              ) : (
                <p className="text-xl">Ongoing {callType} call with {currentChatInfo.name}</p>
              )}
            </div>
            
            <div className="flex justify-center space-x-8">
              <button
                onClick={endCall}
                className="bg-red-600 text-white p-4 rounded-full hover:bg-red-700"
              >
                <FiPhone size={24} />
              </button>
              
              {callStatus === 'incoming' && (
                <button
                  onClick={answerCall}
                  className="bg-green-600 text-white p-4 rounded-full hover:bg-green-700"
                >
                  <FiPhone size={24} />
                </button>
              )}
            </div>
            
            {callType === 'video' && callStatus === 'ongoing' && (
              <div className="mt-6 bg-black rounded-lg overflow-hidden">
                <div className="aspect-video bg-gray-900 flex items-center justify-center">
                  <p className="text-gray-400">Video stream would appear here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;