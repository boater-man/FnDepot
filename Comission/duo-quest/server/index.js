import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import multer from 'multer';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine if we're in production
const isProduction = process.env.NODE_ENV === 'production';

// Paths
const dataDir = process.env.DATA_DIR || path.join(__dirname);
const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, 'uploads');

const app = express();
const httpServer = createServer(app, {
  maxHttpBufferSize: 1e8,
  pingTimeout: 60000,
  pingInterval: 25000,
});
const io = new Server(httpServer, {
  cors: {
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Ensure uploads directory exists
import fs from 'fs';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Database setup
const dbPath = process.env.DB_PATH || path.join(dataDir, 'data.db');
const db = new Database(dbPath);

// Initialize database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    points INTEGER DEFAULT 0,
    team_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY,
    pairing_code TEXT UNIQUE NOT NULL,
    code_expires_at DATETIME NOT NULL,
    player1_id TEXT,
    player2_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player1_id) REFERENCES users(id),
    FOREIGN KEY (player2_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL,
    reward_points INTEGER NOT NULL,
    creator_id TEXT NOT NULL,
    assignee_id TEXT,
    status TEXT DEFAULT 'open',
    proof_image TEXT,
    reject_reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id),
    FOREIGN KEY (assignee_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    description TEXT,
    image TEXT,
    team_id TEXT NOT NULL,
    creator_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id),
    FOREIGN KEY (creator_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL,
    related_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS redemptions (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    product_price INTEGER NOT NULL,
    buyer_id TEXT NOT NULL,
    buyer_name TEXT NOT NULL,
    seller_id TEXT NOT NULL,
    seller_name TEXT NOT NULL,
    status TEXT DEFAULT 'pending_shipment',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (buyer_id) REFERENCES users(id),
    FOREIGN KEY (seller_id) REFERENCES users(id)
  );
`);

// Insert test team code 346791
const testCode = '346791';
const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
const existingTeam = db.prepare('SELECT * FROM teams WHERE pairing_code = ?').get(testCode);

if (!existingTeam) {
  const teamId = uuidv4();
  db.prepare('INSERT INTO teams (id, pairing_code, code_expires_at) VALUES (?, ?, ?)').run(teamId, testCode, expiresAt);
  console.log('Test team code 346791 created');
}

// Helper functions
function generatePairingCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function getTeamMembers(teamId) {
  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(teamId);
  if (!team) return [];

  const members = [];
  if (team.player1_id) {
    const user1 = db.prepare('SELECT * FROM users WHERE id = ?').get(team.player1_id);
    if (user1) members.push(user1);
  }
  if (team.player2_id) {
    const user2 = db.prepare('SELECT * FROM users WHERE id = ?').get(team.player2_id);
    if (user2) members.push(user2);
  }
  return members;
}

// Socket.io handling
const userSockets = new Map(); // userId -> socket
const teamRooms = new Map(); // teamId -> Set of userIds

// Helper function to broadcast to all team members
function broadcastToTeam(teamId, event, data) {
  const members = getTeamMembers(teamId);
  members.forEach(member => {
    const memberSocket = userSockets.get(member.id);
    if (memberSocket && memberSocket.connected) {
      memberSocket.emit(event, data);
    }
  });
}

io.on('connection', (socket) => {
  console.log('✅ Socket.IO client connected:', socket.id, 'from:', socket.handshake.address);

  socket.on('register', (userId) => {
    console.log('👤 User registered:', userId, 'socket:', socket.id);
    userSockets.set(userId, socket);
    socket.userId = userId;

    // Join team room
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (user && user.team_id) {
      const teamId = user.team_id;
      console.log('🏠 User', userId, 'joining team room:', teamId);
      
      // Add to team room tracking
      if (!teamRooms.has(teamId)) {
        teamRooms.set(teamId, new Set());
      }
      teamRooms.get(teamId).add(userId);
      
      // Notify partner if exists
      const members = getTeamMembers(teamId);
      const partner = members.find(m => m.id !== userId);
      if (partner && userSockets.has(partner.id)) {
        console.log('🔔 Notifying partner:', partner.id);
        userSockets.get(partner.id).emit('partner_online', { userId });
      }
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Socket.IO client disconnected:', socket.id, 'reason:', reason);
    if (socket.userId) {
      const userId = socket.userId;
      userSockets.delete(userId);

      // Remove from team room
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
      if (user && user.team_id) {
        const teamId = user.team_id;
        const teamRoom = teamRooms.get(teamId);
        if (teamRoom) {
          teamRoom.delete(userId);
        }
        
        // Notify partner
        const members = getTeamMembers(teamId);
        const partner = members.find(m => m.id !== userId);
        if (partner && userSockets.has(partner.id)) {
          userSockets.get(partner.id).emit('partner_offline', { userId });
        }
      }
    }
  });
});

// API Routes

// User endpoints
app.post('/api/users', (req, res) => {
  const { username } = req.body;
  const id = uuidv4();

  db.prepare('INSERT INTO users (id, username) VALUES (?, ?)').run(id, username);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);

  res.json(user);
});

app.get('/api/users/:id', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// Team endpoints
app.post('/api/teams/generate', (req, res) => {
  const { userId } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (user.team_id) {
    return res.status(400).json({ error: 'User already in a team' });
  }

  const code = generatePairingCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const teamId = uuidv4();

  db.prepare('INSERT INTO teams (id, pairing_code, code_expires_at, player1_id) VALUES (?, ?, ?, ?)').run(teamId, code, expiresAt, userId);
  db.prepare('UPDATE users SET team_id = ? WHERE id = ?').run(teamId, userId);

  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(teamId);
  res.json(team);
});

app.post('/api/teams/join', (req, res) => {
  const { code, userId } = req.body;

  const team = db.prepare('SELECT * FROM teams WHERE pairing_code = ?').get(code);
  if (!team) return res.status(404).json({ error: 'Invalid code' });

  if (new Date(team.code_expires_at) < new Date()) {
    return res.status(400).json({ error: 'Code expired' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  if (user.team_id) {
    return res.status(400).json({ error: 'User already in a team' });
  }

  if (team.player1_id && team.player2_id) {
    return res.status(400).json({ error: 'Team is full' });
  }

  const teamId = team.id;

  if (team.player1_id) {
    db.prepare('UPDATE teams SET player2_id = ? WHERE id = ?').run(userId, teamId);
  } else {
    db.prepare('UPDATE teams SET player1_id = ? WHERE id = ?').run(userId, teamId);
  }

  db.prepare('UPDATE users SET team_id = ? WHERE id = ?').run(teamId, userId);

  const updatedTeam = db.prepare('SELECT * FROM teams WHERE id = ?').get(teamId);
  const members = getTeamMembers(teamId);

  // Notify both players
  members.forEach(member => {
    if (userSockets.has(member.id)) {
      userSockets.get(member.id).emit('team_updated', { team: updatedTeam, members });
    }
  });

  res.json(updatedTeam);
});

app.post('/api/teams/leave', (req, res) => {
  const { userId } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user || !user.team_id) return res.status(400).json({ error: 'User not in a team' });

  const teamId = user.team_id;
  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(teamId);

  // Get members BEFORE deleting team
  const members = getTeamMembers(teamId);
  const partner = members.find(m => m.id !== userId);

  // Reset points for both players
  if (team.player1_id) {
    db.prepare('UPDATE users SET points = 0, team_id = NULL WHERE id = ?').run(team.player1_id);
  }
  if (team.player2_id) {
    db.prepare('UPDATE users SET points = 0, team_id = NULL WHERE id = ?').run(team.player2_id);
  }

  // Delete team tasks and products
  db.prepare('DELETE FROM tasks WHERE creator_id IN (?, ?) OR assignee_id IN (?, ?)').run(team.player1_id, team.player2_id, team.player1_id, team.player2_id);
  db.prepare('DELETE FROM products WHERE team_id = ?').run(teamId);
  db.prepare('DELETE FROM teams WHERE id = ?').run(teamId);

  // Notify both players BEFORE clearing sockets
  members.forEach(member => {
    if (userSockets.has(member.id)) {
      userSockets.get(member.id).emit('team_disbanded', { message: 'Team disbanded' });
    }
  });

  // Also notify partner specifically to reload
  if (partner && userSockets.has(partner.id)) {
    userSockets.get(partner.id).emit('partner_left', { message: 'Partner left the team' });
  }

  res.json({ success: true });
});

app.get('/api/teams/:teamId', (req, res) => {
  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(req.params.teamId);
  if (!team) return res.status(404).json({ error: 'Team not found' });

  const members = getTeamMembers(team.id);
  res.json({ team, members });
});

// Task endpoints
app.get('/api/tasks/:teamId', (req, res) => {
  const tasks = db.prepare(`
    SELECT t.*, u.username as creator_name, au.username as assignee_name
    FROM tasks t
    LEFT JOIN users u ON t.creator_id = u.id
    LEFT JOIN users au ON t.assignee_id = au.id
    WHERE t.creator_id IN (SELECT id FROM users WHERE team_id = ?)
       OR t.assignee_id IN (SELECT id FROM users WHERE team_id = ?)
    ORDER BY t.created_at DESC
  `).all(req.params.teamId, req.params.teamId);

  res.json(tasks);
});

app.post('/api/tasks', (req, res) => {
  const { title, description, type, rewardPoints, creatorId, assigneeId } = req.body;
  const id = uuidv4();

  db.prepare(`
    INSERT INTO tasks (id, title, description, type, reward_points, creator_id, assignee_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, title, description || '', type, rewardPoints, creatorId, assigneeId || null, assigneeId ? 'accepted' : 'open');

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);

  // Notify team members
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(creatorId);
  if (user && user.team_id) {
    broadcastToTeam(user.team_id, 'task_updated', { action: 'created', task });
  }

  res.json(task);
});

