import { GoogleGenAI, Type } from "@google/genai";
import { MenteeProfile, MentorProfile } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export const getMatchingAgent = async (mentee: MenteeProfile, mentors: MentorProfile[]) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are a mentor matching expert for an NGO called Agaram Foundation that supports rural students in Tamil Nadu. 
    Given this mentee's profile and a list of available mentors, return the best match with a clear reason. 
    Consider: skill alignment, language match, location proximity, career domain relevance, mentor availability.
    
    Mentee: ${JSON.stringify(mentee)}
    Available Mentors: ${JSON.stringify(mentors)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          mentor_id: { type: Type.STRING },
          match_score: { type: Type.NUMBER },
          match_reason: { type: Type.STRING }
        },
        required: ["mentor_id", "match_score", "match_reason"]
      }
    }
  });
  return JSON.parse(response.text);
};

export const getAIScoreAgent = async (reviewText: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are an expert mentorship quality evaluator for an NGO.
    A mentor wrote this review of their session with a student:
    '${reviewText}'
    Evaluate the quality of this mentoring session.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.INTEGER, description: "0-100 integer" },
          description: { type: Type.STRING, description: "2-3 sentence summary of what happened" },
          tips: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 actionable tips for the mentor to improve" },
          faults: { type: Type.ARRAY, items: { type: Type.STRING }, description: "specific issues identified in this session, empty array if none" }
        },
        required: ["score", "description", "tips", "faults"]
      }
    }
  });
  return JSON.parse(response.text);
};

export const getOnboardingAgentResponse = async (history: { role: string, parts: { text: string }[] }[]) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: history,
    config: {
      systemInstruction: "You are a warm, friendly onboarding assistant for Agaram Foundation's mentorship program. Collect mentor information conversationally, one question at a time. Ask about skills, languages, location, career domain, and max mentees. When you have all info, return a JSON object with the fields: skills (array), languages (array), location (string), career_domain (string), max_mentees (number).",
    }
  });
  return response.text;
};
