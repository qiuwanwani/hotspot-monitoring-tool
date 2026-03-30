import axios from 'axios';

interface AIConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

interface AnalysisResult {
  isFake: boolean;
  confidence: number;
  reason: string;
  summary?: string;
}

export class AIService {
  private config: AIConfig;

  constructor(config?: Partial<AIConfig>) {
    this.config = {
      apiKey: process.env.AI_API_KEY || process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || '',
      baseUrl: process.env.AI_BASE_URL || '',
      model: process.env.AI_MODEL || '',
      ...config
    };
  }

  async analyzeContent(title: string, content: string): Promise<AnalysisResult> {
    const prompt = `请分析以下热点信息的真实性和可信度。

标题: ${title}
内容: ${content}

请以 JSON 格式返回分析结果:
{
  "isFake": boolean,
  "confidence": number (0-100),
  "reason": "判断理由",
  "summary": "内容摘要"
}

只返回 JSON，不要其他文字。`;

    try {
      const response = await this.callAI(prompt);
      const result = JSON.parse(response);
      return result;
    } catch (error) {
      return {
        isFake: false,
        confidence: 50,
        reason: 'AI 分析失败，请稍后重试'
      };
    }
  }

  async generateSummary(title: string, content: string): Promise<string> {
    const prompt = `请用简洁的语言总结以下热点内容（不超过100字）:

标题: ${title}
内容: ${content}

只返回摘要内容，不要其他文字。`;

    try {
      return await this.callAI(prompt);
    } catch (error) {
      return title;
    }
  }

  private async callAI(prompt: string): Promise<string> {
    const { apiKey, baseUrl, model } = this.config;
    
    if (!apiKey) {
      throw new Error('AI API Key 未配置');
    }

    if (!baseUrl) {
      throw new Error('AI API Base URL 未配置');
    }

    if (!model) {
      throw new Error('AI Model 未配置');
    }

    return this.callCustom(apiKey, model, prompt, baseUrl);
  }

  private async callCustom(apiKey: string, model: string, prompt: string, baseUrl: string): Promise<string> {
    const response = await axios.post(
      baseUrl,
      {
        model,
        messages: [{ role: 'user', content: prompt }]
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content;
  }
}

export const aiService = new AIService();