app.put('/api/tasks/:id', (req, res) => {
  const { title, description, type, rewardPoints, status } = req.body;
  const taskId = req.params.id;

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  db.prepare(`
    UPDATE tasks SET title = ?, description = ?, type = ?, reward_points = ?, status = ?
    WHERE id = ?
  `).run(title, description, type, rewardPoints, status || task.status, taskId);

  const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);

  // Notify team members
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(task.creator_id);
  if (user && user.team_id) {
    broadcastToTeam(user.team_id, 'task_updated', { action: 'updated', task: updatedTask });
  }

  res.json(updatedTask);
});

app.post('/api/tasks/:id/accept', (req, res) => {
  const { userId } = req.body;
  const taskId = req.params.id;

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (task.status !== 'open') return res.status(400).json({ error: 'Task not available' });

  db.prepare('UPDATE tasks SET assignee_id = ?, status = ? WHERE id = ?').run(userId, 'accepted', taskId);

  const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);

  // Notify team members
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (user && user.team_id) {
    broadcastToTeam(user.team_id, 'task_updated', { action: 'accepted', task: updatedTask });
  }

  res.json(updatedTask);
});

app.post('/api/tasks/:id/complete', upload.single('proof'), (req, res) => {
  const taskId = req.params.id;
  const { userId } = req.body;

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (task.assignee_id !== userId) return res.status(400).json({ error: 'Not your task' });

  const proofImage = req.file ? `/uploads/${req.file.filename}` : null;

  // Set to pending_review status - need approval from task creator
  db.prepare('UPDATE tasks SET status = ?, proof_image = ? WHERE id = ?').run('pending_review', proofImage, taskId);

  const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);

  // Notify team members
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (user && user.team_id) {
    broadcastToTeam(user.team_id, 'task_updated', { action: 'pending_review', task: updatedTask });
  }

  res.json({ task: updatedTask, user: null });
});

