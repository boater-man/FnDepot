import axios from 'axios';
import type { User, Team, Task, Product, Transaction, Redemption } from '../types';

// Use relative path in production
const API_URL = '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// User APIs
export const createUser = async (username: string): Promise<User> => {
  const response = await api.post('/users', { username });
  return response.data;
};

export const getUser = async (userId: string): Promise<User> => {
  const response = await api.get(`/users/${userId}`);
  return response.data;
};

// Team APIs
export const generateTeamCode = async (userId: string): Promise<Team> => {
  const response = await api.post('/teams/generate', { userId });
  return response.data;
};

export const joinTeam = async (code: string, userId: string): Promise<Team> => {
  const response = await api.post('/teams/join', { code, userId });
  return response.data;
};

export const leaveTeam = async (userId: string): Promise<{ success: boolean }> => {
  const response = await api.post('/teams/leave', { userId });
  return response.data;
};

export const getTeam = async (teamId: string): Promise<{ team: Team; members: User[] }> => {
  const response = await api.get(`/teams/${teamId}`);
  return response.data;
};

// Task APIs
export const getTasks = async (teamId: string): Promise<Task[]> => {
  const response = await api.get(`/tasks/${teamId}`);
  return response.data;
};

export const createTask = async (data: {
  title: string;
  description: string;
  type: string;
  rewardPoints: number;
  creatorId: string;
  assigneeId?: string;
}): Promise<Task> => {
  const response = await api.post('/tasks', data);
  return response.data;
};

export const updateTask = async (taskId: string, data: {
  title?: string;
  description?: string;
  type?: string;
  rewardPoints?: number;
  status?: string;
}): Promise<Task> => {
  const response = await api.put(`/tasks/${taskId}`, data);
  return response.data;
};

export const acceptTask = async (taskId: string, userId: string): Promise<Task> => {
  const response = await api.post(`/tasks/${taskId}/accept`, { userId });
  return response.data;
};

export const completeTask = async (taskId: string, userId: string, file?: File): Promise<{ task: Task; user: User }> => {
  const formData = new FormData();
  formData.append('userId', userId);
  if (file) {
    formData.append('proof', file);
  }
  const response = await api.post(`/tasks/${taskId}/complete`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const deleteTask = async (taskId: string): Promise<{ success: boolean }> => {
  const response = await api.delete(`/tasks/${taskId}`);
  return response.data;
};

// Product APIs
export const getProducts = async (teamId: string): Promise<Product[]> => {
  const response = await api.get(`/products/${teamId}`);
  return response.data;
};

export const createProduct = async (data: {
  name: string;
  price: number;
  description: string;
  teamId: string;
  creatorId: string;
}): Promise<Product> => {
  const response = await api.post('/products', data);
  return response.data;
};

export const updateProduct = async (productId: string, data: {
  name?: string;
  price?: number;
  description?: string;
}): Promise<Product> => {
  const response = await api.put(`/products/${productId}`, data);
  return response.data;
};

export const buyProduct = async (productId: string, userId: string): Promise<{ success: boolean; user: User }> => {
  const response = await api.post(`/products/${productId}/buy`, { userId });
  return response.data;
};

export const deleteProduct = async (productId: string): Promise<{ success: boolean }> => {
  const response = await api.delete(`/products/${productId}`);
  return response.data;
};

// Transaction APIs
export const getTransactions = async (userId: string): Promise<Transaction[]> => {
  const response = await api.get(`/transactions/${userId}`);
  return response.data;
};

// Redemption APIs
export const getRedemptions = async (userId: string): Promise<Redemption[]> => {
  const response = await api.get(`/redemptions/${userId}`);
  return response.data;
};

export const shipProduct = async (redemptionId: string, userId: string): Promise<Redemption> => {
  const response = await api.post(`/redemptions/${redemptionId}/ship`, { userId });
  return response.data;
};

export const confirmReceipt = async (redemptionId: string, userId: string): Promise<Redemption> => {
  const response = await api.post(`/redemptions/${redemptionId}/confirm`, { userId });
  return response.data;
};

// Task approval APIs
export const approveTask = async (taskId: string, userId: string): Promise<{ task: Task; user: User }> => {
  const response = await api.post(`/tasks/${taskId}/approve`, { userId });
  return response.data;
};

export const rejectTask = async (taskId: string, userId: string, reason?: string): Promise<{ task: Task }> => {
  const response = await api.post(`/tasks/${taskId}/reject`, { userId, reason });
  return response.data;
};

export default api;
