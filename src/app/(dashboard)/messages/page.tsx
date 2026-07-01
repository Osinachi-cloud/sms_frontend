'use client';

import { messageApi, userApi, emailApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, User, Users, ChevronLeft, Plus, Search, Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import toast from 'react-hot-toast';

export default function MessagesPage() {
  const { currentSchool, user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConv, setActiveConv] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showNewConv, setShowNewConv] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  // Broadcast email state
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcastRecipients, setBroadcastRecipients] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);

  useEffect(() => {
    if (currentSchool?.id) {
      loadConversations();
    }
  }, [currentSchool]);

  const loadConversations = async () => {
    if (!currentSchool?.id) return;
    setLoadingConversations(true);
    try {
      const res = await messageApi.getConversations(currentSchool.id, { size: 50 });
      setConversations(res.data?.content || res.data || []);
    } catch {
      toast.error('Failed to load conversations');
      setConversations([]);
    } finally {
      setLoadingConversations(false);
    }
  };

  const openConversation = async (conv: any) => {
    setActiveConv(conv);
    setLoadingMessages(true);
    setMessages([]);
    try {
      const res = await messageApi.getMessages(conv.id, { size: 100 });
      setMessages(res.data?.content || res.data || []);
    } catch {
      toast.error('Failed to load messages');
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
    setConversations((prev) => prev.map((c) => c.id === conv.id ? { ...c, unreadCount: 0 } : c));
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConv) return;
    setSending(true);
    try {
      const res = await messageApi.sendMessage(activeConv.id, { content: newMessage.trim() });
      const msg = res.data || {
        id: Date.now().toString(),
        senderId: user?.id || 'me',
        senderName: 'You',
        content: newMessage.trim(),
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, msg]);
      setNewMessage('');
    } catch {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const searchUsers = async (query: string) => {
    setSearchQuery(query);
    if (!currentSchool?.id || query.length < 2) {
      setAvailableUsers([]);
      return;
    }
    setSearchingUsers(true);
    try {
      const res = await userApi.getAll(currentSchool.id, { search: query, size: 20 });
      setAvailableUsers(res.data?.content || res.data || []);
    } catch {
      setAvailableUsers([]);
    } finally {
      setSearchingUsers(false);
    }
  };

  const startConversation = async (targetUser: any) => {
    if (!currentSchool?.id) return;
    try {
      const res = await messageApi.createConversation(currentSchool.id, {
        participantIds: [targetUser.id],
        title: targetUser.fullName,
      });
      const newConv = res.data;
      setConversations((prev) => [newConv, ...prev]);
      setShowNewConv(false);
      setSearchQuery('');
      setAvailableUsers([]);
      openConversation(newConv);
    } catch {
      toast.error('Failed to start conversation');
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastSubject.trim() || !broadcastBody.trim()) {
      toast.error('Subject and message are required');
      return;
    }
    const emails = broadcastRecipients
      .split(/[,\n]/)
      .map((e) => e.trim())
      .filter((e) => e.length > 0);
    if (emails.length === 0) {
      toast.error('Add at least one recipient email');
      return;
    }
    try {
      setBroadcasting(true);
      await emailApi.broadcast(currentSchool?.id || '', {
        recipients: emails,
        subject: broadcastSubject,
        htmlBody: broadcastBody,
      });
      toast.success(`Broadcast queued for ${emails.length} recipient(s)`);
      setShowBroadcast(false);
      setBroadcastSubject('');
      setBroadcastBody('');
      setBroadcastRecipients('');
    } catch {
      toast.error('Failed to send broadcast email');
    } finally {
      setBroadcasting(false);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col -mx-4 sm:-mx-6 -mt-4 sm:-mt-6" data-tour="messages">
      <div className="flex-1 flex overflow-hidden">
        {/* Conversation List */}
        <div className={`${activeConv ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col border-r border-white/20 dark:border-slate-700/50 glass`}>
          <div className="p-4 border-b border-white/20 dark:border-slate-700/50 flex items-center justify-between">
            <h2 className="font-semibold">Messages</h2>
            <div className="flex items-center gap-1">
              <button onClick={() => setShowBroadcast(true)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="Broadcast Email">
                <Mail className="w-4 h-4" />
              </button>
              <button onClick={() => setShowNewConv(true)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="New Conversation">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-2 space-y-1">
            {loadingConversations ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No conversations yet</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => openConversation(conv)}
                  className={`w-full text-left p-3 rounded-xl transition-colors flex items-center gap-3 ${
                    activeConv?.id === conv.id ? 'bg-primary-50 dark:bg-primary-900/20' : 'hover:bg-white/50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                    {conv.type === 'GROUP' ? <Users className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm truncate">{conv.title}</p>
                      {conv.unreadCount > 0 && (
                        <span className="w-5 h-5 rounded-full bg-primary-500 text-white text-[10px] flex items-center justify-center flex-shrink-0">{conv.unreadCount}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate">{conv.lastMessage?.content}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`${activeConv ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-white/30 dark:bg-slate-950/30`}>
          {activeConv ? (
            <>
              <div className="p-4 border-b border-white/20 dark:border-slate-700/50 flex items-center gap-3 glass">
                <button onClick={() => setActiveConv(null)} className="md:hidden p-2 -ml-2">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-xs">
                  {activeConv.title?.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-sm">{activeConv.title}</p>
                  <p className="text-[10px] text-slate-500">
                    {activeConv.participants?.map((p: any) => p.fullName).join(', ')}
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-auto p-4 space-y-3">
                {loadingMessages ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] sm:max-w-[60%] px-4 py-2.5 rounded-2xl text-sm ${
                        msg.senderId === user?.id
                          ? 'bg-primary-600 text-white rounded-br-md'
                          : 'glass-card rounded-bl-md'
                      }`}>
                        <p>{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${msg.senderId === user?.id ? 'text-white/70' : 'text-slate-400'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-3 border-t border-white/20 dark:border-slate-700/50 glass">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !sending && sendMessage()}
                    placeholder="Type a message..."
                    className="glass-input flex-1"
                    disabled={sending}
                  />
                  <Button size="sm" onClick={sendMessage} disabled={sending || !newMessage.trim()}>
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Conversation Modal */}
      <Modal isOpen={showNewConv} onClose={() => { setShowNewConv(false); setSearchQuery(''); setAvailableUsers([]); }} title="New Conversation" size="sm">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="glass-input w-full pl-9"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => searchUsers(e.target.value)}
            />
          </div>
          {searchingUsers ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
            </div>
          ) : availableUsers.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-auto">
              {availableUsers.map((u: any) => (
                <button key={u.id} onClick={() => startConversation(u)} className="w-full text-left p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 text-xs font-bold">{u.fullName?.charAt(0) || 'U'}</div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm block truncate">{u.fullName}</span>
                    <span className="text-[10px] text-slate-400">{u.email}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : searchQuery.length >= 2 ? (
            <p className="text-xs text-slate-400 text-center py-2">No users found</p>
          ) : (
            <p className="text-xs text-slate-400 text-center py-2">Type at least 2 characters to search</p>
          )}
        </div>
      </Modal>

      {/* Broadcast Email Modal */}
      <Modal isOpen={showBroadcast} onClose={() => setShowBroadcast(false)} title="Broadcast Email" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject</label>
            <input
              type="text"
              value={broadcastSubject}
              onChange={(e) => setBroadcastSubject(e.target.value)}
              placeholder="e.g. PTA Meeting Announcement"
              className="glass-input w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Recipients <span className="text-xs text-slate-400 font-normal">(comma or newline separated)</span>
            </label>
            <textarea
              value={broadcastRecipients}
              onChange={(e) => setBroadcastRecipients(e.target.value)}
              placeholder="[EMAIL_REDACTED], [EMAIL_REDACTED]"
              rows={3}
              className="glass-input w-full resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Message (HTML supported)</label>
            <textarea
              value={broadcastBody}
              onChange={(e) => setBroadcastBody(e.target.value)}
              placeholder="Type your broadcast message..."
              rows={6}
              className="glass-input w-full resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowBroadcast(false)}>
              Cancel
            </Button>
            <Button onClick={handleBroadcast} disabled={broadcasting}>
              {broadcasting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Mail className="w-4 h-4 mr-2" />
              )}
              {broadcasting ? 'Sending...' : 'Send Broadcast'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
