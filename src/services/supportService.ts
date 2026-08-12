import { SupportTicket, ChatConversation, ChatMessage, FAQCategory, TicketStatus } from '@/types/support';

const STORAGE_KEYS = {
  TICKETS: 'movemate_tickets',
  CHAT: 'movemate_chat',
  CHATS: 'movemate_chats',
  LAST_CHAT_KEY: 'movemate_chat_last_key',
};

// Generate unique ticket ID
export function generateTicketId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'TKT-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Tickets
export function getTickets(): SupportTicket[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TICKETS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveTicket(ticket: SupportTicket): void {
  const tickets = getTickets();
  tickets.unshift(ticket);
  localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
}

export function updateTicket(ticketId: string, updates: Partial<SupportTicket>): SupportTicket | null {
  const tickets = getTickets();
  const index = tickets.findIndex(t => t.ticketId === ticketId);
  if (index === -1) return null;
  
  tickets[index] = { ...tickets[index], ...updates, updatedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
  return tickets[index];
}

export function getTicketById(ticketId: string): SupportTicket | null {
  const tickets = getTickets();
  return tickets.find(t => t.ticketId === ticketId) || null;
}

// Chat — conversations are persisted per tracking ID so users keep their
// history (including admin replies) across refreshes and return visits.
export const GENERAL_CHAT_KEY = 'general';

type ChatStore = Record<string, ChatConversation>;

function normalizeKey(key?: string): string {
  if (!key) return GENERAL_CHAT_KEY;
  const normalized = key.trim().toUpperCase();
  if (normalized === GENERAL_CHAT_KEY) return GENERAL_CHAT_KEY;
  if (normalized.startsWith('USER:')) return normalized;
  return normalized;
}

export function getVisitorChatKey(userName: string): string {
  const cleaned = userName.trim().replace(/\s+/g, ' ');
  return normalizeKey(`USER:${cleaned}`);
}

export function getLastChatKey(): string | null {
  return localStorage.getItem(STORAGE_KEYS.LAST_CHAT_KEY);
}

export function setLastChatKey(key: string): void {
  localStorage.setItem(STORAGE_KEYS.LAST_CHAT_KEY, normalizeKey(key));
}

export function clearLastChatKey(): void {
  localStorage.removeItem(STORAGE_KEYS.LAST_CHAT_KEY);
}

function readChatStore(): ChatStore {
  let store: ChatStore = {};
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CHATS);
    store = data ? JSON.parse(data) : {};
  } catch {
    store = {};
  }

  // Migrate the legacy single-conversation storage
  try {
    const legacy = localStorage.getItem(STORAGE_KEYS.CHAT);
    if (legacy) {
      const parsed = JSON.parse(legacy) as ChatConversation;
      const key = normalizeKey(parsed.trackingId);
      if (!store[key]) {
        store[key] = { ...parsed, trackingId: parsed.trackingId };
        localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(store));
      }
      localStorage.removeItem(STORAGE_KEYS.CHAT);
    }
  } catch {
    /* ignore malformed legacy data */
  }

  return store;
}

function writeChatStore(store: ChatStore): void {
  localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(store));
}

export function getChatConversation(key?: string): ChatConversation | null {
  const storeKey = normalizeKey(key);
  const conversation = readChatStore()[storeKey];
  return conversation ? { ...conversation, key: storeKey } : null;
}

export function getAllChatConversations(): ChatConversation[] {
  return Object.entries(readChatStore())
    .map(([key, conversation]) => ({ ...conversation, key }))
    .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
}

export function saveChatConversation(conversation: ChatConversation, key?: string): void {
  const store = readChatStore();
  const storeKey = normalizeKey(key ?? conversation.key ?? conversation.trackingId);
  store[storeKey] = { ...conversation, trackingId: conversation.trackingId, key: storeKey };
  writeChatStore(store);
}

