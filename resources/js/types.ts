export interface Location {
  id?: string;
  name: string;
  v4Name?: string;
  title: string;
  storeCode?: string;
  address?: string;
  primaryCategory?: string;
  metadata?: any;
}

export interface ReviewReply {
  comment: string;
  updateTime: string;
}

export interface Review {
  reviewId: string;
  name?: string;
  reviewer: { displayName: string; profilePhotoUrl?: string };
  starRating: string;
  comment?: string;
  createTime: string;
  updateTime?: string;
  reviewReply?: ReviewReply;
}

export interface Post {
  id: string;
  locationName: string;
  topicType: 'STANDARD' | 'EVENT' | 'OFFER';
  summary: string;
  callToAction?: {
    actionType: 'BOOK' | 'ORDER' | 'SHOP' | 'LEARN_MORE' | 'CALL' | 'SIGN_UP' | 'NONE';
    url?: string;
  };
  mediaUrl?: string;
  sourceUrl?: string;
  googleUrl?: string;
  thumbnailUrl?: string;
  mediaFormat?: 'PHOTO' | 'VIDEO';
  createTime: string;
  offer?: {
    couponCode?: string;
    terms?: string;
  };
  event?: {
    title?: string;
    startDate?: string;
    endDate?: string;
  };
}

export interface BusinessService {
  id: string;
  locationName: string;
  category: string;
  name: string;
  price?: number;
  priceType: 'FIXED' | 'STARTING_AT' | 'FREE';
  currency: string;
  description: string;
  enabled: boolean;
}

