/**
 * Google Gemini API Service
 * 
 * Provides integration with Google's Gemini API for AI chat completions
 * Supports organization-specific configuration
 */

import axios from 'axios';

class GeminiService {
  constructor() {
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
    this.defaultModel = process.env.DEFAULT_LLM_CHAT_MODEL || 'gemini-1.5-pro';
    this.defaultTemperature = parseFloat(process.env.DEFAULT_LLM_TEMPERATURE) || 0.7;
    this.defaultMaxTokens = parseInt(process.env.DEFAULT_LLM_MAX_TOKENS) || 1024;
  }

  /**
   * Get API key from organization config or environment
   * @param {Object} organization - Organization document
   * @returns {String} - API key
   */
  getApiKey(organization = null) {
    return organization?.ai_config?.api_keys?.google_ai_api_key || process.env.GOOGLE_AI_API_KEY;
  }

  /**
   * Get model from organization config or default
   * @param {Object} organization - Organization document
   * @returns {String} - Model name
   */
  getModel(organization = null) {
    return organization?.ai_config?.model || this.defaultModel;
  }

  /**
   * Get temperature from organization config or default
   * @param {Object} organization - Organization document
   * @returns {Number} - Temperature
   */
  getTemperature(organization = null) {
    return organization?.ai_config?.temperature ?? this.defaultTemperature;
  }

  /**
   * Get max tokens from organization config or default
   * @param {Object} organization - Organization document
   * @returns {Number} - Max tokens
   */
  getMaxTokens(organization = null) {
    return organization?.ai_config?.max_tokens ?? this.defaultMaxTokens;
  }

  /**
   * Generate chat completion
   * @param {Array} messages - Array of message objects {role, content}
   * @param {Object} options - Additional options (temperature, max_tokens, etc.)
   * @param {Object} organization - Organization document for config
   * @returns {Promise<Object>} - API response
   */
  async chatCompletion(messages, options = {}, organization = null) {
    try {
      const apiKey = this.getApiKey(organization);
      if (!apiKey) {
        return {
          success: false,
          error: 'Google AI API key not configured'
        };
      }

      const {
        temperature = this.getTemperature(organization),
        max_tokens = this.getMaxTokens(organization),
        system_prompt = organization?.ai_config?.system_prompt_override || null,
        model = this.getModel(organization)
      } = options;

      // Convert OpenAI-style messages to Gemini format
      const geminiMessages = this.convertToGeminiFormat(messages, system_prompt);

      const response = await axios.post(
        `${this.baseUrl}/models/${model}:generateContent?key=${apiKey}`,
        {
          contents: geminiMessages,
          generationConfig: {
            temperature,
            maxOutputTokens: max_tokens
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const content = response.data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      return {
        success: true,
        data: {
          choices: [{
            message: {
              content: content,
              role: 'assistant'
            }
          }]
        },
        usage: {
          prompt_tokens: response.data.usageMetadata?.promptTokenCount || 0,
          completion_tokens: response.data.usageMetadata?.candidatesTokenCount || 0,
          total_tokens: response.data.usageMetadata?.totalTokenCount || 0
        }
      };
    } catch (error) {
      console.error('Gemini API Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  /**
   * Generate streaming chat completion
   * @param {Array} messages - Array of message objects
   * @param {Object} options - Additional options
   * @param {Object} organization - Organization document for config
   * @returns {AsyncGenerator} - Yields chunks as they arrive
   */
  async *streamChatCompletion(messages, options = {}, organization = null) {
    try {
      const apiKey = this.getApiKey(organization);
      if (!apiKey) {
        throw new Error('Google AI API key not configured');
      }

      const {
        temperature = this.getTemperature(organization),
        max_tokens = this.getMaxTokens(organization),
        system_prompt = organization?.ai_config?.system_prompt_override || null,
        model = this.getModel(organization)
      } = options;

      const geminiMessages = this.convertToGeminiFormat(messages, system_prompt);

      const response = await axios.post(
        `${this.baseUrl}/models/${model}:streamGenerateContent?key=${apiKey}`,
        {
          contents: geminiMessages,
          generationConfig: {
            temperature,
            maxOutputTokens: max_tokens
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          responseType: 'stream'
        }
      );

      // Stream processing
      let buffer = '';
      for await (const chunk of response.data) {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim()) {
            try {
              const parsed = JSON.parse(line);
              const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (content) {
                yield content;
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Gemini Streaming Error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Convert OpenAI-style messages to Gemini format
   * @param {Array} messages - OpenAI-style messages
   * @param {String} system_prompt - System prompt
   * @returns {Array} - Gemini-formatted messages
   */
  convertToGeminiFormat(messages, system_prompt = null) {
    const geminiMessages = [];

    // Add system prompt as first user message with instruction
    if (system_prompt) {
      geminiMessages.push({
        role: 'user',
        parts: [{ text: `[System Instruction]: ${system_prompt}` }]
      });
    }

    // Convert messages
    for (const msg of messages) {
      const role = msg.role === 'assistant' ? 'model' : 'user';
      geminiMessages.push({
        role,
        parts: [{ text: msg.content }]
      });
    }

    return geminiMessages;
  }

  /**
   * Generate embeddings
   * @param {Array<String>} texts - Array of texts to embed
   * @param {Object} organization - Organization document for config
   * @returns {Promise<Object>} - Embeddings response
   */
  async generateEmbeddings(texts, organization = null) {
    try {
      const apiKey = this.getApiKey(organization);
      if (!apiKey) {
        return {
          success: false,
          error: 'Google AI API key not configured'
        };
      }

      const model = organization?.ai_config?.embedding_model || 'text-embedding-004';

      const response = await axios.post(
        `${this.baseUrl}/models/${model}:batchEmbedContents?key=${apiKey}`,
        {
          requests: texts.map(text => ({ content: { parts: [{ text }] } }))
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: response.data,
        embeddings: response.data.embeddings?.map(item => item.values) || []
      };
    } catch (error) {
      console.error('Gemini Embeddings Error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error?.message || error.message
      };
    }
  }

  /**
   * Check if API is configured and accessible
   * @param {Object} organization - Organization document for config
   * @returns {Promise<boolean>}
   */
  async healthCheck(organization = null) {
    try {
      const response = await this.chatCompletion(
        [{ role: 'user', content: 'Hello' }],
        { max_tokens: 5 },
        organization
      );
      return response.success;
    } catch (error) {
      return false;
    }
  }
}

export default new GeminiService();
