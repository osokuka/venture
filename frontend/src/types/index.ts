/**
 * TypeScript types matching backend API
 * These types are based on the actual Django REST Framework API responses
 */

// Base User type from backend
export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'VENTURE' | 'INVESTOR' | 'MENTOR' | 'ADMIN';
  is_email_verified: boolean;
  date_joined: string;
  last_login?: string;
}

// Frontend-friendly User type (for components)
export interface FrontendUser {
  id: string;
  email: string;
  role: 'venture' | 'investor' | 'mentor' | 'admin';
  full_name: string;
  profile?: {
    approvalStatus?: 'pending' | 'approved' | 'rejected';
    [key: string]: any;
  };
}

// Venture Product (from backend)
export interface VentureProduct {
  id: string;
  user: string;
  user_email: string;
  user_name: string;
  name: string;
  industry_sector: string;
  website: string;
  linkedin_url: string;
  address?: string;
  year_founded?: number;
  employees_count?: number;
  short_description: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  is_active: boolean;
  submitted_at?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
  founders: Founder[];
  team_members: TeamMember[];
  needs: VentureNeed[];
  documents: VentureDocument[];
}

export interface Founder {
  id: string;
  full_name: string;
  linkedin_url: string;
  email: string;
  phone?: string;
  role_title?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role_title: string;
  description?: string;
  linkedin_url?: string;
}

export interface VentureNeed {
  id: string;
  need_type: 'FINANCE' | 'MARKET_ACCESS' | 'EXPERT' | 'OTHER';
  finance_size_range?: string;
  finance_objectives?: string;
  target_markets?: string[];
  expertise_field?: string;
  duration?: string;
  other_notes?: string;
}

export interface VentureDocument {
  id: string;
  document_type: 'PITCH_DECK' | 'OTHER';
  file: string; // URL
  file_size: number;
  mime_type: string;
  uploaded_at: string;
  problem_statement?: string;
  solution_description?: string;
  target_market?: string;
  traction_metrics?: any;
  funding_amount?: string;
  funding_stage?: string;
  use_of_funds?: string;
  created_at: string;
  updated_at: string;
}

// Investor Profile (from backend)
export interface InvestorProfile {
  id: string;
  user: string;
  user_email: string;
  user_name: string;
  full_name: string;
  organization_name: string;
  linkedin_or_website: string;
  email: string;
  phone?: string;
  investment_experience_years: number;
  deals_count?: number;
  stage_preferences: string[];
  industry_preferences: string[];
  average_ticket_size: string;
  visible_to_ventures: boolean;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  submitted_at?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

// Mentor Profile (from backend)
export interface MentorProfile {
  id: string;
  user: string;
  user_email: string;
  user_name: string;
  full_name: string;
  job_title: string;
  company: string;
  linkedin_or_website: string;
  contact_email: string;
  phone?: string;
  expertise_fields: string[];
  experience_overview: string;
  industries_of_interest: string[];
  engagement_type: 'PAID' | 'PRO_BONO' | 'BOTH';
  paid_rate_type?: 'HOURLY' | 'DAILY' | 'MONTHLY';
  paid_rate_amount?: string;
  availability_types: string[];
  preferred_engagement: 'VIRTUAL' | 'IN_PERSON' | 'BOTH';
  visible_to_ventures: boolean;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  submitted_at?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

// Messaging types (from backend)
export interface Conversation {
  id: string;
  participants: User[];
  other_participant?: {
    id: string;
    email: string;
    full_name: string;
    role: string;
  };
  created_at: string;
  last_message_at?: string;
  last_message?: {
    id: string;
    body: string;
    sender_id: string;
    created_at: string;
  };
  unread_count: number;
}

export interface Message {
  id: string;
  sender: string;
  sender_email: string;
  sender_name: string;
  body: string;
  created_at: string;
  read_at?: string;
}

export interface ConversationDetail extends Conversation {
  messages: Message[];
}
