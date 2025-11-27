import type { NextFunction, Request, Response } from "express";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid authorization header" });
  }

  const token = authHeader.substring(7);
  const expectedToken = process.env.BOT_SERVICE_API_KEY;

  if (!expectedToken) {
    return res.status(500).json({ error: "Server misconfigured" });
  }

  if (token !== expectedToken) {
    return res.status(403).json({ error: "Invalid API key" });
  }

  next();
}
