/**
 * Groq API Service
 * 
 * Provides integration with Groq API for AI chat completions
 * Supports organization-specific configuration
 */

import axios from 'axios';

class GroqService {
  constructor() {
    this.baseUrl = 'https://api.groq.com/openai/v1';
    this.defaultModel = process.env.DEFAULT_LLM_CHAT_MODEL || 'llama3-70b-8192';
    this.defaultEmbedModel = process.env.DEFAULT_LLM_EMBED_MODEL || 'nomic-embed-text-v1.5';
    this.defaultTemperature = parseFloat(process.env.DEFAULT_LLM_TEMPERATURE) || 0.7;
    this.defaultMaxTokens = parseInt(process.env.DEFAULT_LLM_MAX_TOKENS) || 1024;
  }

  /**
   * Get API key from organization config or environment
   * @param {Object} organization - Organization document
   * @returns {String} - API key
   */
  getApiKey(organization = null) {
    return organization?.ai_config?.api_keys?.groq_api_key || process.env.GROQ_API_KEY;
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
          error: 'Groq API key not configured'
        };
      }

      const {
        temperature = this.getTemperature(organization),
        max_tokens = this.getMaxTokens(organization),
        stream = false,
        system_prompt = organization?.ai_config?.system_prompt_override || null,
        model = this.getModel(organization)
      } = options;

      const payload = {
        model,
        messages,
        temperature,
        max_tokens,
        stream
      };

      // Add system prompt if provided
      if (system_prompt) {
        payload.messages.unshift({
          role: 'system',
          content: system_prompt
        });
      }

      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: response.data,
        usage: response.data.usage
      };
    } catch (error) {
      console.error('Groq API Error:', error.response?.data || error.message);
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
        throw new Error('Groq API key not configured');
      }

      const {
        temperature = this.getTemperature(organization),
        max_tokens = this.getMaxTokens(organization),
        system_prompt = organization?.ai_config?.system_prompt_override || null,
        model = this.getModel(organization)
      } = options;

      const payload = {
        model,
        messages,
        temperature,
        max_tokens,
        stream: true
      };

      if (system_prompt) {
        payload.messages.unshift({
          role: 'system',
          content: system_prompt
        });
      }

      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          responseType: 'stream'
        }
      );

      // Stream processing
      for await (const chunk of response.data) {
        const lines = chunk.toString().split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;
            
            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta;
              if (delta?.content) {
                yield delta.content;
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Groq Streaming Error:', error.response?.data || error.message);
      throw error;
    }
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
          error: 'Groq API key not configured'
        };
      }

      const model = organization?.ai_config?.embedding_model || this.defaultEmbedModel;

      const response = await axios.post(
        `${this.baseUrl}/embeddings`,
        {
          model,
          input: texts
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: response.data,
        embeddings: response.data.data.map(item => item.embedding)
      };
    } catch (error) {
      console.error('Groq Embeddings Error:', error.response?.data || error.message);
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

export default new GroqService();
