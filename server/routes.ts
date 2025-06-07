import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertUserSchema, insertMessageSchema } from "@shared/schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { JWT_SECRET, JWT_EXPIRY } from './config';

interface AuthenticatedRequest extends Express.Request {
  userId?: number;
}

// Middleware to verify JWT token
const authenticateToken = async (req: AuthenticatedRequest, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    req.userId = decoded.userId;
    
    // Update user online status
    await storage.updateUserOnlineStatus(decoded.userId, true);
    
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, fullName } = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "This email is already registered." });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        fullName,
      });
      
      res.status(201).json({ 
        message: "Account created successfully. Please sign in to continue.",
        schatId: user.schatId 
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "No account found with this email. Please check and try again." });
      }
      
      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Incorrect password. Please try again." });
      }
      
      // Generate JWT token
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
      
      // Update online status
      await storage.updateUserOnlineStatus(user.id, true);
      
      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          schatId: user.schatId,
          profileImageUrl: user.profileImageUrl,
        }
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      if (req.userId) {
        await storage.updateUserOnlineStatus(req.userId, false);
      }
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Logout failed" });
    }
  });

  // User routes
  app.get("/api/user/me", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        schatId: user.schatId,
        profileImageUrl: user.profileImageUrl,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  app.get("/api/user/search/:schatId", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { schatId } = req.params;
      
      const user = await storage.getUserBySchatId(schatId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return self in search results
      if (user.id === req.userId) {
        return res.status(400).json({ message: "Cannot search for yourself" });
      }
      
      res.json({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        schatId: user.schatId,
        profileImageUrl: user.profileImageUrl,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
      });
    } catch (error) {
      console.error("Search user error:", error);
      res.status(500).json({ message: "Search failed" });
    }
  });

  // Chat routes
  app.get("/api/chats", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const chats = await storage.getUserChats(req.userId!);
      res.json(chats);
    } catch (error) {
      console.error("Get chats error:", error);
      res.status(500).json({ message: "Failed to get chats" });
    }
  });

  app.post("/api/chats", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const { otherUserId } = req.body;
      
      const chat = await storage.getOrCreateChat(req.userId!, otherUserId);
      const chatWithUsers = await storage.getChatById(chat.id);
      
      res.json(chatWithUsers);
    } catch (error) {
      console.error("Create chat error:", error);
      res.status(500).json({ message: "Failed to create chat" });
    }
  });

  app.get("/api/chats/:chatId/messages", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const chatId = parseInt(req.params.chatId);
      const messages = await storage.getChatMessages(chatId);
      res.json(messages);
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ message: "Failed to get messages" });
    }
  });

  app.post("/api/messages", authenticateToken, async (req: AuthenticatedRequest, res) => {
    try {
      const messageData = insertMessageSchema.parse({
        ...req.body,
        senderId: req.userId,
      });
      
      const message = await storage.createMessage(messageData);
      res.json(message);
    } catch (error) {
      console.error("Send message error:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket setup
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  interface ConnectedClient {
    ws: WebSocket;
    userId: number;
  }
  
  const connectedClients = new Map<number, ConnectedClient>();

  wss.on('connection', (ws, req) => {
    let userId: number | null = null;
    
    // Try to authenticate from URL token
    try {
      const url = new URL(req.url || '', 'http://localhost');
      const token = url.searchParams.get('token');
      
      if (token) {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
        userId = decoded.userId;
        connectedClients.set(userId, { ws, userId });
        
        // Update online status
        storage.updateUserOnlineStatus(userId, true).catch(err => {
          console.error("Error updating online status:", err);
        });
        
        ws.send(JSON.stringify({ type: 'auth_success' }));
      }
    } catch (error) {
      console.error("WebSocket auth error from URL:", error);
    }

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'auth' && !userId) {
          // Authenticate WebSocket connection if not already authenticated
          try {
            const decoded = jwt.verify(message.token, JWT_SECRET) as { userId: number };
            userId = decoded.userId;
            connectedClients.set(userId, { ws, userId });
            
            // Update online status
            await storage.updateUserOnlineStatus(userId, true);
            
            ws.send(JSON.stringify({ type: 'auth_success' }));
          } catch (error) {
            ws.send(JSON.stringify({ type: 'auth_error', message: 'Invalid token' }));
            ws.close();
          }
        } else if (message.type === 'send_message' && userId) {
          // Handle new message
          const { chatId, content } = message;
          
          const newMessage = await storage.createMessage({
            chatId,
            senderId: userId,
            content,
            status: 'sent',
          });
          
          // Get chat info to find recipient
          const chat = await storage.getChatById(chatId);
          if (chat) {
            const recipientId = chat.user1Id === userId ? chat.user2Id : chat.user1Id;
            const recipient = connectedClients.get(recipientId);
            
            const messageWithSender = {
              ...newMessage,
              sender: await storage.getUser(userId),
            };
            
            // Send to sender (confirmation)
            ws.send(JSON.stringify({
              type: 'message_sent',
              message: messageWithSender,
            }));
            
            // Send to recipient if online
            if (recipient && recipient.ws.readyState === WebSocket.OPEN) {
              recipient.ws.send(JSON.stringify({
                type: 'new_message',
                message: messageWithSender,
              }));
              
              // Update message status to delivered
              await storage.updateMessageStatus(newMessage.id, 'delivered');
            }
          }
        } else if (message.type === 'typing' && userId) {
          // Handle typing indicator
          const { chatId, isTyping } = message;
          
          const chat = await storage.getChatById(chatId);
          if (chat) {
            const recipientId = chat.user1Id === userId ? chat.user2Id : chat.user1Id;
            const recipient = connectedClients.get(recipientId);
            
            if (recipient && recipient.ws.readyState === WebSocket.OPEN) {
              recipient.ws.send(JSON.stringify({
                type: 'typing_status',
                chatId,
                userId,
                isTyping,
              }));
            }
          }
        } else if (message.type === 'mark_read' && userId) {
          // Handle read receipts
          const { messageId } = message;
          await storage.updateMessageStatus(messageId, 'read');
          
          // Notify sender that message was read
          // Implementation would require tracking which user sent which message
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', async () => {
      if (userId) {
        connectedClients.delete(userId);
        await storage.updateUserOnlineStatus(userId, false);
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  return httpServer;
}
