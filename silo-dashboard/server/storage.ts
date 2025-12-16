import { type User, type InsertUser, type Project, type InsertProject, type Message, type InsertMessage, users, projects, messages } from "../shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByWallet(walletAddress: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserRole(id: string, role: string): Promise<User | undefined>;
  
  // Projects
  getProject(id: string): Promise<Project | undefined>;
  getProjectsByConsumer(consumerId: string): Promise<Project[]>;
  getProjectsByProvider(providerId: string): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProjectStatus(id: string, status: string): Promise<Project | undefined>;
  
  // Messages
  getMessagesByProject(projectId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByWallet(walletAddress: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.walletAddress, walletAddress)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUserRole(id: string, role: string): Promise<User | undefined> {
    const result = await db.update(users).set({ role }).where(eq(users.id, id)).returning();
    return result[0];
  }

  // Projects
  async getProject(id: string): Promise<Project | undefined> {
    const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    return result[0];
  }

  async getProjectsByConsumer(consumerId: string): Promise<Project[]> {
    return await db.select().from(projects).where(eq(projects.consumerId, consumerId)).orderBy(desc(projects.createdAt));
  }

  async getProjectsByProvider(providerId: string): Promise<Project[]> {
    return await db.select().from(projects).where(eq(projects.providerId, providerId)).orderBy(desc(projects.createdAt));
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const result = await db.insert(projects).values(insertProject).returning();
    return result[0];
  }

  async updateProjectStatus(id: string, status: string): Promise<Project | undefined> {
    const result = await db.update(projects).set({ status }).where(eq(projects.id, id)).returning();
    return result[0];
  }

  // Messages
  async getMessagesByProject(projectId: string): Promise<Message[]> {
    return await db.select().from(messages).where(eq(messages.projectId, projectId)).orderBy(messages.createdAt);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const result = await db.insert(messages).values(insertMessage).returning();
    return result[0];
  }
}

export const storage = new DatabaseStorage();