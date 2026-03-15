import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { User, Team, Task, Product, Redemption } from '../types';
import * as api from '../services/api';
import { io, Socket } from 'socket.io-client';

interface AppContextType {
  // User state
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;

  // Team state
  team: Team | null;
  members: User[];
  isTeamLoading: boolean;

  // Tasks state
  tasks: Task[];
  refreshTasks: () => Promise<void>;

  // Products state
  products: Product[];
  refreshProducts: () => Promise<void>;

  // Redemptions state
  redemptions: Redemption[];
  refreshRedemptions: () => Promise<void>;

  // Socket connection
  socket: Socket | null;
  isConnected: boolean;

  // Actions
  login: (username: string) => Promise<void>;
  generateCode: () => Promise<void>;
  joinTeam: (code: string) => Promise<void>;
  leaveTeam: () => Promise<void>;
  createTask: (data: { title: string; description: string; type: string; rewardPoints: number }) => Promise<void>;
  updateTask: (taskId: string, data: { title?: string; description?: string; type?: string; rewardPoints?: number; status?: string }) => Promise<void>;
  acceptTask: (taskId: string) => Promise<void>;
  completeTask: (taskId: string, file?: File) => Promise<void>;
  approveTask: (taskId: string) => Promise<void>;
  rejectTask: (taskId: string, reason?: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  createProduct: (data: { name: string; price: number; description: string }) => Promise<void>;
  updateProduct: (productId: string, data: { name?: string; price?: number; description?: string }) => Promise<void>;
  buyProduct: (productId: string) => Promise<void>;
  shipProduct: (redemptionId: string) => Promise<void>;
  confirmReceipt: (redemptionId: string) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTeamLoading, setIsTeamLoading] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const userRef = useRef<User | null>(null);
  const teamIdRef = useRef<string | null>(null);
  userRef.current = user;
  teamIdRef.current = team?.id || null;

  // Refresh functions
  const refreshTasks = useCallback(async () => {
    if (!user?.team_id) return;
    try {
      const tasksData = await api.getTasks(user.team_id);
      setTasks(tasksData);
    } catch (error) {
      console.error('Failed to refresh tasks:', error);
    }
  }, [user?.team_id]);

  const refreshProducts = useCallback(async () => {
    if (!user?.team_id) return;
    try {
      const productsData = await api.getProducts(user.team_id);
      setProducts(productsData);
    } catch (error) {
      console.error('Failed to refresh products:', error);
    }
  }, [user?.team_id]);

  const refreshRedemptions = useCallback(async () => {
    if (!user) return;
    try {
      const redemptionsData = await api.getRedemptions(user.id);
      setRedemptions(redemptionsData);
    } catch (error) {
      console.error('Failed to refresh redemptions:', error);
    }
  }, [user]);

