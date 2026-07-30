export type TicketStatus = 'open' | 'in_progress' | 'resolved';
export type TicketPriority = 'low' | 'medium' | 'high';

export interface SupportTicket {
  id: string;
  ticketId: string;
  name: string;
  email: string;
  subject: string;
  category: string;
  message: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
  responses: TicketResponse[];
}

export interface TicketResponse {
  id: string;
  message: string;
  isAgent: boolean;
  agentName?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
  quickReplies?: string[];
  isAgent?: boolean;
  agentName?: string;
  /** ISO timestamp of when the recipient read this message */
  readAt?: string;
}

export interface ChatConversation {
  id: string;
  messages: ChatMessage[];
  isAgentOnline: boolean;
  startedAt: string;
  lastMessageAt: string;
  agentHandled?: boolean;
  trackingId?: string;
  userLastReadAt?: string;
  agentLastReadAt?: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface FAQCategory {
  id: string;
  name: string;
  icon: string;
  items: FAQItem[];
}
