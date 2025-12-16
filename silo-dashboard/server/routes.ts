import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertProjectSchema, insertMessageSchema } from "../shared/schema";
import { isAuthorizedArchitect } from "./config";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // User routes
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existing = await storage.getUserByWallet(userData.walletAddress);
      if (existing) {
        return res.json(existing);
      }
      
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error) {
      res.status(400).json({ error: "Invalid request" });
    }
  });

  app.get("/api/users/wallet/:address", async (req, res) => {
    try {
      const user = await storage.getUserByWallet(req.params.address);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      // Add architect authorization flag
      const isArchitect = isAuthorizedArchitect(user.walletAddress);
      res.json({ ...user, isAuthorizedArchitect: isArchitect });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/api/auth/check-architect/:address", async (req, res) => {
    try {
      const isAuthorized = isAuthorizedArchitect(req.params.address);
      res.json({ isAuthorized });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.patch("/api/users/:id/role", async (req, res) => {
    try {
      const { role } = req.body;
      
      // Check authorization for architect role
      if (role === 'architect') {
        const user = await storage.getUser(req.params.id);
        if (!user || !isAuthorizedArchitect(user.walletAddress)) {
          return res.status(403).json({ error: "Unauthorized: Architect role requires authorization" });
        }
      }
      
      const updatedUser = await storage.updateUserRole(req.params.id, role);
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  // Project routes
  app.get("/api/projects/consumer/:consumerId", async (req, res) => {
    try {
      const projects = await storage.getProjectsByConsumer(req.params.consumerId);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.get("/api/projects/provider/:providerId", async (req, res) => {
    try {
      const projects = await storage.getProjectsByProvider(req.params.providerId);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const projectData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(projectData);
      res.json(project);
    } catch (error) {
      res.status(400).json({ error: "Invalid request" });
    }
  });

  app.patch("/api/projects/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      const project = await storage.updateProjectStatus(req.params.id, status);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  // Message routes
  app.get("/api/messages/project/:projectId", async (req, res) => {
    try {
      const messages = await storage.getMessagesByProject(req.params.projectId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      const messageData = insertMessageSchema.parse(req.body);
      const message = await storage.createMessage(messageData);
      res.json(message);
    } catch (error) {
      res.status(400).json({ error: "Invalid request" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}