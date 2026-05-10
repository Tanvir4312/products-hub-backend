import type { Request, Response } from 'express';
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, convertToModelMessages } from "ai";
import { prisma } from "../../lib/prisma";
import { envVars } from "../../config/env";
import { groq } from '@ai-sdk/groq';

// Google AI (fallback)
const google = createGoogleGenerativeAI({
  apiKey: envVars.GEMINI_API_KEY || "",
});

const SYSTEM_PROMPT = `
You are 'Product Hunter AI', the professional and friendly AI assistant for Products Hunt - a platform for discovering and launching new products.

Your goal is to provide clear, structured, and helpful answers to makers, hunters, and visitors.

RESPONSE STYLE:
- Keep answers short, clear, and well-organized
- Use bullet points or small paragraphs when helpful
- Highlight important information

SMART BEHAVIOR:
- If the answer is clearly in the context → answer directly
- If partially related → combine context + general helpful knowledge
- If not in context → give a helpful suggestion based on general knowledge

TONE:
- Friendly, helpful, and human-like
- Enthusiastic about products and innovation
- Not robotic or overly formal

AVOID:
- Saying "I don't know" without offering help
- Long robotic paragraphs
- Repeating the same lines
`;

// Groq মডেল (প্রাথমিক)
const groqModel = groq('llama-3.3-70b-versatile');

// Google মডেল (ব্যাকআপ) 
const googleModel = google('gemini-1.5-flash-8b');

export const ChatController = {
  handleChat: async (req: Request, res: Response) => {
    try {
      const { messages } = req.body;

      console.log("Received Messages:", JSON.stringify(messages, null, 2));

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "Messages array is required" });
      }

      const lastMessage = messages[messages.length - 1];

      const question =
        lastMessage.content ||
        (lastMessage.parts
          ? lastMessage.parts
              .filter((p: any) => p.type === "text")
              .map((p: any) => p.text)
              .join("")
          : "");

      if (!question || question.trim() === "") {
        console.error("Question is empty!");
        return res.status(400).json({ error: "Question cannot be empty" });
      }

      // ✅ শেষ ১০টা message নিন
      const recentMessages = messages.slice(-10);

      // 1. RAG Context (যদি ai_knowledge টেবিল থাকে)
      let context = "";
      try {
        if (question && question.trim()) {
          const keywords = question.toLowerCase().split(' ').slice(0, 5);
          const likePatterns = keywords.map((k: string) => `%${k}%`);
          
          const dbResult = await prisma.$queryRawUnsafe<any[]>(
            `SELECT content FROM ai_knowledge WHERE content ILIKE ANY($1::text[]) LIMIT 3`,
            [likePatterns]
          );
          
          if (dbResult && dbResult.length > 0) {
            context = dbResult.map((r) => r.content).join("\n\n");
            console.log(`Found ${dbResult.length} context items`);
          }
        }
      } catch (dbError: any) {
        if (dbError.message?.includes("does not exist")) {
          console.log("ai_knowledge table not found, skipping RAG");
        } else {
          console.error("Database error (non-fatal):", dbError.message);
        }
        context = "";
      }

      // ✅ Convert messages - এখানে await ব্যবহার করতে হবে
      const modelMessages = await convertToModelMessages(recentMessages);

      // 2. Stream response (Groq দিয়ে)
      const result = streamText({
        model: groqModel,
        system: `${SYSTEM_PROMPT}${context ? `\n\nRelevant Information:\n${context}\n` : ''}`,
        messages: modelMessages,  // এখন এটা Promise না, আসল array
        temperature: 0.7,
        maxOutputTokens : 500,
      });

      // 3. Stream response পাঠান
      result.pipeTextStreamToResponse(res);

    } catch (error: any) {
      console.error("Chat API Error:", error.message || error);
      
      // Fallback: Google দিয়ে চেষ্টা করুন
      try {
        console.log("Trying fallback model (Google)...");
        const recentMessages = req.body.messages?.slice(-10) || [];
        
        // ✅ এখানেও await যোগ করুন
        const modelMessages = await convertToModelMessages(recentMessages);
        
        const fallbackResult = streamText({
          model: googleModel,
          system: SYSTEM_PROMPT,
          messages: modelMessages,
          temperature: 0.7,
          maxOutputTokens : 500,
        });
        
        return fallbackResult.pipeTextStreamToResponse(res);
      } catch (fallbackError: any) {
        console.error("Fallback also failed:", fallbackError.message);
        
        // Rate limit handle
        if (error.status === 429 || error?.statusCode === 429) {
          if (!res.headersSent) {
            return res.status(429).json({
              error: "Rate limit exceeded. Please wait a moment and try again.",
            });
          }
          return res.end();
        }

        if (!res.headersSent) {
          res.status(500).json({ 
            error: "AI service temporarily unavailable. Please try again later.",
            ...(process.env.NODE_ENV === 'development' && { details: error.message })
          });
        }
        return res.end();
      }
    }
  },
};