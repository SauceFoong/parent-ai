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
   * @param {Object} params - Content parameters
   * @param {string} params.screenshot - Base64 screenshot
   * @param {string} params.contentTitle - Content title
   * @param {string} params.contentUrl - Content URL
   * @param {string} params.activityType - Type of activity
   * @returns {Object} Analysis results
   */
  async analyzeContent({ screenshot, contentTitle = '', contentUrl = '', activityType = '' }) {
    try {
      const prompt = `You are a parental control AI assistant. Analyze this screenshot from a child's device and determine if the content is appropriate for children.

Content Title: ${contentTitle}
Content URL: ${contentUrl}
Activity Type: ${activityType}

Rate the following categories from 0 to 1 (0 = safe, 1 = highly inappropriate):
1. Violence level (weapons, fighting, blood, gore, etc.)
2. Adult content (sexual content, nudity, suggestive content, etc.)
3. General inappropriateness (drugs, profanity, dangerous activities, gambling, etc.)

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "violenceScore": <number 0-1>,
  "adultContentScore": <number 0-1>,
  "inappropriateScore": <number 0-1>,
  "detectedCategories": [<array of concerning elements found>],
  "summary": "<brief 1-2 sentence explanation of what you see>",
  "confidence": <number 0-1>,
  "flagged": <boolean - true if any score > 0.5>,
  "reason": "<if flagged, explain why>"
}`;

      const messages = [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
          ],
        },
      ];

      // Add screenshot if provided
      if (screenshot) {
        // Handle base64 image
        const imageUrl = screenshot.startsWith('data:') 
          ? screenshot 
          : `data:image/jpeg;base64,${screenshot}`;
          
        messages[0].content.push({
          type: 'image_url',
          image_url: { 
            url: imageUrl,
            detail: 'low', // Use low detail to reduce tokens
          },
        });
      }

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o', // Updated model name
        messages,
        max_tokens: 500,
      });

      // Parse the response, handling potential markdown code blocks
      let content = response.choices[0].message.content;
      content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      const result = JSON.parse(content);
      
      // Ensure flagged is set correctly
      result.flagged = result.flagged || 
        result.violenceScore > 0.5 || 
        result.adultContentScore > 0.5 || 
        result.inappropriateScore > 0.5;
      
      logger.info(`AI Analysis completed: ${result.summary} (flagged: ${result.flagged})`);
      
      return result;
    } catch (error) {
      logger.error(`AI Analysis error: ${error.message}`);
      // Fallback to keyword-based analysis
      return this.fallbackAnalysis(contentTitle);
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

