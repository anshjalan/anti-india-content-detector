const { google } = require('googleapis');

const youtube = google.youtube('v3');

/**
 * Extracts the YouTube video ID from various URL formats.
 * @param {string} url The YouTube URL.
 * @returns {string|null} The video ID or null if not found.
 */
function extractVideoId(url) {
  const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

/**
 * Fetches comments for a given YouTube video ID.
 * @param {string} apiKey Your YouTube Data API v3 key.
 * @param {string} videoId The ID of the YouTube video.
 * @param {number} maxResults The maximum number of comments to fetch.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of comment objects.
 */
async function fetchYouTubeComments(apiKey, videoId, maxResults = 1000) {
  try {
    let allComments = [];
    let nextPageToken = null;

    do {
      const response = await youtube.commentThreads.list({
        key: apiKey,
        part: 'snippet',
        videoId: videoId,
        maxResults: 100, // API allows max 100 per call
        textFormat: 'plainText',
        pageToken: nextPageToken,
      });

      const comments = response.data.items.map(item => {
        const comment = item.snippet.topLevelComment.snippet;
        return {
          author: comment.authorDisplayName,
          text: comment.textDisplay,
          published_at: comment.publishedAt,
        };
      });

      allComments = allComments.concat(comments);
      nextPageToken = response.data.nextPageToken;

      // Stop if we've reached the required limit
      if (allComments.length >= maxResults) {
        break;
      }

    } while (nextPageToken);

    return allComments.slice(0, maxResults);

  } catch (err) {
    if (err.response && err.response.data && err.response.data.error) {
      const errorReason = err.response.data.error.errors[0].reason;
      if (errorReason === 'commentsDisabled') {
        throw new Error("Comments are disabled for this video.");
      }
    }
    throw new Error(`An API error occurred: ${err.message}`);
  }
}

module.exports = { extractVideoId, fetchYouTubeComments };