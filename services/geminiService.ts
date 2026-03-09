import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable is not set.");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Generates an image based on a prompt (and optional reference image) using the Gemini 2.5 Flash Image model.
 */
export const generateBananaImage = async (
  prompt: string, 
  options: {
    referenceImage?: { data: string; mimeType: string };
    aspectRatio?: "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
  }
): Promise<string> => {
  const ai = getClient();
  
  // Using gemini-2.5-flash-image for free usage (no user API key required)
  const model = 'gemini-2.5-flash-image';

  try {
    const parts: any[] = [];
    
    // If a reference image is provided, add it to the parts
    if (options.referenceImage) {
      parts.push({
        inlineData: {
          data: options.referenceImage.data,
          mimeType: options.referenceImage.mimeType
        }
      });
    }

    // Add the text prompt
    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: parts
      },
      config: {
        imageConfig: {
          aspectRatio: options.aspectRatio || "1:1"
        }
      }
    });

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error("No candidates returned from Gemini.");
    }

    const content = response.candidates[0].content;
    if (!content || !content.parts) {
      throw new Error("No content parts returned.");
    }

    // Find the inlineData part which contains the image
    const imagePart = content.parts.find(part => part.inlineData);

    if (imagePart && imagePart.inlineData && imagePart.inlineData.data) {
       // Convert raw base64 to data URL if not already present
       const mimeType = imagePart.inlineData.mimeType || 'image/png';
       return `data:${mimeType};base64,${imagePart.inlineData.data}`;
    }

    throw new Error("No image data found in response.");

  } catch (error) {
    console.error("Error generating banana image:", error);
    throw error;
  }
};

/**
 * Generates a creative banana-themed prompt using Gemini 3 Flash Preview.
 */
export const generateCreativePrompt = async (): Promise<string> => {
  const ai = getClient();
  const model = 'gemini-3-flash-preview';

  try {
    const response = await ai.models.generateContent({
      model,
      contents: "Generate a short, creative, and visually interesting prompt for an AI image generator involving a banana. It could be surreal, funny, or artistic. Output ONLY the prompt text, nothing else. Keep it under 20 words.",
    });

    return response.text ? response.text.trim() : "A giant banana floating in space";
  } catch (error) {
    console.error("Error generating creative prompt:", error);
    return "A banana wearing sunglasses on a beach"; // Fallback
  }
};

/**
 * General chat function using Gemini 3.1 Pro Preview with search grounding.
 * Supports optional image input.
 */
export const chatWithGemini = async (message: string, history: any[] = [], image?: { data: string; mimeType: string }) => {
  const ai = getClient();
  const model = 'gemini-3-flash-preview';

  try {
    const chat = ai.chats.create({
      model,
      config: {
        systemInstruction: "You are a helpful and creative AI assistant. You can answer any questions. If the user asks about bananas, be extra enthusiastic, but you are not limited to bananas. Use search grounding for current events.",
        tools: [{ googleSearch: {} }],
      },
      history: history,
    });

    let result;
    if (image) {
      // If image is provided, we use sendMessage with parts
      // Note: sendMessage in @google/genai SDK for chat usually takes a message string.
      // For multimodal chat, we might need to use generateContent or handle parts.
      // However, the SDK documentation says sendMessage takes { message: string | Part | (string | Part)[] }
      const parts: any[] = [
        { text: message },
        {
          inlineData: {
            data: image.data,
            mimeType: image.mimeType
          }
        }
      ];
      result = await chat.sendMessage({ message: parts });
    } else {
      result = await chat.sendMessage({ message });
    }
    
    // Extract grounding sources if any
    const chunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources = chunks ? chunks.map((chunk: any) => chunk.web).filter(Boolean) : [];

    return {
      text: result.text || "I'm sorry, I couldn't generate a response.",
      sources: sources
    };
  } catch (error) {
    console.error("Error in chatWithGemini:", error);
    throw error;
  }
};
