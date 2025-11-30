import OpenAI from "openai";

// Reference: blueprint:javascript_openai_ai_integrations
// This is using Replit's AI Integrations service, which provides OpenAI-compatible API access without requiring your own OpenAI API key.
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

export interface VerificationResult {
  isValid: boolean;
  accuracyScore: number;
  analysis: string;
  confidence: number;
}

export class VerificationAI {
  async analyzeEvidence(evidence: string, jobWeight: number): Promise<VerificationResult> {
    try {
      const prompt = `You are an expert verification analyst for a decentralized autonomous organization. 
      
Analyze the following verification evidence and determine:
1. Whether the evidence is valid and complete
2. The accuracy/quality score (0.0 to 1.0)
3. Your confidence in the assessment (0.0 to 1.0)
4. A brief analysis summary

Evidence to analyze:
${evidence}

Job Weight (complexity): ${jobWeight}/5

Respond in JSON format with:
{
  "isValid": boolean,
  "accuracyScore": number (0.0-1.0),
  "confidence": number (0.0-1.0),
  "analysis": "brief summary"
}`;

      // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_completion_tokens: 500
      });

      const content = response.choices[0]?.message?.content || "{}";
      const result = JSON.parse(content);

      return {
        isValid: result.isValid || false,
        accuracyScore: Math.max(0, Math.min(1, result.accuracyScore || 0)),
        analysis: result.analysis || "Unable to analyze evidence",
        confidence: Math.max(0, Math.min(1, result.confidence || 0))
      };
    } catch (error) {
      console.error("AI verification error:", error);
      
      // Fallback to basic validation if AI fails
      const wordCount = evidence.split(/\s+/).length;
      const hasMinimumContent = wordCount >= 10;
      
      return {
        isValid: hasMinimumContent,
        accuracyScore: hasMinimumContent ? 0.7 : 0.3,
        analysis: "AI analysis unavailable, using basic validation",
        confidence: 0.5
      };
    }
  }

  calculateBounty(baseBountyRate: number, jobWeight: number, accuracyScore: number): number {
    return baseBountyRate * jobWeight * accuracyScore;
  }
}

export const verificationAI = new VerificationAI();
