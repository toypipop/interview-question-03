export interface Approval {
  id: number;
  title: string;
  status: 'pending' | 'approved' | 'rejected';
  memo: string;
  created_at: string;
  updated_at: string;
}
