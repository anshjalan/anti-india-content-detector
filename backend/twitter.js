const axios = require('axios');

class TwitterAPI {
  constructor(bearerToken) {
    this.bearerToken = bearerToken;
    this.baseURL = 'https://api.twitter.com/2';
  }

  /**
   * Searches for tweets by hashtag
   * @param {string} hashtag - The hashtag to search for (without #)
   * @param {number} maxResults - Maximum number of tweets to fetch (default: 10)
   * @returns {Promise<Array>} Array of tweet objects
   */
  async searchTweetsByHashtag(hashtag, maxResults = 10) {
    try {
      // Remove # if included in hashtag
      const cleanHashtag = hashtag.startsWith('#') ? hashtag.slice(1) : hashtag;
      
      const response = await axios.get(`${this.baseURL}/tweets/search/recent`, {
        headers: {
          'Authorization': `Bearer ${this.bearerToken}`,
        },
        params: {
          query: `#${cleanHashtag} -is:retweet lang:en`,
          max_results: Math.min(maxResults, 100), // Twitter API limit
          'tweet.fields': 'created_at,author_id,public_metrics',
          'user.fields': 'username,name',
          expansions: 'author_id',
        },
      });

      if (!response.data.data) {
        return [];
      }

      // Map users for easy lookup
      const users = {};
      if (response.data.includes?.users) {
        response.data.includes.users.forEach(user => {
          users[user.id] = user;
        });
      }

      // Format tweets to match comment structure
      const tweets = response.data.data.map(tweet => {
        const author = users[tweet.author_id];
        return {
          author: author ? author.username : 'Unknown',
          text: tweet.text,
          published_at: tweet.created_at,
          platform: 'twitter',
          tweet_id: tweet.id,
          metrics: tweet.public_metrics,
        };
      });

      return tweets;
    } catch (error) {
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      
      if (error.response?.status === 401) {
        throw new Error('Twitter API authentication failed. Check your bearer token.');
      }
      
      if (error.response?.data?.errors) {
        const errorMsg = error.response.data.errors[0].message;
        throw new Error(`Twitter API error: ${errorMsg}`);
      }
      
      throw new Error(`Failed to fetch tweets: ${error.message}`);
    }
  }

  /**
   * Validates if a hashtag is properly formatted
   * @param {string} hashtag - The hashtag to validate
   * @returns {boolean} True if valid
   */
  static validateHashtag(hashtag) {
    if (!hashtag || typeof hashtag !== 'string') return false;
    
    const cleanHashtag = hashtag.startsWith('#') ? hashtag.slice(1) : hashtag;
    
    // Basic validation: no spaces, special characters except underscore
    const hashtagRegex = /^[a-zA-Z0-9_]+$/;
    return hashtagRegex.test(cleanHashtag) && cleanHashtag.length > 0;
  }
}

module.exports = { TwitterAPI };