export function clearChatConversation(key?: string): void {
  const store = readChatStore();
  delete store[normalizeKey(key)];
  writeChatStore(store);
}

// Bot responses
const botResponses: Record<string, { response: string; quickReplies?: string[] }> = {
  'track my shipment': {
    response: "I can help you track your shipment! Please provide your tracking ID (format: MM-LX-XXXXX), or you can go to our Track Shipment page for detailed tracking.",
    quickReplies: ['Go to tracking page', 'I lost my tracking ID', 'Speak to an agent'],
  },
  'delivery timeline': {
    response: "Delivery timelines depend on your shipment type:\n\n📦 **Domestic**: 2-5 business days\n🌍 **International**: 5-10 business days\n⚡ **Express**: 1-2 business days\n\nYou can track real-time updates using your tracking ID.",
    quickReplies: ['Track my shipment', 'Request faster delivery', 'Speak to an agent'],
  },
  'lost tracking id': {
    response: "No worries! To recover your tracking ID, you can:\n\n1. Check your email confirmation\n2. Provide the sender's phone number\n3. Contact our support team with shipment details\n\nWould you like me to help you submit a recovery request?",
    quickReplies: ['Submit recovery request', 'Contact support', 'Track my shipment'],
  },
  'speak to an agent': {
    response: "I'll connect you with a live agent. Our support team is available 24/7.\n\n⏳ **Estimated wait time**: 2-3 minutes\n\nIn the meantime, you can also submit a support ticket for faster resolution.",
    quickReplies: ['Submit a ticket', 'Wait for agent', 'View FAQ'],
  },
  'go to tracking page': {
    response: "Great! You can track your shipment at our dedicated tracking page. Just enter your tracking ID (MM-LX-XXXXX) to see real-time updates, delivery countdown, and shipment timeline.",
    quickReplies: ['I need a tracking ID', 'Delivery timeline', 'Speak to an agent'],
  },
  'submit a ticket': {
    response: "I'll help you submit a support ticket. You can access our ticket system from the Help Center. Your ticket will be assigned a unique ID for tracking.\n\n📋 **Ticket response time**: Within 24 hours",
    quickReplies: ['Track my shipment', 'View FAQ', 'Speak to an agent'],
  },
  'view faq': {
    response: "Our FAQ section covers common questions about:\n\n📦 Shipping & Delivery\n🔍 Tracking Issues\n💰 Pricing & Payments\n📋 Claims & Refunds\n\nYou can access the full Help Center for detailed answers.",
    quickReplies: ['Track my shipment', 'Delivery timeline', 'Speak to an agent'],
  },
  default: {
    response: "I'm here to help! How can I assist you today?",
    quickReplies: ['Track my shipment', 'Delivery timeline', 'Lost tracking ID', 'Speak to an agent'],
  },
};

export function getBotResponse(message: string): { response: string; quickReplies?: string[] } {
  const lowerMessage = message.toLowerCase().trim();
  
  for (const [key, value] of Object.entries(botResponses)) {
    if (lowerMessage.includes(key) || key.includes(lowerMessage)) {
      return value;
    }
  }
  
  // Check for greetings
  if (['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'].some(g => lowerMessage.includes(g))) {
    return {
      response: "Hello! 👋 Welcome to Movemate LogisticExpress support. How can I help you today?",
      quickReplies: ['Track my shipment', 'Delivery timeline', 'Lost tracking ID', 'Speak to an agent'],
    };
  }
  
  // Check for thanks
  if (['thank', 'thanks', 'appreciate'].some(t => lowerMessage.includes(t))) {
    return {
      response: "You're welcome! Is there anything else I can help you with?",
      quickReplies: ['Track my shipment', 'View FAQ', 'No, that is all'],
    };
  }
  
  return botResponses.default;
}