  // Initialize Socket.IO connection
  useEffect(() => {
    const socketInstance = io(window.location.origin, {
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      secure: window.location.protocol === 'https:',
    });

    socketInstance.on('connect', () => {
      console.log('✅ Socket connected:', socketInstance.id);
      console.log('📡 Socket transport:', socketInstance.io.engine.transport.name);
      setIsConnected(true);
      if (userRef.current?.id) {
        console.log('👤 Registering user:', userRef.current.id);
        socketInstance.emit('register', userRef.current.id);
      }
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('🔥 Socket connection error:', error.message);
      console.log('Will try polling fallback');
    });

    // Listen for real-time updates
    socketInstance.on('task_updated', async () => {
      console.log('Task updated event received');
      await refreshTasks();
    });

    socketInstance.on('product_updated', async () => {
      console.log('Product updated event received');
      await refreshProducts();
    });

    socketInstance.on('points_changed', async ({ userId, points }: { userId: string; points: number }) => {
      console.log('💰 Points changed event:', userId, points);
      // Only update points if this event is for the current user
      if (userRef.current && userId === userRef.current.id) {
        console.log('Updating local user points to:', points);
        setUser(prev => prev ? { ...prev, points } : null);
        localStorage.setItem('duoquest_user', JSON.stringify({ ...userRef.current, points }));
      } else {
        console.log('Points changed for different user, refreshing tasks');
      }
      await refreshTasks();
      await refreshProducts();
    });

    socketInstance.on('team_updated', async ({ team: updatedTeam, members: updatedMembers }: { team: Team; members: User[] }) => {
      console.log('Team updated');
      setTeam(updatedTeam);
      setMembers(updatedMembers);
      await refreshTasks();
      await refreshProducts();
    });

    socketInstance.on('team_disbanded', () => {
      console.log('🔔 Team disbanded event received');
      setTeam(null);
      setMembers([]);
      setTasks([]);
      setProducts([]);
      setRedemptions([]);
      // Update user points to 0 and clear team_id
      if (userRef.current) {
        const updatedUser = { ...userRef.current, points: 0, team_id: null };
        setUser(updatedUser);
        localStorage.setItem('duoquest_user', JSON.stringify(updatedUser));
      }
    });

    socketInstance.on('partner_left', async () => {
      console.log('🔔 Partner left event received');
      // Reload team data to get updated state
      await loadTeamData();
    });

    socketInstance.on('redemption_created', async () => {
      console.log('🔔 Redemption created event received');
      await refreshRedemptions();
    });

    socketInstance.on('redemption_updated', async () => {
      console.log('🔔 Redemption updated event received');
      await refreshRedemptions();
    });

    socketInstance.on('new_redemption', ({ message, product, buyer }) => {
      console.log('🎉 New redemption notification:', message);
      // Show browser notification if supported
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🎉 商品被兑换', {
          body: message,
          icon: '/favicon.ico'
        });
      }
      // Refresh redemptions
      refreshRedemptions();
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [refreshTasks, refreshProducts, refreshRedemptions]);

  // Register user with socket when user changes
  useEffect(() => {
    if (socket && user?.id && isConnected) {
      console.log('Registering user with socket:', user.id);
      socket.emit('register', user.id);
    }
  }, [socket, user?.id, isConnected]);

