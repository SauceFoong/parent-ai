const OpenAI = require('openai');
const logger = require('../utils/logger');

class AIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    this.violenceKeywords = [
      'fight', 'kill', 'death', 'blood', 'weapon', 'gun', 'violence',
      'attack', 'murder', 'war', 'combat', 'shoot', 'stab', 'gore'
    ];
    
    this.inappropriateKeywords = [
      'adult', 'explicit', 'mature', 'sex', 'nude', 'porn', 'drug',
      'alcohol', 'gambling', 'profanity', 'hate', 'discrimination'
    ];
  }

  /**
   * Analyze content using OpenAI Vision API
   * @param {string} imageUrl - URL or base64 of the screenshot
   * @param {string} contentText - Text content (title, description)
   * @returns {Object} Analysis results
   */
  async analyzeContent(imageUrl, contentText = '') {
    try {
      const prompt = `You are a parental control AI assistant. Analyze this content (image and/or text) and determine if it's appropriate for children.

Rate the following categories from 0 to 1 (0 = safe, 1 = highly inappropriate):
1. Violence level (weapons, fighting, blood, etc.)
2. Adult content (sexual content, nudity, etc.)
3. General inappropriateness (drugs, profanity, dangerous activities, etc.)

Content Text: ${contentText}

Provide your response in JSON format:
{
  "violenceScore": <number>,
  "adultContentScore": <number>,
  "inappropriateScore": <number>,
  "detectedCategories": [<array of concerning elements>],
  "summary": "<brief explanation>",
  "confidence": <number>,
  "isInappropriate": <boolean>
}`;

      const messages = [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
          ],
        },
      ];

      // Add image if provided
      if (imageUrl) {
        messages[0].content.push({
          type: 'image_url',
          image_url: { url: imageUrl },
        });
      }

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages,
        max_tokens: 500,
      });

      const result = JSON.parse(response.choices[0].message.content);
      logger.info(`AI Analysis completed: ${result.summary}`);
      
      return result;
    } catch (error) {
      logger.error(`AI Analysis error: ${error.message}`);
      // Fallback to keyword-based analysis
      return this.fallbackAnalysis(contentText);
    }
  }

  /**
   * Fallback analysis using keyword matching
   * @param {string} text - Content text to analyze
   * @returns {Object} Analysis results
   */
  fallbackAnalysis(text = '') {
    const lowerText = text.toLowerCase();
    
    const violenceCount = this.violenceKeywords.filter(keyword => 
      lowerText.includes(keyword)
    ).length;
    
    const inappropriateCount = this.inappropriateKeywords.filter(keyword => 
      lowerText.includes(keyword)
    ).length;
    
    const violenceScore = Math.min(violenceCount * 0.2, 1);
    const inappropriateScore = Math.min(inappropriateCount * 0.2, 1);
    
    const detectedCategories = [];
    if (violenceScore > 0) detectedCategories.push('Violence');
    if (inappropriateScore > 0) detectedCategories.push('Inappropriate Content');
    
    const isInappropriate = violenceScore > 0.5 || inappropriateScore > 0.5;
    
    return {
      violenceScore,
      adultContentScore: 0,
      inappropriateScore,
      detectedCategories,
      summary: isInappropriate 
        ? 'Content may contain inappropriate elements' 
        : 'Content appears safe',
      confidence: 0.6,
      isInappropriate,
    };
  }

  /**
   * Check if content should trigger a notification
   * @param {Object} analysis - AI analysis results
   * @param {Object} userSettings - User's threshold settings
   * @returns {Object} Notification decision
   */
  shouldNotify(analysis, userSettings) {
    const {
      violenceScore,
      adultContentScore,
      inappropriateScore,
    } = analysis;
    
    const {
      violenceThreshold = 0.6,
      adultContentThreshold = 0.8,
      inappropriateThreshold = 0.7,
      notificationsEnabled = true,
    } = userSettings;

    if (!notificationsEnabled) {
      return { shouldNotify: false, severity: 'low' };
    }

    const violations = [];
    let maxScore = 0;

    if (violenceScore >= violenceThreshold) {
      violations.push('violence');
      maxScore = Math.max(maxScore, violenceScore);
    }
    
    if (adultContentScore >= adultContentThreshold) {
      violations.push('adult content');
      maxScore = Math.max(maxScore, adultContentScore);
    }
    
    if (inappropriateScore >= inappropriateThreshold) {
      violations.push('inappropriate content');
      maxScore = Math.max(maxScore, inappropriateScore);
    }

    if (violations.length === 0) {
      return { shouldNotify: false, severity: 'low' };
    }

    // Determine severity based on max score
    let severity = 'low';
    if (maxScore >= 0.9) severity = 'critical';
    else if (maxScore >= 0.8) severity = 'high';
    else if (maxScore >= 0.7) severity = 'medium';

    return {
      shouldNotify: true,
      severity,
      violations,
      maxScore,
    };
  }
}

module.exports = new AIService();