// FAQ Data
export const faqCategories: FAQCategory[] = [
  {
    id: '1',
    name: 'Shipping & Delivery',
    icon: 'Package',
    items: [
      {
        id: '1-1',
        question: 'How long does shipping take?',
        answer: 'Domestic shipments typically take 2-5 business days, while international shipments take 5-10 business days. Express delivery options are available for 1-2 business day delivery.',
        category: 'Shipping & Delivery',
      },
      {
        id: '1-2',
        question: 'Do you offer same-day delivery?',
        answer: 'Yes, we offer same-day delivery for select metropolitan areas. This service is available for orders placed before 10 AM local time.',
        category: 'Shipping & Delivery',
      },
      {
        id: '1-3',
        question: 'What countries do you ship to?',
        answer: 'We ship to over 150 countries worldwide. You can check delivery availability and estimated times during the shipment request process.',
        category: 'Shipping & Delivery',
      },
      {
        id: '1-4',
        question: 'Can I change my delivery address after shipping?',
        answer: 'Address changes may be possible before the package reaches the destination hub. Contact our support team immediately with your tracking ID for assistance.',
        category: 'Shipping & Delivery',
      },
    ],
  },
  {
    id: '2',
    name: 'Tracking',
    icon: 'MapPin',
    items: [
      {
        id: '2-1',
        question: 'How do I track my shipment?',
        answer: 'Enter your tracking ID (format: MM-LX-XXXXX) on our Track Shipment page. You\'ll see real-time updates, current location, and estimated delivery time.',
        category: 'Tracking',
      },
      {
        id: '2-2',
        question: 'I lost my tracking ID. What should I do?',
        answer: 'Check your email confirmation or SMS notification. You can also contact support with your shipment details (sender name, date, destination) to recover your tracking ID.',
        category: 'Tracking',
      },
      {
        id: '2-3',
        question: 'Why is my tracking not updating?',
        answer: 'Tracking updates may be delayed during transit between hubs. If there\'s no update for more than 48 hours, please contact our support team.',
        category: 'Tracking',
      },
      {
        id: '2-4',
        question: 'What do the status updates mean?',
        answer: 'Pending = Order received, Processing = Package prepared, In Transit = On the way, Out for Delivery = With courier, Delivered = Successfully delivered.',
        category: 'Tracking',
      },
    ],
  },
  {
    id: '3',
    name: 'Pricing & Payments',
    icon: 'CreditCard',
    items: [
      {
        id: '3-1',
        question: 'How is shipping cost calculated?',
        answer: 'Shipping costs are based on package weight, dimensions, origin, destination, and service type. Use our shipping calculator for accurate quotes.',
        category: 'Pricing & Payments',
      },
      {
        id: '3-2',
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit/debit cards, PayPal, bank transfers, and digital wallets. Business accounts can opt for monthly invoicing.',
        category: 'Pricing & Payments',
      },
      {
        id: '3-3',
        question: 'Are there any hidden fees?',
        answer: 'No hidden fees. The quoted price includes handling, tracking, and basic insurance. Additional services like express delivery or extra insurance are clearly listed.',
        category: 'Pricing & Payments',
      },
    ],
  },
  {
    id: '4',
    name: 'Claims & Refunds',
    icon: 'Shield',
    items: [
      {
        id: '4-1',
        question: 'What if my package is damaged?',
        answer: 'Report damage within 48 hours of delivery with photos. We\'ll investigate and process claims within 5-7 business days. All shipments include basic damage protection.',
        category: 'Claims & Refunds',
      },
      {
        id: '4-2',
        question: 'How do I file a claim for a lost package?',
        answer: 'If your package is not delivered within the estimated timeframe plus 5 days, contact support to file a lost package claim. We\'ll investigate and provide resolution.',
        category: 'Claims & Refunds',
      },
      {
        id: '4-3',
        question: 'How long does refund processing take?',
        answer: 'Approved refunds are processed within 5-7 business days. The amount will be credited to your original payment method.',
        category: 'Claims & Refunds',
      },
    ],
  },
];