export interface StoreHour {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

export interface SentimentAnalysis {
  overallSentiment: 'POSITIVE' | 'NEUTRAL' | 'ATTENTION_REQUIRED';
  positiveScore: number;
  neutralScore: number;
  negativeScore: number;
  topPraises: string[];
  topComplaints: string[];
  actionRecommendation: string;
}

export type TabType = 'dashboard' | 'reviews' | 'reports' | 'autoreply' | 'posts' | 'services' | 'sheets' | 'growth' | 'whatsappReport' | 'reviewTargets' | 'widget' | 'team' | 'facebook' | 'chat';

export type HubType = 'reputation' | 'inbox' | 'automation' | 'reports' | 'team';

export interface PanelUser {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  assigned_wing?: string | null;
  assigned_wings?: string[];
  role: 'admin' | 'member';
  status: 'active' | 'inactive';
  last_login_at?: string | null;
  created_at?: string | null;
}

export interface TeamMember {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  assigned_wing?: string | null;
  assigned_wings?: string[];
  role: 'admin' | 'member';
  status: 'active' | 'inactive';
  last_login_at?: string | null;
  created_at?: string | null;
}

export interface ProfileReportItem {
  id: string;
  name: string;
  v4Name?: string;
  title: string;
  address?: string;
  storeCode?: string;
  totalReviews: number;
  beforeTodayReviews: number;
  todayNewReviews: number;
  difference: number;
  averageRating: number;
  repliedCount: number;
  pendingCount: number;
  reviewLink?: string;
  selected?: boolean;
  assignedStaff?: string[];
  assignedStaffBracket?: string;
  assignedStaffPhone?: string;
}

export interface MultiProfileReportData {
  success: boolean;
  hasReport?: boolean;
  isToday?: boolean;
  isHistorical?: boolean;
  reportDate?: string;
  cached?: boolean;
  userEmail?: string;
  generatedAt: string;
  locations: ProfileReportItem[];
  overall: {
    totalProfiles: number;
    totalReviews: number;
    totalTodayNew: number;
    totalPending: number;
    averageRating: number;
  };
}

export interface AiAutomationRules {
  enabled: boolean;
  minStarRating: number;
  replyToEmptyReviews: boolean;
  maxRepliesPerMinute: number;
  delayBetweenRepliesSeconds: number;
  tone: string;
  antiToxicityGuard: boolean;
  languageMatching: boolean;
  includeReviewerName: boolean;
  referenceSpecificExperience: boolean;
  contactPhone: string;
  contactEmail: string;
  customInstructions: string;
  model: string;
  replyLength?: 'concise' | 'standard' | 'detailed';
  thinkingBudget?: number;
  temperature?: number;
}

export interface FacebookPageItem {
  id: number;
  user_id?: number | null;
  page_id: string;
  name: string;
  category?: string | null;
  avatar_url?: string | null;
  cover_url?: string | null;
  followers_count: number;
  likes_count: number;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  about?: string | null;
  hours_json?: Record<string, string> | null;
  auto_reply_enabled: boolean;
  auto_reply_rules?: Record<string, any> | null;
  is_active: boolean;
  created_at?: string;
}

export interface FacebookPostItem {
  id: string;
  message?: string;
  full_picture?: string;
  permalink_url?: string;
  created_time: string;
  status_type?: string;
  is_published?: boolean;
  scheduled_publish_time?: number;
  likes?: {
    summary?: {
      total_count: number;
    };
  };
  comments?: {
    summary?: {
      total_count: number;
    };
  };
  shares?: {
    count: number;
  };
}

export interface FacebookCommentItem {
  id: string;
  from?: {
    id: string;
    name: string;
    picture?: {
      data?: {
        url: string;
      };
    };
  };
  message: string;
  created_time: string;
  like_count?: number;
  comment_count?: number;
  is_hidden?: boolean;
  comments?: {
    data?: FacebookCommentItem[];
  };
}

export interface FacebookConversationItem {
  id: string;
  snippet?: string;
  updated_time: string;
  unread_count?: number;
  senders?: {
    data?: Array<{
      id: string;
      name: string;
      email?: string;
    }>;
  };
}

export interface FacebookMessageItem {
  id: string;
  message?: string;
  created_time: string;
  from?: {
    id: string;
    name: string;
    email?: string;
  };
  attachments?: {
    data?: Array<{
      mime_type: string;
      name?: string;
      image_data?: {
        url: string;
      };
    }>;
  };
}

// ==========================================
// Live Chat Support & Flow Builder Types
// ==========================================

export interface ChatWidgetConfig {
  id?: number;
  uuid: string;
  name: string;
  title: string;
  subtitle: string;
  brand_color: string;
  bot_name: string;
  avatar_url?: string | null;
  launcher_icon: string;
  position: 'bottom-right' | 'bottom-left';
  pre_chat_form_enabled: boolean;
  pre_chat_fields?: {
    name?: { enabled: boolean; required: boolean; label: string };
    email?: { enabled: boolean; required: boolean; label: string };
    phone?: { enabled: boolean; required: boolean; label: string };
  };
  sound_enabled: boolean;
  offline_mode_enabled: boolean;
  offline_message?: string;
  business_hours?: {
    enabled: boolean;
    start: string;
    end: string;
    timezone: string;
    days: string[];
  };
  is_active: boolean;
}

export interface ChatConversationItem {
  id: number;
  uuid: string;
  visitor_token?: string;
  visitor_name: string;
  visitor_email?: string;
  visitor_phone?: string;
  visitor_ip?: string;
  visitor_city?: string;
  visitor_page_url?: string;
  visitor_referrer?: string;
  visitor_user_agent?: string;
  status: 'bot' | 'waiting' | 'active' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  unread_count?: number;
  collected_data?: Record<string, any>;
  csat_rating?: number | null;
  csat_feedback?: string | null;
  assigned_user?: {
    id: number;
    name: string;
    email: string;
  } | null;
  last_message?: {
    content: string;
    sender_type: 'visitor' | 'bot' | 'agent' | 'system';
    sender_name: string;
    created_at: string;
  } | null;
  last_message_at?: string;
  resolved_at?: string | null;
  created_at: string;
}

export interface ChatMessageItem {
  id: number;
  uuid: string;
  sender_type: 'visitor' | 'bot' | 'agent' | 'system';
  sender_id?: number | null;
  sender_name: string;
  message_type: 'text' | 'buttons' | 'form' | 'file' | 'private_note';
  content: string;
  metadata?: {
    buttons?: Array<{ id: string; text: string; targetNodeId?: string }>;
    inputType?: string;
    variableName?: string;
    show_csat?: boolean;
    button_selected?: string;
    [key: string]: any;
  } | null;
  is_read: boolean;
  created_at: string;
}

export interface ChatCannedResponseItem {
  id: number;
  shortcut: string;
  title: string;
  content: string;
  category: string;
  created_by_user_id?: number | null;
  created_at?: string;
}

export interface FlowNodeItem {
  id: string;
  type: 'trigger' | 'message' | 'buttons' | 'input' | 'condition' | 'gemini_ai' | 'handoff' | 'end';
  position: { x: number; y: number };
  data: {
    label: string;
    message?: string;
    text?: string;
    prompt?: string;
    greeting?: string;
    systemInstructions?: string;
    triggerType?: string;
    triggerKeywords?: string;
    inputType?: 'text' | 'email' | 'phone' | 'number';
    variableName?: string;
    buttons?: Array<{ id: string; text: string; targetNodeId?: string }>;
    assignmentType?: 'round_robin' | 'specific_user';
    assignedUserId?: number;
    notificationMessage?: string;
    [key: string]: any;
  };
}

export interface FlowEdgeItem {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  label?: string;
}

export interface ChatbotFlowData {
  id?: number;
  name: string;
  description?: string;
  trigger_type: string;
  trigger_keywords?: string;
  canvas_data: {
    nodes: FlowNodeItem[];
    edges: FlowEdgeItem[];
    viewport?: { x: number; y: number; zoom: number };
  };
  is_active: boolean;
  version?: number;
}

export interface ChatAnalyticsData {
  total_conversations: number;
  active_conversations: number;
  resolved_conversations: number;
  resolution_rate: number;
  bot_containment_rate: number;
  average_csat: number;
  csat_distribution: Record<number, number>;
  agents: Array<{
    id: number;
    name: string;
    email: string;
    role: string;
    total_assigned: number;
    resolved_count: number;
  }>;
}


