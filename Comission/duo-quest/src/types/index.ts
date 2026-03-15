// User type
export interface User {
  id: string;
  username: string;
  points: number;
  team_id: string | null;
  created_at: string;
}

// Team type
export interface Team {
  id: string;
  pairing_code: string;
  code_expires_at: string;
  player1_id: string | null;
  player2_id: string | null;
  created_at: string;
}

// Task type
export type TaskType = 'study' | 'work' | 'life';
export type TaskStatus = 'open' | 'accepted' | 'pending_review' | 'completed' | 'rejected';

export interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  reward_points: number;
  creator_id: string;
  assignee_id: string | null;
  status: TaskStatus;
  proof_image: string | null;
  created_at: string;
  creator_name?: string;
  assignee_name?: string;
  reject_reason?: string;
}

// Redemption type (for product purchases)
export type RedemptionStatus = 'pending_shipment' | 'shipped' | 'received';

export interface Redemption {
  id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  buyer_id: string;
  buyer_name: string;
  seller_id: string;
  seller_name: string;
  status: RedemptionStatus;
  created_at: string;
}

// Product type
export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string | null;
  team_id: string;
  creator_id: string;
  created_at: string;
  creator_name?: string;
}

// Transaction type
export type TransactionType = 'earn' | 'spend';

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: TransactionType;
  related_id: string | null;
  created_at: string;
}

// Socket events
export interface TeamMembers {
  team: Team;
  members: User[];
}

export interface TaskUpdate {
  action: 'created' | 'updated' | 'accepted' | 'completed' | 'deleted';
  task: Task;
  taskId?: string;
}

export interface ProductUpdate {
  action: 'created' | 'updated' | 'purchased' | 'deleted';
  product: Product;
  productId?: string;
  buyer?: User;
}

export interface PointsChange {
  userId: string;
  points: number;
}