app.post('/api/tasks/:id/approve', (req, res) => {
  const { userId } = req.body;
  const taskId = req.params.id;

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (task.creator_id !== userId) return res.status(400).json({ error: 'Only task creator can approve' });
  if (task.status !== 'pending_review') return res.status(400).json({ error: 'Task not pending review' });

  // Approve and award points ONLY to the assignee (the one who completed the task)
  db.prepare('UPDATE tasks SET status = ? WHERE id = ?').run('completed', taskId);

  const assignee = db.prepare('SELECT * FROM users WHERE id = ?').get(task.assignee_id);
  if (!assignee) {
    return res.status(404).json({ error: 'Assignee not found' });
  }
  
  const newPoints = assignee.points + task.reward_points;
  db.prepare('UPDATE users SET points = ? WHERE id = ?').run(newPoints, task.assignee_id);

  // Record transaction ONLY for the assignee
  db.prepare('INSERT INTO transactions (id, user_id, amount, type, related_id) VALUES (?, ?, ?, ?, ?)').run(uuidv4(), task.assignee_id, task.reward_points, 'earn', taskId);

  const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
  const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(task.assignee_id);

  console.log(`✅ Task approved: Task ${taskId}, Assignee ${task.assignee_id} earned ${task.reward_points} points (new total: ${updatedUser.points})`);

  // Notify team members
  if (assignee && assignee.team_id) {
    broadcastToTeam(assignee.team_id, 'task_updated', { action: 'approved', task: updatedTask });
    // Only send points_changed for the assignee
    broadcastToTeam(assignee.team_id, 'points_changed', { userId: task.assignee_id, points: updatedUser.points });
  }

  res.json({ task: updatedTask, user: updatedUser });
});

