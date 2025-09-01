const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
require('dotenv').config();

const { extractVideoId, fetchYouTubeComments } = require('./youtube');
const { TwitterAPI } = require('./twitter');

// --- 1. Initialize App and Middleware ---
const app = express();
app.use(cors()); // Allow requests from our React frontend
app.use(express.json()); // To parse JSON request bodies

app.use(cors({
  origin: ["http://localhost:5173", "https://anti-india-content-detector.vercel.app/"], // for testing; later restrict to your frontend domain
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));

const PORT = process.env.PORT || 5000;
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;

// Initialize Twitter API
const twitterAPI = new TwitterAPI(TWITTER_BEARER_TOKEN);

// --- 2. Create the Analysis function ---
function runAnalysisScript(comments) {
  return new Promise((resolve, reject) => {
    // Determine the python command based on the OS
    const pythonCommand = process.platform === 'win32' ? 'python' : 'python3';
    
    // Spawn a new Python process
    const pythonProcess = spawn(pythonCommand, ['model_runner.py']);
    
    let resultData = '';
    let errorData = '';
    
    // Listen for data from the Python script's output
    pythonProcess.stdout.on('data', (data) => {
      resultData += data.toString();
    });
    
    // Listen for errors from the Python script
    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString();
    });
    
    // Handle process exit
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Python script exited with code ${code}: ${errorData}`));
      }
      
      try {
        resolve(JSON.parse(resultData));
      } catch (e) {
        reject(new Error('Failed to parse JSON from Python script.'));
      }
    });
    
    // Send the comments data to the Python script
    pythonProcess.stdin.write(JSON.stringify(comments));
    pythonProcess.stdin.end();
  });
}

// --- 3. YouTube Analysis Endpoint ---
app.post('/analyze', async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'YouTube URL is required.' });
  }
  
  if (!YOUTUBE_API_KEY) {
    return res.status(500).json({ error: 'YouTube API key is not configured on the server.' });
  }
  
  const videoId = extractVideoId(url);
  if (!videoId) {
    return res.status(400).json({ error: 'Invalid YouTube URL.' });
  }
  
  try {
    // Step 1: Fetch comments using YouTube API
    const comments = await fetchYouTubeComments(YOUTUBE_API_KEY, videoId);
    
    if (comments.length === 0) {
      return res.status(404).json({ error: 'No comments found or could not fetch comments.' });
    }
    
    // Step 2: Run the Python ML script with the fetched comments
    const analysisResult = await runAnalysisScript(comments);
    
    // Step 3: Send the result back to the client
    res.json({
      ...analysisResult,
      platform: 'youtube',
      source: url
    });
  } catch (error) {
    console.error('Analysis error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// --- 4. Twitter Analysis Endpoint ---
app.post('/analyze-twitter', async (req, res) => {
  const { hashtag } = req.body;
  
  if (!hashtag) {
    return res.status(400).json({ error: 'Hashtag is required.' });
  }
  
  if (!TWITTER_BEARER_TOKEN) {
    return res.status(500).json({ error: 'Twitter API bearer token is not configured on the server.' });
  }
  
  // Validate hashtag format
  if (!TwitterAPI.validateHashtag(hashtag)) {
    return res.status(400).json({ error: 'Invalid hashtag format. Use only letters, numbers, and underscores.' });
  }
  
  try {
    // Step 1: Fetch tweets using Twitter API
    const tweets = await twitterAPI.searchTweetsByHashtag(hashtag, 10);
    
    if (tweets.length === 0) {
      return res.status(404).json({ error: 'No tweets found for this hashtag.' });
    }
    
    // Step 2: Run the Python ML script with the fetched tweets
    const analysisResult = await runAnalysisScript(tweets);
    
    // Step 3: Send the result back to the client
    res.json({
      ...analysisResult,
      platform: 'twitter',
      source: hashtag
    });
  } catch (error) {
    console.error('Twitter analysis error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// --- 5. Start the Server ---
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
  console.log(`📺 YouTube API: ${YOUTUBE_API_KEY ? 'Configured' : 'Not configured'}`);
  console.log(`🐦 Twitter API: ${TWITTER_BEARER_TOKEN ? 'Configured' : 'Not configured'}`);
});
