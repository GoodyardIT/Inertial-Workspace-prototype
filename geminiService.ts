
import { GoogleGenAI, Type } from "@google/genai";

export async function optimizeCaseDescription(
  title: string, 
  dimension: string, 
  description: string
): Promise<{ feedback_points: string; optimized_content: string }> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        你是一个专业的案例分析优化AI助手，专门帮助用户改进他们撰写的“案例详细描述”。你的目标是基于用户提供的案例内容，给出具体、可操作、建设性的优化建议，帮助用户让案例描述更清晰、专业、有说服力和逻辑性更强。

        核心任务：
        对用户提交的“案例详细描述”进行分析，从以下几个维度提供改进建议：
        1. 结构清晰度：是否具备清晰逻辑结构（如STAR法则）？
        2. 内容完整性：是否包含必要元素（背景、挑战、行动、量化结果、个人贡献）？
        3. 语言表达：是否专业、简洁、积极？
        4. 突出亮点：贡献、创新点、影响力是否充分突出？
        5. 针对性与说服力：是否能有效体现核心能力？

        输出格式要求：
        - 先用一句话积极肯定用户已写的内容，鼓励用户。
        - 然后用小标题分点列出具体建议（问题描述、改进建议、修改后示例）。
        - 最后提供一个【优化后的完整版本】，将所有建议应用后，重写整个案例详细描述（保持原意，不添加虚构内容）。

        语气全程专业、积极、鼓励。

        当前案例背景：
        案例标题: ${title}
        价值观维度: ${dimension}
        
        用户提交的描述内容：
        ${description}

        请基于以上要求提供优化建议。
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            feedback_points: { 
              type: Type.STRING, 
              description: "包含一句话肯定和分点改进建议的文本（支持换行符）" 
            },
            optimized_content: { 
              type: Type.STRING, 
              description: "最终优化后的完整案例描述内容" 
            },
          },
          required: ['feedback_points', 'optimized_content']
        },
      },
    });

    const text = response.text || '';
    return JSON.parse(text.trim());
  } catch (e) {
    console.error("Gemini API Error:", e);
    return {
      feedback_points: "由于系统繁忙，暂时无法提供详细建议。建议您检查是否包含了完整的背景、行动和结果（STAR法则）。",
      optimized_content: description
    };
  }
}