app.post('/api/tasks/:id/reject', (req, res) => {
  const { userId, reason } = req.body;
  const taskId = req.params.id;

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (task.creator_id !== userId) return res.status(400).json({ error: 'Only task creator can reject' });
  if (task.status !== 'pending_review') return res.status(400).json({ error: 'Task not pending review' });

  // Reject and set back to open status
  db.prepare('UPDATE tasks SET status = ?, proof_image = NULL, reject_reason = ? WHERE id = ?').run('rejected', reason || '', taskId);

  const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);

  // Notify team members
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (user && user.team_id) {
    broadcastToTeam(user.team_id, 'task_updated', { action: 'rejected', task: updatedTask });
  }

  res.json({ task: updatedTask });
});

app.delete('/api/tasks/:id', (req, res) => {
  const taskId = req.params.id;

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });

  db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId);

  // Notify team members
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(task.creator_id);
  if (user && user.team_id) {
    broadcastToTeam(user.team_id, 'task_updated', { action: 'deleted', taskId });
  }

  res.json({ success: true });
});

// Product endpoints
app.get('/api/products/:teamId', (req, res) => {
  const products = db.prepare(`
    SELECT p.*, u.username as creator_name
    FROM products p
    LEFT JOIN users u ON p.creator_id = u.id
    WHERE p.team_id = ?
    ORDER BY p.created_at DESC
  `).all(req.params.teamId);

  res.json(products);
});

