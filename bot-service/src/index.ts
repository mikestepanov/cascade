import express from "express";
import { config } from "dotenv";
import { MeetingBotManager } from "./bot/manager.js";
import { authMiddleware } from "./middleware/auth.js";

config();

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Bot manager instance
const botManager = new MeetingBotManager();

// Create a new bot job
app.post("/api/jobs", authMiddleware, async (req, res) => {
  try {
    const { jobId, recordingId, meetingUrl, platform, botName, callbackUrl } = req.body;

    if (!meetingUrl || !recordingId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const job = await botManager.createJob({
      jobId,
      recordingId,
      meetingUrl,
      platform: platform || "google_meet",
      botName: botName || "Cascade Notetaker",
      callbackUrl,
    });

    res.json({ success: true, jobId: job.id });
  } catch (error) {
    console.error("Failed to create job:", error);
    res.status(500).json({ error: "Failed to create job" });
  }
});

// Get job status
app.get("/api/jobs/:jobId", authMiddleware, async (req, res) => {
  try {
    const job = botManager.getJob(req.params.jobId);
    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }
    res.json(job);
  } catch (error) {
    console.error("Failed to get job:", error);
    res.status(500).json({ error: "Failed to get job" });
  }
});

// Stop a job
app.post("/api/jobs/:jobId/stop", authMiddleware, async (req, res) => {
  try {
    await botManager.stopJob(req.params.jobId);
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to stop job:", error);
    res.status(500).json({ error: "Failed to stop job" });
  }
});

// List all active jobs
app.get("/api/jobs", authMiddleware, async (req, res) => {
  try {
    const jobs = botManager.listJobs();
    res.json({ jobs });
  } catch (error) {
    console.error("Failed to list jobs:", error);
    res.status(500).json({ error: "Failed to list jobs" });
  }
});

// Webhook for bot to report status updates (called internally)
// Defense in depth: validate internal key even though this runs on private network
app.post("/api/internal/status", async (req, res) => {
  const internalKey = req.headers["x-internal-key"];
  if (internalKey !== process.env.INTERNAL_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { jobId, status, data } = req.body;
    await botManager.handleStatusUpdate(jobId, status, data);
    res.json({ success: true });
  } catch (error) {
    console.error("Failed to handle status update:", error);
    res.status(500).json({ error: "Failed to handle status update" });
  }
});

app.listen(port, () => {
  console.log(`🤖 Meeting Bot Service running on port ${port}`);
});
