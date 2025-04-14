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
