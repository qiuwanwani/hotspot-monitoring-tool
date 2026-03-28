import axios from 'axios';

interface AIConfig {
  provider: 'openrouter' | 'openai' | 'anthropic' | 'custom';
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

interface AnalysisResult {
  isFake: boolean;
  confidence: number;
  reason: string;
  summary?: string;
}

const DEFAULT_MODELS: Record<string, string> = {
  openrouter: 'anthropic/claude-3.5-sonnet',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-sonnet-20241022',
};

export class AIService {
  private config: AIConfig;

  constructor(config?: Partial<AIConfig>) {
    this.config = {
      provider: (process.env.AI_PROVIDER as AIConfig['provider']) || 'openrouter',
      apiKey: process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY || '',
      baseUrl: process.env.AI_BASE_URL,
      model: process.env.AI_MODEL,
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
    const { provider, apiKey, baseUrl, model } = this.config;
    
    if (!apiKey) {
      throw new Error('AI API Key 未配置');
    }

    const modelToUse = model || DEFAULT_MODELS[provider];

    if (provider === 'openrouter') {
      return this.callOpenRouter(apiKey, modelToUse, prompt);
    } else if (provider === 'openai') {
      return this.callOpenAI(apiKey, modelToUse, prompt, baseUrl);
    } else if (provider === 'anthropic') {
      return this.callAnthropic(apiKey, modelToUse, prompt);
    }

    throw new Error(`不支持的 AI 提供商: ${provider}`);
  }

  private async callOpenRouter(apiKey: string, model: string, prompt: string): Promise<string> {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model,
        messages: [{ role: 'user', content: prompt }]
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        }
      }
    );

    return response.data.choices[0].message.content;
  }

  private async callOpenAI(apiKey: string, model: string, prompt: string, baseUrl?: string): Promise<string> {
    const url = baseUrl || 'https://api.openai.com/v1/chat/completions';
    
    const response = await axios.post(
      url,
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

  private async callAnthropic(apiKey: string, model: string, prompt: string): Promise<string> {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }]
      },
      {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.content[0].text;
  }
}

export const aiService = new AIService();
