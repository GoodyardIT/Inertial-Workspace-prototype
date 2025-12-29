
import { GoogleGenAI, Type } from "@google/genai";

export async function optimizeCaseDescription(
  title: string, 
  dimension: string, 
  description: string
): Promise<{ suggestion: string; score_assessment: string }> {
  // Use initialization directly within the service to ensure environment context is valid
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        作为企业文化专家，请针对以下案例进行 STAR 法则润色。
        
        案例标题: ${title}
        价值观维度: ${dimension}
        原始描述: ${description}
        
        要求：
        1. 使用 STAR (Situation, Task, Action, Result) 结构。
        2. 语气专业，结果导向。
        3. 语言：简体中文。
        4. 以 JSON 格式返回。
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestion: { type: Type.STRING },
            score_assessment: { type: Type.STRING },
          },
          required: ['suggestion', 'score_assessment']
        },
      },
    });

    const text = response.text || '';
    return JSON.parse(text.trim());
  } catch (e) {
    console.error("Gemini API Error:", e);
    return {
      suggestion: "AI 优化暂时不可用，请手动完善描述。",
      score_assessment: "系统繁忙，请稍后再试。"
    };
  }
}
