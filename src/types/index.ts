export type UserRole = 'mentee' | 'mentor' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface MentorProfile {
  id?: string;
  user_id: string;
  skills: string[];
  languages: string[];
  location: string;
  career_domain: string;
  availability_slots: string[];
  bio: string;
  onboarding_complete: boolean;
  max_mentees: number;
}

export interface MenteeProfile {
  id?: string;
  user_id: string;
  grade: string;
  interests: string[];
  language_preference: string;
  location: string;
  career_goal: string;
  assigned_mentor_id?: string;
}

export interface MentorRequest {
  id?: string;
  mentee_id: string;
  status: 'pending' | 'matched' | 'rejected';
  requested_at: string;
}

export interface Meeting {
  id?: string;
  mentor_id: string;
  mentee_id: string;
  scheduled_at: string;
  status: 'upcoming' | 'completed';
  mentor_review_text?: string;
  meeting_location_name?: string;
  meeting_lat?: number;
  meeting_lng?: number;
  ai_score?: number;
  ai_description?: string;
  ai_tips?: string[];
  ai_faults?: string[];
  created_at: string;
}

export interface MatchLog {
  id?: string;
  mentee_id: string;
  matched_mentor_id: string;
  match_reason: string;
  matched_at: string;
}