  // Polling for real-time updates (fallback for socket)
  useEffect(() => {
    if (!user?.team_id || !isConnected) return;

    const pollInterval = setInterval(() => {
      refreshTasks();
      refreshProducts();
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [user?.team_id, isConnected, refreshTasks, refreshProducts]);

  // Load team data when user has team_id
  useEffect(() => {
    if (user?.team_id) {
      loadTeamData();
    } else {
      setTeam(null);
      setMembers([]);
      setTasks([]);
      setProducts([]);
      setRedemptions([]);
    }
  }, [user?.team_id]);

  const loadTeamData = async () => {
    if (!user?.team_id) return;

    setIsTeamLoading(true);
    try {
      const [teamData, tasksData, productsData, redemptionsData] = await Promise.all([
        api.getTeam(user.team_id),
        api.getTasks(user.team_id),
        api.getProducts(user.team_id),
        user ? api.getRedemptions(user.id) : Promise.resolve([]),
      ]);

      setTeam(teamData.team);
      setMembers(teamData.members);
      setTasks(tasksData);
      setProducts(productsData);
      setRedemptions(redemptionsData);
    } catch (error) {
      console.error('Failed to load team data:', error);
    } finally {
      setIsTeamLoading(false);
    }
  };

  const login = async (username: string) => {
    setIsLoading(true);
    try {
      const newUser = await api.createUser(username);
      setUser(newUser);
      localStorage.setItem('duoquest_user', JSON.stringify(newUser));
    } finally {
      setIsLoading(false);
    }
  };

  const generateCode = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const newTeam = await api.generateTeamCode(user.id);
      setTeam(newTeam);
      setMembers([user]);
      const updatedUser = await api.getUser(user.id);
      if (updatedUser) {
        setUser(updatedUser);
        localStorage.setItem('duoquest_user', JSON.stringify(updatedUser));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const joinTeam = async (code: string) => {
    if (!user) return;
    setIsLoading(true);
    try {
      await api.joinTeam(code, user.id);
      await loadTeamData();
      const updatedUser = await api.getUser(user.id);
      if (updatedUser) {
        setUser(updatedUser);
        localStorage.setItem('duoquest_user', JSON.stringify(updatedUser));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const leaveTeam = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      await api.leaveTeam(user.id);
      setTeam(null);
      setMembers([]);
      setTasks([]);
      setProducts([]);
      setUser({ ...user, points: 0, team_id: null });
      localStorage.setItem('duoquest_user', JSON.stringify({ ...user, points: 0, team_id: null }));
    } finally {
      setIsLoading(false);
    }
  };

  const createTask = async (data: { title: string; description: string; type: string; rewardPoints: number }) => {
    if (!user) return;
    await api.createTask({ ...data, creatorId: user.id });
    await refreshTasks();
  };

  const updateTask = async (taskId: string, data: { title?: string; description?: string; type?: string; rewardPoints?: number; status?: string }) => {
    await api.updateTask(taskId, data);
    await refreshTasks();
  };

  const acceptTask = async (taskId: string) => {
    if (!user) return;
    await api.acceptTask(taskId, user.id);
    await refreshTasks();
  };

  const completeTask = async (taskId: string, file?: File) => {
    if (!user) return;
    const result = await api.completeTask(taskId, user.id, file);
    if (result.user) {
      setUser(result.user);
    }
    await refreshTasks();
  };

  const approveTask = async (taskId: string) => {
    if (!user) return;
    const result = await api.approveTask(taskId, user.id);
    // Don't update local user points from result.user - that's the assignee's data
    // The points_changed socket event will update the assignee's points
    // Just refresh tasks to update the task status
    await refreshTasks();
  };

  const rejectTask = async (taskId: string, reason?: string) => {
    if (!user) return;
    await api.rejectTask(taskId, user.id, reason);
    await refreshTasks();
  };

  const deleteTask = async (taskId: string) => {
    await api.deleteTask(taskId);
    await refreshTasks();
  };

  const createProduct = async (data: { name: string; price: number; description: string }) => {
    if (!user || !team) return;
    await api.createProduct({ ...data, teamId: team.id, creatorId: user.id });
    await refreshProducts();
  };

  const updateProduct = async (productId: string, data: { name?: string; price?: number; description?: string }) => {
    await api.updateProduct(productId, data);
    await refreshProducts();
  };

  const buyProduct = async (productId: string) => {
    if (!user) return;
    const result = await api.buyProduct(productId, user.id);
    setUser(result.user);
    localStorage.setItem('duoquest_user', JSON.stringify(result.user));
    await refreshProducts();
    await refreshRedemptions();
  };

  const shipProduct = async (redemptionId: string) => {
    if (!user) return;
    await api.shipProduct(redemptionId, user.id);
    await refreshRedemptions();
  };

  const confirmReceipt = async (redemptionId: string) => {
    if (!user) return;
    await api.confirmReceipt(redemptionId, user.id);
    await refreshRedemptions();
  };

  const deleteProduct = async (productId: string) => {
    await api.deleteProduct(productId);
    await refreshProducts();
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        isLoading,
        team,
        members,
        isTeamLoading,
        tasks,
        refreshTasks,
        products,
        refreshProducts,
        redemptions,
        refreshRedemptions,
        socket,
        isConnected,
        login,
        generateCode,
        joinTeam,
        leaveTeam,
        createTask,
        updateTask,
        acceptTask,
        completeTask,
        approveTask,
        rejectTask,
        deleteTask,
        createProduct,
        updateProduct,
        buyProduct,
        shipProduct,
        confirmReceipt,
        deleteProduct,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
