export interface Profile {
  id: string;
  auth_user_id: string;
  name: string;
  created_at: string;
  email: string;
  is_admin: boolean;
}

export interface Wallet {
  id: string;
  profile_id: string;
  wallet_address: string;
  circle_wallet_id: string;
  balance: string;
  blockchain: string;
  created_at: string;
  profile?: Profile;
}

export interface Transaction {
  id: string;
  wallet_id: string;
  profile_id: string;
  status: string;
  created_at: string;
  circle_transaction_id: string;
  transaction_type: string;
  amount: string;
  balance: string;
  currency: string;
  description: string;
  circle_contact_address: string;
}

export interface Chat {
  id: string;
  user_id: string;
  created_at: string;
  title: string;
}

export interface ChatGeneration {
  id: string;
  created_at: string;
  user_id: string;
  user_text: string;
  ai_text: string;
  chat_id: string;
  provider: string;
  prompt_tokens: number;
  completion_tokens: number;
}

export interface ImageGeneration {
  id: string;
  created_at: string;
  prompt: string;
  url: string;
  provider: string;
  user_id: string;
  circle_transaction_id: string;
  chat_id: string;
}

export interface Ai3dGeneration {
  id: string;
  created_at: string;
  prompt: string | null;
  url: string | null;
  provider: string;
  user_id: string;
  mode: string;
  circle_transaction_id: string | null;
  image_url: string;
  status: string;
  title: string;
  task_id: string;
}

export interface VideoGeneration {
  id: string;
  created_at: string;
  prompt: string;
  user_id: string;
  model_name: string;
  seed: number;
  prompt_image_path: string;
  video_url: string | null;
  task_id: string;
  processing_status: string;
  error_message: string | null;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at'>;
        Update: Partial<Omit<Profile, 'created_at'>>;
      };
      wallets: {
        Row: Wallet;
        Insert: Omit<Wallet, 'created_at'>;
        Update: Partial<Omit<Wallet, 'created_at'>>;
      };
      transactions: {
        Row: Transaction;
        Insert: Omit<Transaction, 'created_at'>;
        Update: Partial<Omit<Transaction, 'created_at'>>;
      };
    };
  };
};
