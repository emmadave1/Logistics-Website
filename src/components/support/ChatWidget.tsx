import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Minus, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ChatMessage, ChatConversation } from '@/types/support';
import {
  getChatConversation,
  saveChatConversation,
  getBotResponse,
  markConversationReadByUser,
  getUnreadForUser,
  GENERAL_CHAT_KEY,
} from '@/services/supportService';
import { getRecentlyTracked } from '@/services/storage';
import { useLocation } from 'react-router-dom';

function resolveConversationKey(search: string): string {
  const fromUrl = new URLSearchParams(search).get('id');
  if (fromUrl) return fromUrl.toUpperCase();
  const recent = getRecentlyTracked();
  if (recent.length > 0) return recent[0].trackingId.toUpperCase();
  return GENERAL_CHAT_KEY;
}

function formatMessageTime(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return sameDay ? time : `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} · ${time}`;
}

export default function ChatWidget() {
  const location = useLocation();
  const conversationKey = resolveConversationKey(location.search);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Agent online status (simulated - changes every few minutes)
  const [isAgentOnline] = useState(() => Math.random() > 0.3);

  // Load the persisted conversation for the active tracking ID
  useEffect(() => {
    setConversation(getChatConversation(conversationKey));
    setUnreadCount(getUnreadForUser(conversationKey));
  }, [conversationKey]);

  // Poll for live agent replies sent from the admin dashboard
  useEffect(() => {
    const interval = setInterval(() => {
      const saved = getChatConversation(conversationKey);
      if (!saved) return;
      setUnreadCount(getUnreadForUser(conversationKey));
      setConversation((current) => {
        if (!current) return saved;
        // Refresh when new messages arrive OR read receipts change
        const changed =
          saved.messages.length !== current.messages.length ||
          saved.messages.filter((m) => m.readAt).length !==
            current.messages.filter((m) => m.readAt).length;
        return changed ? saved : current;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [conversationKey]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation?.messages]);

  // Mark admin/bot replies as read while the chat is open
  useEffect(() => {
    if (!isOpen || isMinimized || !conversation) return;
    if (conversation.messages.some((m) => !m.isUser && !m.readAt)) {
      const updated = markConversationReadByUser(conversationKey);
      if (updated) setConversation(updated);
    }
    setUnreadCount(0);
  }, [isOpen, isMinimized, conversation, conversationKey]);

  const initializeConversation = () => {
    const newConversation: ChatConversation = {
      id: Date.now().toString(),
      messages: [
        {
          id: '1',
          content: "Hello! 👋 Welcome to Movemate LogisticExpress support. How can I help you today?",
          isUser: false,
          timestamp: new Date().toISOString(),
          quickReplies: ['Track my shipment', 'Delivery timeline', 'Lost tracking ID', 'Speak to an agent'],
        },
      ],
      isAgentOnline,
      trackingId: conversationKey === GENERAL_CHAT_KEY ? undefined : conversationKey,
      startedAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString(),
    };
    setConversation(newConversation);
    saveChatConversation(newConversation, conversationKey);
  };

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
    if (!conversation) {
      initializeConversation();
    }
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const sendMessage = (content: string) => {
    if (!content.trim() || !conversation) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: content.trim(),
      isUser: true,
      timestamp: new Date().toISOString(),
    };

    const updatedConversation = {
      ...conversation,
      messages: [...conversation.messages, userMessage],
      lastMessageAt: new Date().toISOString(),
    };
    setConversation(updatedConversation);
    saveChatConversation(updatedConversation, conversationKey);
    setMessage('');

    // A live agent has taken over — no bot replies
    if (conversation.agentHandled) return;

    // Simulate bot typing
    setIsTyping(true);
    setTimeout(() => {
      const botResponse = getBotResponse(content);
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: botResponse.response,
        isUser: false,
        timestamp: new Date().toISOString(),
        quickReplies: botResponse.quickReplies,
      };

      const finalConversation = {
        ...updatedConversation,
        messages: [...updatedConversation.messages, botMessage],
        lastMessageAt: new Date().toISOString(),
      };
      setConversation(finalConversation);
      saveChatConversation(finalConversation, conversationKey);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(message);
  };

  const handleQuickReply = (reply: string) => {
    sendMessage(reply);
  };

  return (
    <>
      {/* Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={handleOpen}
              size="lg"
              className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow relative"
            >
              <MessageCircle className="h-6 w-6" />
              {/* Online indicator */}
              <span className={cn(
                "absolute top-0 right-0 h-3 w-3 rounded-full border-2 border-background",
                isAgentOnline ? "bg-success" : "bg-muted-foreground"
              )} />
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -left-1 min-w-[22px] h-[22px] px-1 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[11px] font-bold border-2 border-background"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.span>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              height: isMinimized ? 'auto' : '500px'
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] bg-card rounded-2xl shadow-2xl border border-border overflow-hidden"
          >
            {/* Header */}
            <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <span className={cn(
                    "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-primary",
                    isAgentOnline ? "bg-success" : "bg-muted-foreground"
                  )} />
                </div>
                <div>
                  <h3 className="font-semibold">Support Chat</h3>
                  <p className="text-xs opacity-80">
                    {conversationKey !== GENERAL_CHAT_KEY
                      ? `Conversation for ${conversationKey}`
                      : isAgentOnline
                        ? 'Online - Usually replies instantly'
                        : 'Offline - Leave a message'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                  onClick={() => setIsMinimized(!isMinimized)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Chat Body */}
            {!isMinimized && (
              <>
                <ScrollArea className="h-[340px] p-4" ref={scrollRef}>
                  <div className="space-y-4">
                    {conversation?.messages.map((msg) => (
                      <div key={msg.id}>
                        <div
                          className={cn(
                            "flex",
                            msg.isUser ? "justify-end" : "justify-start"
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                              msg.isUser
                                ? "bg-primary text-primary-foreground rounded-br-md"
                                : msg.isAgent
                                  ? "bg-accent text-accent-foreground border border-primary/30 rounded-bl-md"
                                  : "bg-muted rounded-bl-md"
                            )}
                          >
                            {msg.isAgent && (
                              <p className="text-[11px] font-semibold text-primary mb-0.5">
                                {msg.agentName || 'Support Agent'}
                              </p>
                            )}
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                            <div className={cn(
                              "mt-1 flex items-center gap-1 text-[10px]",
                              msg.isUser ? "justify-end text-primary-foreground/70" : "text-muted-foreground"
                            )}>
                              <span>{formatMessageTime(msg.timestamp)}</span>
                              {msg.isUser && (
                                msg.readAt ? (
                                  <CheckCheck className="h-3 w-3" aria-label="Read" />
                                ) : (
                                  <Check className="h-3 w-3 opacity-70" aria-label="Sent" />
                                )
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Quick Replies */}
                        {!msg.isUser && msg.quickReplies && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {msg.quickReplies.map((reply) => (
                              <button
                                key={reply}
                                onClick={() => handleQuickReply(reply)}
                                className="text-xs bg-secondary hover:bg-secondary/80 text-secondary-foreground px-3 py-1.5 rounded-full transition-colors"
                              >
                                {reply}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {/* Typing Indicator */}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-muted-foreground rounded-full typing-dot" />
                            <span className="w-2 h-2 bg-muted-foreground rounded-full typing-dot" />
                            <span className="w-2 h-2 bg-muted-foreground rounded-full typing-dot" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Input */}
                <form onSubmit={handleSubmit} className="p-4 border-t border-border">
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1"
                    />
                    <Button type="submit" size="icon" disabled={!message.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
