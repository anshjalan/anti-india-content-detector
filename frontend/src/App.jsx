import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { Search, AlertTriangle, CheckCircle, MessageSquare, TrendingUp, Flag, Copy, ExternalLink, Hash, Youtube, Moon, Sun } from 'lucide-react';

// Dark Mode Context
const DarkModeContext = React.createContext();

// Dark Mode Provider Component
const DarkModeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check localStorage for saved preference
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme !== null) {
      setIsDarkMode(JSON.parse(savedTheme));
    } else {
      // Check system preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(systemPrefersDark);
    }
  }, []);

  useEffect(() => {
    // Save to localStorage and update document class
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
};

// Dark Mode Toggle Button Component
const DarkModeToggle = () => {
  const { isDarkMode, toggleDarkMode } = React.useContext(DarkModeContext);

  return (
    <button
      onClick={toggleDarkMode}
      className={`
        fixed top-4 right-4 z-50 p-3 rounded-full transition-all duration-500 backdrop-blur-sm
        ${isDarkMode 
          ? 'bg-gray-800/90 text-yellow-400 hover:bg-gray-700/90 shadow-xl shadow-gray-900/50 border border-gray-700' 
          : 'bg-white/90 text-gray-800 hover:bg-gray-100/90 shadow-xl shadow-gray-300/50 border border-gray-200'
        }
      `}
      title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {isDarkMode ? (
        <Sun className="w-5 h-5 transition-all duration-500 hover:rotate-12 hover:scale-110" />
      ) : (
        <Moon className="w-5 h-5 transition-all duration-500 hover:-rotate-12 hover:scale-110" />
      )}
    </button>
  );
};


const CommentList = ({ comments, source, platform }) => {
  const { isDarkMode } = React.useContext(DarkModeContext);
  const [copiedIndex, setCopiedIndex] = useState(null);
  
  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  const handleCopyComment = async (comment, index) => {
    const platformPrefix = platform === 'twitter' ? 'Tweet' : 'Comment';
    const sourceText = platform === 'twitter' ? `#${source}` : source;
    const commentText = `${platformPrefix} by @${comment.author} on ${formatDate(comment.published_at)} (${sourceText}):\n\n"${comment.text}"`;
    
    try {
      await navigator.clipboard.writeText(commentText);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };
  
  const handleReportToYouTube = (videoUrl) => {
    const videoIdMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;
    
    if (videoId) {
      const reportUrl = `https://www.youtube.com/watch?v=${videoId}`;
      window.open(reportUrl, '_blank');
    }
  };
  
  const handleOpenTwitter = (hashtag) => {
    const twitterUrl = `https://twitter.com/hashtag/${hashtag.replace('#', '')}`;
    window.open(twitterUrl, '_blank');
  };
  
  const handleReportComment = (comment, source, platform) => {
    if (platform === 'twitter') {
      const alertMessage = `To report this tweet to Twitter:
1. Click "Go to Twitter" to open the hashtag
2. Find the tweet by @${comment.author}
3. Click the three dots (⋯) next to the tweet
4. Select "Report Tweet"
5. Choose the appropriate reason
Tweet text: "${comment.text.substring(0, 100)}${comment.text.length > 100 ? '...' : ''}"`;
      
      if (window.confirm(alertMessage)) {
        handleOpenTwitter(source);
      }
    } else {
      const alertMessage = `To report this comment to YouTube:
1. Click "Go to YouTube" to open the video
2. Find the comment by @${comment.author}
3. Click the three dots (⋯) next to the comment
4. Select "Report"
5. Choose the appropriate reason
Comment text: "${comment.text.substring(0, 100)}${comment.text.length > 100 ? '...' : ''}"`;
      
      if (window.confirm(alertMessage)) {
        handleReportToYouTube(source);
      }
    }
  };
  
  const platformInfo = {
    youtube: { 
      icon: Youtube, 
      color: 'red', 
      name: 'YouTube',
      actionText: 'Go to YouTube video'
    },
    twitter: { 
      icon: Hash, 
      color: 'blue', 
      name: 'Twitter',
      actionText: 'Go to Twitter hashtag'
    }
  };
  
  const info = platformInfo[platform] || platformInfo.youtube;
  const IconComponent = info.icon;
  
  return (
    <div className={`rounded-xl shadow-lg border transition-colors duration-300 p-6 ${
      isDarkMode 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-100'
    }`}>
      <div className="flex items-center gap-3 mb-6">
        <AlertTriangle className="w-6 h-6 text-red-500" />
        <h2 className={`text-xl font-bold transition-colors duration-300 ${
          isDarkMode ? 'text-gray-100' : 'text-gray-800'
        }`}>
          Detected Anti-India {platform === 'twitter' ? 'Tweets' : 'Comments'} ({comments.length})
        </h2>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-colors duration-300 ${
          info.color === 'red' 
            ? (isDarkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-700')
            : (isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700')
        }`}>
          <IconComponent className="w-4 h-4" />
          <span>{info.name}</span>
        </div>
      </div>
      
      {comments.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <p className={`text-lg transition-colors duration-300 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>
            No anti-India {platform === 'twitter' ? 'tweets' : 'comments'} were detected!
          </p>
          <p className={`text-sm mt-2 transition-colors duration-300 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            The {platform === 'twitter' ? 'tweets' : 'video comments'} appear to be positive or neutral.
          </p>
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {comments.map((comment, index) => (
            <div key={index} className={`border-l-4 border-red-400 rounded-lg p-4 transition-all hover:shadow-md ${
              isDarkMode ? 'bg-red-900/20' : 'bg-red-50'
            }`}>
              <div className="flex justify-between items-start mb-3">
                <span className={`font-semibold text-sm px-2 py-1 rounded transition-colors duration-300 ${
                  isDarkMode 
                    ? 'text-gray-300 bg-gray-700' 
                    : 'text-gray-700 bg-gray-200'
                }`}>
                  @{comment.author}
                </span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs transition-colors duration-300 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {formatDate(comment.published_at)}
                  </span>
                  
                  {platform === 'twitter' && comment.metrics && (
                    <div className={`text-xs flex items-center gap-1 transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      <span>❤️ {comment.metrics.like_count}</span>
                      <span>🔄 {comment.metrics.retweet_count}</span>
                    </div>
                  )}
                  
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleCopyComment(comment, index)}
                      className={`p-1.5 rounded transition-all duration-200 ${
                        isDarkMode
                          ? 'text-gray-400 hover:text-blue-400 hover:bg-blue-900/30'
                          : 'text-gray-500 hover:text-blue-600 hover:bg-blue-100'
                      }`}
                      title={`Copy ${platform === 'twitter' ? 'tweet' : 'comment'} details`}
                    >
                      {copiedIndex === index ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleReportComment(comment, source, platform)}
                      className={`p-1.5 rounded transition-all duration-200 ${
                        isDarkMode
                          ? 'text-gray-400 hover:text-red-400 hover:bg-red-900/30'
                          : 'text-gray-500 hover:text-red-600 hover:bg-red-100'
                      }`}
                      title={`Report this ${platform === 'twitter' ? 'tweet' : 'comment'} to ${info.name}`}
                    >
                      <Flag className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => platform === 'twitter' ? handleOpenTwitter(source) : handleReportToYouTube(source)}
                      className={`p-1.5 rounded transition-all duration-200 ${
                        isDarkMode
                          ? 'text-gray-400 hover:text-blue-400 hover:bg-blue-900/30'
                          : 'text-gray-500 hover:text-blue-600 hover:bg-blue-100'
                      }`}
                      title={info.actionText}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              <p className={`leading-relaxed transition-colors duration-300 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-800'
              }`}>
                {comment.text}
              </p>
              
              <div className={`mt-3 pt-3 border-t transition-colors duration-300 ${
                isDarkMode ? 'border-red-700' : 'border-red-200'
              }`}>
                <p className={`text-xs transition-colors duration-300 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  <Flag className="w-3 h-3 inline mr-1" />
                  Use the report button to get instructions for reporting this {platform === 'twitter' ? 'tweet' : 'comment'} to {info.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ResultsChart = ({ data, platform, source }) => {
  const { isDarkMode } = React.useContext(DarkModeContext);
  const total = data.anti_india + data.non_anti_india;
  const antiPercentage = ((data.anti_india / total) * 100).toFixed(1);
  const nonAntiPercentage = ((data.non_anti_india / total) * 100).toFixed(1);
  
  const pieData = [
    { name: `Safe ${platform === 'twitter' ? 'Tweets' : 'Comments'}`, value: data.non_anti_india, color: '#10b981' },
    { name: `Anti-India ${platform === 'twitter' ? 'Tweets' : 'Comments'}`, value: data.anti_india, color: '#ef4444' },
  ];
  
  const barData = [
    { name: 'Safe', count: data.non_anti_india, fill: '#10b981' },
    { name: 'Anti-India', count: data.anti_india, fill: '#ef4444' },
  ];
  
  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize="14"
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };
  
  const platformInfo = {
    youtube: { icon: Youtube, color: 'red', name: 'YouTube' },
    twitter: { icon: Hash, color: 'blue', name: 'Twitter' }
  };
  
  const info = platformInfo[platform] || platformInfo.youtube;
  const IconComponent = info.icon;
  
  return (
    <div className={`rounded-xl shadow-lg border transition-colors duration-300 p-6 ${
      isDarkMode 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-100'
    }`}>
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="w-6 h-6 text-blue-500" />
        <h2 className={`text-xl font-bold transition-colors duration-300 ${
          isDarkMode ? 'text-gray-100' : 'text-gray-800'
        }`}>
          {platform === 'twitter' ? 'Tweet' : 'Comment'} Analysis Results
        </h2>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm transition-colors duration-300 ${
          info.color === 'red' 
            ? (isDarkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-700')
            : (isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700')
        }`}>
          <IconComponent className="w-4 h-4" />
          <span>{info.name}</span>
        </div>
      </div>
      
      <div className={`mb-4 p-3 rounded-lg transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
      }`}>
        <p className={`text-sm transition-colors duration-300 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>
          <span className="font-medium">Source:</span> {
            platform === 'twitter' ? `#${source.replace('#', '')}` : 'YouTube Video'
          }
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className={`border rounded-lg p-4 transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-green-900/20 border-green-700' 
            : 'bg-green-50 border-green-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-green-400' : 'text-green-600'
              }`}>
                Safe {platform === 'twitter' ? 'Tweets' : 'Comments'}
              </p>
              <p className={`text-2xl font-bold transition-colors duration-300 ${
                isDarkMode ? 'text-green-300' : 'text-green-700'
              }`}>
                {data.non_anti_india}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <p className={`text-xs mt-1 transition-colors duration-300 ${
            isDarkMode ? 'text-green-400' : 'text-green-600'
          }`}>
            {nonAntiPercentage}% of total
          </p>
        </div>
        
        <div className={`border rounded-lg p-4 transition-colors duration-300 ${
          isDarkMode 
            ? 'bg-red-900/20 border-red-700' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium transition-colors duration-300 ${
                isDarkMode ? 'text-red-400' : 'text-red-600'
              }`}>
                Anti-India
              </p>
              <p className={`text-2xl font-bold transition-colors duration-300 ${
                isDarkMode ? 'text-red-300' : 'text-red-700'
              }`}>
                {data.anti_india}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <p className={`text-xs mt-1 transition-colors duration-300 ${
            isDarkMode ? 'text-red-400' : 'text-red-600'
          }`}>
            {antiPercentage}% of total
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className={`text-lg font-semibold mb-4 text-center transition-colors duration-300 ${
            isDarkMode ? 'text-gray-200' : 'text-gray-700'
          }`}>
            Distribution
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={85}
                fill="#8884d8"
                dataKey="value"
                stroke={isDarkMode ? '#374151' : '#fff'}
                strokeWidth={2}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => [`${value} ${platform === 'twitter' ? 'tweets' : 'comments'}`, name]}
                contentStyle={{
                  backgroundColor: isDarkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  color: isDarkMode ? '#f3f4f6' : '#374151'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div>
          <h3 className={`text-lg font-semibold mb-4 text-center transition-colors duration-300 ${
            isDarkMode ? 'text-gray-200' : 'text-gray-700'
          }`}>
            Comparison
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: isDarkMode ? '#9ca3af' : '#6b7280' }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: isDarkMode ? '#9ca3af' : '#6b7280' }}
              />
              <Tooltip 
                formatter={(value, name) => [`${value} ${platform === 'twitter' ? 'tweets' : 'comments'}`, 'Count']}
                contentStyle={{
                  backgroundColor: isDarkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  color: isDarkMode ? '#f3f4f6' : '#374151'
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [url, setUrl] = useState('');
  const [hashtag, setHashtag] = useState('');
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('youtube');
  
  const handleYouTubeSubmit = async (e) => {
    e.preventDefault();
    if (!url) {
      setError('Please enter a YouTube video URL.');
      return;
    }
    
    setIsLoading(true);
    setResults(null);
    setError('');
    
    try {
      const response = await fetch(`${BACKEND_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setResults(data);
    } catch (err) {
      const errorMessage = err.message || 'An unexpected error occurred.';
      setError(errorMessage);
      console.error('Error fetching analysis:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleTwitterSubmit = async (e) => {
    e.preventDefault();
    if (!hashtag) {
      setError('Please enter a hashtag.');
      return;
    }
    
    setIsLoading(true);
    setResults(null);
    setError('');
    
    try {
      const response = await fetch(`${BACKEND_URL}/analyze-twitter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ hashtag }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setResults(data);
    } catch (err) {
      const errorMessage = err.message || 'An unexpected error occurred.';
      setError(errorMessage);
      console.error('Error fetching Twitter analysis:', err);
    } finally {
      setIsLoading(false);
    }
  };

 return (
  <DarkModeProvider>
    <DarkModeContext.Consumer>
      {({ isDarkMode }) => (
        <div className={`min-h-screen transition-all duration-700 ${
          isDarkMode 
            ? 'bg-gradient-to-br from-slate-900 via-gray-900 to-indigo-950' 
            : 'bg-gradient-to-br from-blue-50 via-white to-orange-50'
        }`}>
          {/* Animated background overlay */}
          <div className={`fixed inset-0 transition-opacity duration-700 ${
            isDarkMode ? 'opacity-20' : 'opacity-10'
          }`}>
            <div className={`absolute inset-0 ${
              isDarkMode 
                ? 'bg-gradient-to-r from-blue-900/20 via-purple-900/20 to-green-900/20'
                : 'bg-gradient-to-r from-orange-100/50 via-blue-100/50 to-green-100/50'
            } animate-pulse`}></div>
          </div>
          
          {/* Floating particles effect */}
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <div className={`absolute w-96 h-96 rounded-full blur-3xl transition-all duration-1000 ${
              isDarkMode 
                ? 'bg-blue-500/10 -top-20 -left-20' 
                : 'bg-orange-200/30 -top-10 -left-10'
            }`}></div>
            <div className={`absolute w-96 h-96 rounded-full blur-3xl transition-all duration-1000 delay-300 ${
              isDarkMode 
                ? 'bg-purple-500/10 top-1/2 -right-20' 
                : 'bg-blue-200/30 top-1/3 -right-10'
            }`}></div>
            <div className={`absolute w-96 h-96 rounded-full blur-3xl transition-all duration-1000 delay-500 ${
              isDarkMode 
                ? 'bg-green-500/10 -bottom-20 left-1/3' 
                : 'bg-green-200/30 -bottom-10 left-1/4'
            }`}></div>
          </div>

          <DarkModeToggle />
          
          <div className="relative container mx-auto px-4 py-8 max-w-6xl">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className={`w-12 h-12 bg-gradient-to-r from-orange-500 to-green-500 rounded-xl flex items-center justify-center transition-all duration-500 ${
                  isDarkMode ? 'shadow-lg shadow-orange-500/20' : 'shadow-md'
                }`}>
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <h1 className={`text-4xl font-bold bg-gradient-to-r from-orange-600 to-green-600 bg-clip-text text-transparent transition-all duration-500 ${
                  isDarkMode ? 'drop-shadow-sm' : ''
                }`}>
                  Anti-India Content Detector
                </h1>
                <span className="text-2xl">🇮🇳</span>
              </div>
              <p className={`max-w-2xl mx-auto transition-colors duration-500 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Analyze YouTube comments and Twitter(X) hashtags to identify and flag potentially harmful anti-India sentiment using advanced ML detection.
              </p>
            </div>
            
            {/* Tab Navigation */}
            <div className={`rounded-xl shadow-xl border mb-8 transition-all duration-500 backdrop-blur-sm ${
              isDarkMode 
                ? 'bg-gray-800/90 border-gray-700 shadow-gray-900/50' 
                : 'bg-white/90 border-gray-100 shadow-gray-300/30'
            }`}>
              <div className={`flex border-b transition-colors duration-300 ${
                isDarkMode ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <button
                  onClick={() => {
                    setActiveTab('youtube');
                    setResults(null);
                    setError('');
                  }}
                  className={`flex-1 px-6 py-4 text-center font-semibold transition-all duration-300 ${
                    activeTab === 'youtube'
                      ? (isDarkMode 
                          ? 'text-red-400 border-b-2 border-red-500 bg-red-900/20'
                          : 'text-red-600 border-b-2 border-red-500 bg-red-50')
                      : (isDarkMode 
                          ? 'text-gray-400 hover:text-red-400'
                          : 'text-gray-500 hover:text-red-600')
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Youtube className="w-5 h-5" />
                    <span>YouTube Comments</span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('twitter');
                    setResults(null);
                    setError('');
                  }}
                  className={`flex-1 px-6 py-4 text-center font-semibold transition-all duration-300 ${
                    activeTab === 'twitter'
                      ? (isDarkMode 
                          ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-900/20'
                          : 'text-blue-600 border-b-2 border-blue-500 bg-blue-50')
                      : (isDarkMode 
                          ? 'text-gray-400 hover:text-blue-400'
                          : 'text-gray-500 hover:text-blue-600')
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Hash className="w-5 h-5" />
                    <span>Twitter Hashtags</span>
                  </div>
                </button>
              </div>
              
              {/* Input Forms */}
              <div className="p-6">
                {activeTab === 'youtube' ? (
                  <form onSubmit={handleYouTubeSubmit} className="space-y-4">
                    <div className="relative">
                      <Youtube className="absolute left-4 top-1/2 transform -translate-y-1/2 text-red-500 w-5 h-5" />
                      <input
                        type="text"
                        className={`w-full pl-12 pr-4 py-4 text-lg border rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm ${
                          isDarkMode 
                            ? 'bg-gray-700/80 border-gray-600 text-gray-100 placeholder-gray-400'
                            : 'bg-white/80 border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Paste YouTube Video URL here..."
                      />
                    </div>
                    <div className="flex justify-center">
                      <button
                        type="submit"
                        className={`px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-xl hover:from-red-700 hover:to-red-800 focus:ring-4 focus:ring-red-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                          isDarkMode ? 'shadow-lg shadow-red-500/25' : 'shadow-md'
                        }`}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Analyzing Comments...
                          </>
                        ) : (
                          <>
                            <Youtube className="w-5 h-5" />
                            Analyze YouTube Comments
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleTwitterSubmit} className="space-y-4">
                    <div className="relative">
                      <Hash className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500 w-5 h-5" />
                      <input
                        type="text"
                        className={`w-full pl-12 pr-4 py-4 text-lg border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm ${
                          isDarkMode 
                            ? 'bg-gray-700/80 border-gray-600 text-gray-100 placeholder-gray-400'
                            : 'bg-white/80 border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                        value={hashtag}
                        onChange={(e) => setHashtag(e.target.value)}
                        placeholder="Enter hashtag (e.g., IndiaVsPakistan or #IndiaVsPakistan)"
                      />
                    </div>
                    <div className="flex justify-center">
                      <button
                        type="submit"
                        className={`px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 focus:ring-4 focus:ring-blue-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
                          isDarkMode ? 'shadow-lg shadow-blue-500/25' : 'shadow-md'
                        }`}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Analyzing Tweets...
                          </>
                        ) : (
                          <>
                            <Hash className="w-5 h-5" />
                            Analyze Twitter Hashtag
                          </>
                        )}
                      </button>
                    </div>
                    <div className={`text-center text-sm transition-colors duration-300 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      <p>Note: We analyze the 10 most recent English tweets for the hashtag</p>
                    </div>
                  </form>
                )}
              </div>
            </div>
            
            {/* Status Messages */}
            {isLoading && (
              <div className="text-center py-8">
                <div className={`inline-flex items-center gap-3 border rounded-xl px-6 py-4 transition-all duration-500 backdrop-blur-sm ${
                  isDarkMode 
                    ? 'bg-blue-900/30 border-blue-700 text-blue-300 shadow-lg shadow-blue-900/30'
                    : 'bg-blue-50/80 border-blue-200 text-blue-700 shadow-md'
                }`}>
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="font-medium">
                    {activeTab === 'youtube' 
                      ? 'Fetching and analyzing comments... This may take a moment.' 
                      : 'Fetching and analyzing tweets... This may take a moment.'
                    }
                  </p>
                </div>
              </div>
            )}
            
            {error && (
              <div className="text-center py-4">
                <div className={`inline-flex items-center gap-3 border rounded-xl px-6 py-4 transition-all duration-500 backdrop-blur-sm ${
                  isDarkMode 
                    ? 'bg-red-900/30 border-red-700 text-red-300 shadow-lg shadow-red-900/30'
                    : 'bg-red-50/80 border-red-200 text-red-700 shadow-md'
                }`}>
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <p className="font-medium">Error: {error}</p>
                </div>
              </div>
            )}
            
            {/* Results */}
            {results && (
              <div className="space-y-8">
                <ResultsChart 
                  data={results.counts} 
                  platform={results.platform}
                  source={results.source}
                />
                <CommentList 
                  comments={results.anti_india_comments} 
                  source={results.source}
                  platform={results.platform}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </DarkModeContext.Consumer>
  </DarkModeProvider>
);

}

export default App;
