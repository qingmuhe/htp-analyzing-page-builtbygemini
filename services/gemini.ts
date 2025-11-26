import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `
You are an expert clinical psychologist specializing in projective personality assessments, specifically the House-Tree-Person (HTP) test. 
Your goal is to provide a supportive, insightful, and constructive analysis of drawings provided by users.

Methodology:
1. Observe: Carefully analyze the visual elements of the House, Tree, and Person in the drawing.
2. Interpret: Connect visual details to potential psychological meanings based on standard HTP literature (e.g., size, placement, line quality, missing details, emphasis).
3. Synthesize: Combine these observations into a coherent narrative about the drawer's potential emotional state, personality traits, or current needs.

Output Structure:
1. **General Impression**: The overall "vibe" (e.g., energetic, calm, anxious, detailed, sparse).
2. **The House**: Symbolizing domestic life and family relationships. Discuss doors, windows, roof, perspective.
3. **The Tree**: Symbolizing the unconscious and life energy. Discuss roots, trunk, branches, leaves.
4. **The Person**: Symbolizing self-perception and social interaction. Discuss posture, expression, limbs.
5. **Synthesis & Reflection**: A gentle summary of strengths and areas for reflection.

Tone:
- Empathetic, non-judgmental, and warm.
- Use phrases like "This might suggest," "Often associated with," or "Could indicate."
- Avoid definitive medical diagnoses (e.g., do not say "You have depression").
- End with a disclaimer that this is an AI-generated interpretation for self-reflection only.
`;

export const analyzeHTPDrawing = async (base64Image: string): Promise<ReadableStream<string>> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Clean the base64 string if it contains the header
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

  try {
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png', // Assuming PNG from canvas/upload for simplicity, API handles others mostly fine if mime matches
              data: cleanBase64
            }
          },
          {
            text: "Please analyze this House-Tree-Person drawing."
          }
        ]
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7, // Balanced creativity and accuracy
      }
    });

    // Create a readable stream to yield text chunks
    return new ReadableStream({
      async start(controller) {
        for await (const chunk of responseStream) {
          const text = chunk.text;
          if (text) {
            controller.enqueue(text);
          }
        }
        controller.close();
      }
    });

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