// Initialize demo tickets
export function initializeDemoTickets(): void {
  const tickets = getTickets();
  if (tickets.length === 0) {
    const demoTickets: SupportTicket[] = [
      {
        id: '1',
        ticketId: 'TKT-A3F2B1',
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Package delayed',
        category: 'Delivery Issues',
        message: 'My package MM-LX-92F8A has been in transit for 5 days. Can you provide an update?',
        status: 'in_progress',
        priority: 'medium',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        responses: [
          {
            id: '1-1',
            message: 'Thank you for contacting us. We\'re looking into the delay and will update you shortly.',
            isAgent: true,
            agentName: 'Support Agent',
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ],
      },
      {
        id: '2',
        ticketId: 'TKT-X9K4M7',
        name: 'Jane Smith',
        email: 'jane@example.com',
        subject: 'Tracking not working',
        category: 'Tracking Issues',
        message: 'My tracking ID shows no results. The ID is MM-LX-7B3C2.',
        status: 'resolved',
        priority: 'low',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        responses: [
          {
            id: '2-1',
            message: 'We\'ve verified your tracking ID. The package was delivered on schedule. Please check with the recipient.',
            isAgent: true,
            agentName: 'Support Agent',
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ],
      },
    ];
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(demoTickets));
  }
}

// --- Live agent messaging (admin -> user) ---

export function addAgentMessage(
  content: string,
  agentName = 'Support Agent',
  key?: string
): ChatConversation | null {
  const conversation = getChatConversation(key);
  if (!conversation) return null;

  const message: ChatMessage = {
    id: `${Date.now()}-agent`,
    content,
    isUser: false,
    isAgent: true,
    agentName,
    timestamp: new Date().toISOString(),
  };

  const updated: ChatConversation = {
    ...conversation,
    isAgentOnline: true,
    agentHandled: true,
    messages: [...conversation.messages, message],
    lastMessageAt: message.timestamp,
  };
  saveChatConversation(updated, key);
  return updated;
}

export function setAgentHandled(handled: boolean, key?: string): ChatConversation | null {
  const conversation = getChatConversation(key);
  if (!conversation) return null;
  const updated: ChatConversation = {
    ...conversation,
    agentHandled: handled,
    isAgentOnline: handled || conversation.isAgentOnline,
  };
  saveChatConversation(updated, key);
  return updated;
}

// --- Read receipts & unread counts ---

/** Mark every bot/agent message as read by the user. */
export function markConversationReadByUser(key?: string): ChatConversation | null {
  const conversation = getChatConversation(key);
  if (!conversation) return null;
  const now = new Date().toISOString();
  const updated: ChatConversation = {
    ...conversation,
    userLastReadAt: now,
    messages: conversation.messages.map((m) =>
      m.isUser || m.readAt ? m : { ...m, readAt: now }
    ),
  };
  saveChatConversation(updated, key);
  return updated;
}

/** Mark every user message as read by the agent (admin side). */
export function markConversationReadByAgent(key?: string): ChatConversation | null {
  const conversation = getChatConversation(key);
  if (!conversation) return null;
  const now = new Date().toISOString();
  const updated: ChatConversation = {
    ...conversation,
    agentLastReadAt: now,
    messages: conversation.messages.map((m) =>
      m.isUser && !m.readAt ? { ...m, readAt: now } : m
    ),
  };
  saveChatConversation(updated, key);
  return updated;
}

/** Number of admin/bot replies the user has not read yet. */
export function getUnreadForUser(key?: string): number {
  const conversation = getChatConversation(key);
  if (!conversation) return 0;
  return conversation.messages.filter((m) => !m.isUser && !m.readAt).length;
}

/** Number of user messages the agent has not read yet. */
export function getUnreadForAgent(key?: string): number {
  const conversation = getChatConversation(key);
  if (!conversation) return 0;
  return conversation.messages.filter((m) => m.isUser && !m.readAt).length;
}