app.post('/api/products', (req, res) => {
  const { name, price, description, teamId, creatorId } = req.body;
  const id = uuidv4();

  db.prepare(`
    INSERT INTO products (id, name, price, description, team_id, creator_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, name, price, description || '', teamId, creatorId);

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);

  // Notify team members
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(creatorId);
  if (user && user.team_id) {
    broadcastToTeam(user.team_id, 'product_updated', { action: 'created', product });
  }

  res.json(product);
});

app.put('/api/products/:id', (req, res) => {
  const { name, price, description } = req.body;
  const productId = req.params.id;

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  db.prepare('UPDATE products SET name = ?, price = ?, description = ? WHERE id = ?').run(name, price, description, productId);

  const updatedProduct = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);

  // Notify team members
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(product.creator_id);
  if (user && user.team_id) {
    broadcastToTeam(user.team_id, 'product_updated', { action: 'updated', product: updatedProduct });
  }

  res.json(updatedProduct);
});

app.post('/api/products/:id/buy', (req, res) => {
  const { userId } = req.body;
  const productId = req.params.id;

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (user.points < product.price) return res.status(400).json({ error: 'Insufficient points' });

  // Can't buy own product
  if (product.creator_id === userId) return res.status(400).json({ error: 'Cannot buy your own product' });

  // Deduct points
  const newPoints = user.points - product.price;
  db.prepare('UPDATE users SET points = ? WHERE id = ?').run(newPoints, userId);

  // Record transaction
  db.prepare('INSERT INTO transactions (id, user_id, amount, type, related_id) VALUES (?, ?, ?, ?, ?)').run(uuidv4(), userId, -product.price, 'spend', productId);

  // Create redemption record
  const seller = db.prepare('SELECT * FROM users WHERE id = ?').get(product.creator_id);
  const redemptionId = uuidv4();
  db.prepare(`
    INSERT INTO redemptions (id, product_id, product_name, product_price, buyer_id, buyer_name, seller_id, seller_name, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(redemptionId, productId, product.name, product.price, userId, user.username, product.creator_id, seller.username, 'pending_shipment');

  const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  const redemption = db.prepare('SELECT * FROM redemptions WHERE id = ?').get(redemptionId);

  console.log(`🎉 Product redeemed: ${product.name} by ${user.username} from ${seller.username}`);

  // Notify team members
  if (user && user.team_id) {
    broadcastToTeam(user.team_id, 'points_changed', { userId, points: updatedUser.points });
    broadcastToTeam(user.team_id, 'product_updated', { action: 'purchased', product, buyer: user });
    broadcastToTeam(user.team_id, 'redemption_created', { redemption });
    
    // Send special notification to seller
    if (seller && userSockets.has(seller.id)) {
      userSockets.get(seller.id).emit('new_redemption', { 
        redemption, 
        product,
        buyer: user,
        message: `${user.username} 兑换了你的商品 "${product.name}"` 
      });
    }
  }

  res.json({ success: true, user: updatedUser });
});

app.delete('/api/products/:id', (req, res) => {
  const productId = req.params.id;

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  db.prepare('DELETE FROM products WHERE id = ?').run(productId);

  // Notify team members
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(product.creator_id);
  if (user && user.team_id) {
    broadcastToTeam(user.team_id, 'product_updated', { action: 'deleted', productId });
  }

  res.json({ success: true });
});

// Redemptions endpoints
app.get('/api/redemptions/:userId', (req, res) => {
  const redemptions = db.prepare(`
    SELECT r.*, p.name as product_name, p.price as product_price
    FROM redemptions r
    LEFT JOIN products p ON r.product_id = p.id
    WHERE r.buyer_id = ? OR r.seller_id = ?
    ORDER BY r.created_at DESC
  `).all(req.params.userId, req.params.userId);

  res.json(redemptions);
});

app.post('/api/redemptions/:id/ship', (req, res) => {
  const { userId } = req.body;
  const redemptionId = req.params.id;

  const redemption = db.prepare('SELECT * FROM redemptions WHERE id = ?').get(redemptionId);
  if (!redemption) return res.status(404).json({ error: 'Redemption not found' });

  if (redemption.seller_id !== userId) return res.status(400).json({ error: 'Not your product' });

  db.prepare('UPDATE redemptions SET status = ? WHERE id = ?').run('shipped', redemptionId);

  const updatedRedemption = db.prepare('SELECT * FROM redemptions WHERE id = ?').get(redemptionId);

  // Notify buyer and team
  const buyer = db.prepare('SELECT * FROM users WHERE id = ?').get(redemption.buyer_id);
  if (buyer && buyer.team_id) {
    broadcastToTeam(buyer.team_id, 'redemption_updated', { action: 'shipped', redemption: updatedRedemption });
  }

  res.json(updatedRedemption);
});

app.post('/api/redemptions/:id/confirm', (req, res) => {
  const { userId } = req.body;
  const redemptionId = req.params.id;

  const redemption = db.prepare('SELECT * FROM redemptions WHERE id = ?').get(redemptionId);
  if (!redemption) return res.status(404).json({ error: 'Redemption not found' });

  if (redemption.buyer_id !== userId) return res.status(400).json({ error: 'Not your purchase' });

  db.prepare('UPDATE redemptions SET status = ? WHERE id = ?').run('received', redemptionId);

  const updatedRedemption = db.prepare('SELECT * FROM redemptions WHERE id = ?').get(redemptionId);

  // Notify seller and team
  const seller = db.prepare('SELECT * FROM users WHERE id = ?').get(redemption.seller_id);
  if (seller && seller.team_id) {
    broadcastToTeam(seller.team_id, 'redemption_updated', { action: 'received', redemption: updatedRedemption });
  }

  res.json(updatedRedemption);
});

// Transactions endpoint
app.get('/api/transactions/:userId', (req, res) => {
  const transactions = db.prepare(`
    SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 20
  `).all(req.params.userId);

  res.json(transactions);
});

// Serve static files in production
if (isProduction) {
  app.use(express.static(path.join(__dirname, 'public')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
}

// Start server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
