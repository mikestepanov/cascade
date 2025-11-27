import Anthropic from "@anthropic-ai/sdk";
import { retryApi } from "../utils/retry.js";

export interface ActionItem {
  description: string;
  assignee?: string;
  dueDate?: string;
  priority?: "low" | "medium" | "high";
}

export interface Topic {
  title: string;
  startTime?: number;
  endTime?: number;
  summary: string;
}

export interface MeetingSummary {
  executiveSummary: string;
  keyPoints: string[];
  actionItems: ActionItem[];
  decisions: string[];
  openQuestions: string[];
  topics: Topic[];
  overallSentiment?: "positive" | "neutral" | "negative" | "mixed";
  modelUsed: string;
  promptTokens?: number;
  completionTokens?: number;
  processingTime: number;
}

export class SummaryService {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async summarize(transcript: string): Promise<MeetingSummary> {
    const startTime = Date.now();

    const systemPrompt = `You are an expert meeting analyst. Your task is to analyze meeting transcripts and extract structured information. Be concise but thorough. Focus on actionable insights.`;

    const userPrompt = `Analyze this meeting transcript and provide a structured summary.

TRANSCRIPT:
${transcript}

Respond with a JSON object containing:
{
  "executiveSummary": "2-3 sentence overview of the meeting",
  "keyPoints": ["array of main discussion points"],
  "actionItems": [
    {
      "description": "what needs to be done",
      "assignee": "person's name if mentioned, or null",
      "dueDate": "date if mentioned, or null",
      "priority": "low/medium/high based on context"
    }
  ],
  "decisions": ["array of decisions made during the meeting"],
  "openQuestions": ["array of unresolved questions or items needing follow-up"],
  "topics": [
    {
      "title": "topic name",
      "summary": "brief summary of this discussion topic"
    }
  ],
  "overallSentiment": "positive/neutral/negative/mixed"
}

Important:
- Extract ALL action items mentioned, even implicit ones
- Identify the assignee by name when mentioned
- Capture decisions, even small ones
- Note any unresolved issues or questions
- Keep summaries concise but informative`;

    try {
      const response = await retryApi(() =>
        this.anthropic.messages.create({
          model: "claude-opus-4-5-20251101",
          max_tokens: 4096,
          messages: [
            {
              role: "user",
              content: userPrompt,
            },
          ],
          system: systemPrompt,
        })
      );

      const processingTime = Date.now() - startTime;

      // Extract the text content
      const textContent = response.content.find((c) => c.type === "text");
      if (!textContent || textContent.type !== "text") {
        throw new Error("No text response from Claude");
      }

      // Parse the JSON response
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Could not parse JSON from response");
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        executiveSummary: parsed.executiveSummary || "No summary available",
        keyPoints: parsed.keyPoints || [],
        actionItems: (parsed.actionItems || []).map((item: Partial<ActionItem>) => ({
          description: item.description || "",
          assignee: item.assignee || undefined,
          dueDate: item.dueDate || undefined,
          priority: item.priority || "medium",
        })),
        decisions: parsed.decisions || [],
        openQuestions: parsed.openQuestions || [],
        topics: (parsed.topics || []).map((topic: Partial<Topic>) => ({
          title: topic.title || "Untitled",
          summary: topic.summary || "",
          startTime: topic.startTime,
          endTime: topic.endTime,
        })),
        overallSentiment: parsed.overallSentiment || "neutral",
        modelUsed: "claude-opus-4-5-20251101",
        promptTokens: response.usage?.input_tokens,
        completionTokens: response.usage?.output_tokens,
        processingTime,
      };
    } catch (error) {
      console.error("Summary generation failed:", error);
      throw new Error(`Summary generation failed: ${(error as Error).message}`);
    }
  }

  // Quick summary for shorter content
  async quickSummary(transcript: string): Promise<string> {
    const response = await retryApi(() =>
      this.anthropic.messages.create({
        model: "claude-opus-4-5-20251101",
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: `Summarize this meeting in 2-3 sentences:\n\n${transcript.substring(0, 4000)}`,
          },
        ],
      })
    );

    const textContent = response.content.find((c) => c.type === "text");
    return textContent?.type === "text" ? textContent.text : "Unable to generate summary";
  }
}
