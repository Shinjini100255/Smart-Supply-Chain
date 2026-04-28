import { GoogleGenAI, Type } from "@google/genai";
import { Shipment, AIAnalysis, RouteOptimization } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export async function analyzeShipmentRisk(shipment: Shipment): Promise<AIAnalysis> {
  const prompt = `
    Perform a DECISION INTELLIGENCE analysis for this shipment:
    ID: ${shipment.id}
    Location: ${shipment.lat}, ${shipment.lng}
    Current Risk: ${shipment.risk}
    Trend: ${shipment.trend || 'unknown'}
    Status: ${shipment.status}

    Provide:
    1. Risk Level (Low, Medium, High, Critical).
    2. Priority Score (0-100) based on risk and trend.
    3. Detailed explanation.
    4. Possible disruptions.
    5. Mitigation strategies.
    6. Impact analysis on the wider supply chain network.
    7. Confidence Score (0-1).
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskLevel: { type: Type.STRING, enum: ["Low", "Medium", "High", "Critical"] },
            priorityScore: { type: Type.NUMBER },
            riskExplanation: { type: Type.STRING },
            possibleDisruptions: { type: Type.ARRAY, items: { type: Type.STRING } },
            mitigationStrategies: { type: Type.ARRAY, items: { type: Type.STRING } },
            impactAnalysis: {
              type: Type.OBJECT,
              properties: {
                score: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
                description: { type: Type.STRING },
                affectedPaths: { type: Type.NUMBER }
              },
              required: ["score", "description", "affectedPaths"]
            },
            confidenceScore: { type: Type.NUMBER }
          },
          required: ["riskLevel", "priorityScore", "riskExplanation", "possibleDisruptions", "mitigationStrategies", "impactAnalysis", "confidenceScore"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
}

export async function optimizeRoute(shipment: Shipment): Promise<RouteOptimization> {
  const prompt = `
    Suggest DYNAMIC ROUTE OPTIMIZATION for the following shipment:
    ID: ${shipment.id}
    Location: ${shipment.lat}, ${shipment.lng}
    Risk: ${shipment.risk}
    Status: ${shipment.status}

    Provide:
    1. Suggested action (Reroute, Delay, Continue).
    2. Detailed reason.
    3. Alternative route description.
    4. Estimated delay time if continuing.
    5. Time saved if optimized.
    6. Risk reduction percentage.
    7. Optimized ETA projection.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedAction: { type: Type.STRING, enum: ["Reroute", "Delay", "Continue"] },
            reason: { type: Type.STRING },
            alternativeRoute: { type: Type.STRING },
            estimatedDelay: { type: Type.STRING },
            timeSaved: { type: Type.STRING },
            riskReduction: { type: Type.STRING },
            optimizedETA: { type: Type.STRING }
          },
          required: ["suggestedAction", "reason", "alternativeRoute", "estimatedDelay", "timeSaved", "riskReduction", "optimizedETA"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Gemini Optimization Error:", error);
    throw error;
  }
}
