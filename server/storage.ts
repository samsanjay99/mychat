import { users, chats, messages, type User, type InsertUser, type Chat, type InsertChat, type Message, type InsertMessage, type ChatWithUsers, type MessageWithSender } from "@shared/schema";
import { db } from "./db";
import { eq, or, and, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserBySchatId(schatId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserOnlineStatus(userId: number, isOnline: boolean): Promise<void>;
  
  // Chat operations
  getOrCreateChat(user1Id: number, user2Id: number): Promise<Chat>;
  getUserChats(userId: number): Promise<ChatWithUsers[]>;
  getChatById(chatId: number): Promise<ChatWithUsers | undefined>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getChatMessages(chatId: number): Promise<MessageWithSender[]>;
  updateMessageStatus(messageId: number, status: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserBySchatId(schatId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.schatId, schatId));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Generate unique Schat ID
    const schatId = this.generateSchatId();
    
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, schatId })
      .returning();
    return user;
  }

  async updateUserOnlineStatus(userId: number, isOnline: boolean): Promise<void> {
    await db
      .update(users)
      .set({ 
        isOnline, 
        lastSeen: new Date() 
      })
      .where(eq(users.id, userId));
  }

  async getOrCreateChat(user1Id: number, user2Id: number): Promise<Chat> {
    // Check if chat already exists (either direction)
    const [existingChat] = await db
      .select()
      .from(chats)
      .where(
        or(
          and(eq(chats.user1Id, user1Id), eq(chats.user2Id, user2Id)),
          and(eq(chats.user1Id, user2Id), eq(chats.user2Id, user1Id))
        )
      );

    if (existingChat) {
      return existingChat;
    }

    // Create new chat
    const [newChat] = await db
      .insert(chats)
      .values({ user1Id, user2Id })
      .returning();
    
    return newChat;
  }

  async getUserChats(userId: number): Promise<ChatWithUsers[]> {
    const userChats = await db
      .select({
        id: chats.id,
        user1Id: chats.user1Id,
        user2Id: chats.user2Id,
        createdAt: chats.createdAt,
        updatedAt: chats.updatedAt,
        user1: users,
      })
      .from(chats)
      .innerJoin(users, eq(users.id, chats.user1Id))
      .where(or(eq(chats.user1Id, userId), eq(chats.user2Id, userId)));

    // Get the other user for each chat
    const chatsWithUsers: ChatWithUsers[] = [];
    for (const chat of userChats) {
      const otherUserId = chat.user1Id === userId ? chat.user2Id : chat.user1Id;
      const [otherUser] = await db.select().from(users).where(eq(users.id, otherUserId));
      
      // Get latest messages for this chat
      const latestMessages = await db
        .select()
        .from(messages)
        .where(eq(messages.chatId, chat.id))
        .orderBy(desc(messages.createdAt))
        .limit(1);

      chatsWithUsers.push({
        id: chat.id,
        user1Id: chat.user1Id,
        user2Id: chat.user2Id,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
        user1: chat.user1Id === userId ? chat.user1 : otherUser,
        user2: chat.user2Id === userId ? otherUser : chat.user1,
        messages: latestMessages,
      });
    }

    return chatsWithUsers;
  }

  async getChatById(chatId: number): Promise<ChatWithUsers | undefined> {
    const [chat] = await db.select().from(chats).where(eq(chats.id, chatId));
    if (!chat) return undefined;

    const [user1] = await db.select().from(users).where(eq(users.id, chat.user1Id));
    const [user2] = await db.select().from(users).where(eq(users.id, chat.user2Id));
    const chatMessages = await this.getChatMessages(chatId);

    return {
      ...chat,
      user1,
      user2,
      messages: chatMessages,
    };
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();
    
    // Update chat timestamp
    await db
      .update(chats)
      .set({ updatedAt: new Date() })
      .where(eq(chats.id, message.chatId));
    
    return newMessage;
  }

  async getChatMessages(chatId: number): Promise<MessageWithSender[]> {
    const chatMessages = await db
      .select({
        id: messages.id,
        chatId: messages.chatId,
        senderId: messages.senderId,
        content: messages.content,
        status: messages.status,
        createdAt: messages.createdAt,
        sender: users,
      })
      .from(messages)
      .innerJoin(users, eq(users.id, messages.senderId))
      .where(eq(messages.chatId, chatId))
      .orderBy(messages.createdAt);

    return chatMessages;
  }

  async updateMessageStatus(messageId: number, status: string): Promise<void> {
    await db
      .update(messages)
      .set({ status })
      .where(eq(messages.id, messageId));
  }

  private generateSchatId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = '';
    for (let i = 0; i < 6; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `SCHAT_${id}`;
  }
}

export const storage = new DatabaseStorage();
