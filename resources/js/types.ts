export interface Location {
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

export type TabType = 'dashboard' | 'reviews' | 'reports' | 'autoreply' | 'posts' | 'services' | 'sheets' | 'growth' | 'whatsappReport' | 'widget' | 'team';

export interface PanelUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'member';
  status: 'active' | 'inactive';
  last_login_at?: string | null;
  created_at?: string | null;
}

export interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'member';
  status: 'active' | 'inactive';
  last_login_at?: string | null;
  created_at?: string | null;
}

export interface ProfileReportItem {
  id: string;
  name: string;
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
}

export interface MultiProfileReportData {
  success: boolean;
  hasReport?: boolean;
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
