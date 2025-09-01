import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Flag, Copy, ExternalLink } from 'lucide-react';

const CommentList = ({ comments, videoUrl }) => {
  const [copiedIndex, setCopiedIndex] = useState(null);

  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleCopyComment = async (comment, index) => {
    const commentText = `Comment by @${comment.author} on ${formatDate(comment.published_at)}:\n\n"${comment.text}"`;
    
    try {
      await navigator.clipboard.writeText(commentText);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleReportToYouTube = (videoUrl) => {
    // Extract video ID from URL for YouTube reporting
    const videoIdMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    const videoId = videoIdMatch ? videoIdMatch[1] : null;
    
    if (videoId) {
      // Open YouTube's general reporting page - users will need to navigate to the specific comment
      const reportUrl = `https://www.youtube.com/watch?v=${videoId}`;
      window.open(reportUrl, '_blank');
    }
  };

  const handleReportComment = (comment, videoUrl) => {
    // Since we can't directly report comments via API, we'll help users report manually
    const alertMessage = `To report this comment to YouTube:
1. Click "Go to YouTube" to open the video
2. Find the comment by @${comment.author}
3. Click the three dots (⋯) next to the comment
4. Select "Report"
5. Choose the appropriate reason

Comment text: "${comment.text.substring(0, 100)}${comment.text.length > 100 ? '...' : ''}"`;
    
    if (window.confirm(alertMessage)) {
      handleReportToYouTube(videoUrl);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      <div className="flex items-center gap-3 mb-6">
        <AlertTriangle className="w-6 h-6 text-red-500" />
        <h2 className="text-xl font-bold text-gray-800">
          Detected Anti-India Comments ({comments.length})
        </h2>
      </div>
      
      {comments.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No anti-India comments were detected!</p>
          <p className="text-sm text-gray-500 mt-2">The video comments appear to be positive or neutral.</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {comments.map((comment, index) => (
            <div key={index} className="bg-red-50 border-l-4 border-red-400 rounded-lg p-4 transition-all hover:shadow-md">
              <div className="flex justify-between items-start mb-3">
                <span className="font-semibold text-gray-700 text-sm bg-gray-200 px-2 py-1 rounded">
                  @{comment.author}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{formatDate(comment.published_at)}</span>
                  
                  {/* Report Actions */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleCopyComment(comment, index)}
                      className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded transition-all duration-200"
                      title="Copy comment details"
                    >
                      {copiedIndex === index ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleReportComment(comment, videoUrl)}
                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded transition-all duration-200"
                      title="Report this comment to YouTube"
                    >
                      <Flag className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleReportToYouTube(videoUrl)}
                      className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded transition-all duration-200"
                      title="Go to YouTube video"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-gray-800 leading-relaxed">{comment.text}</p>
              
              {/* Report Helper Text */}
              <div className="mt-3 pt-3 border-t border-red-200">
                <p className="text-xs text-gray-600">
                  <Flag className="w-3 h-3 inline mr-1" />
                  Use the report button to get instructions for reporting this comment to YouTube
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentList;
