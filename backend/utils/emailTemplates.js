const getSuggestionEmailTemplate = (suggestionData) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Suggestion Received</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f4f4f4;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          padding: 0;
          background-color: #ffffff;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
        }
        .header p {
          margin: 10px 0 0;
          opacity: 0.9;
        }
        .content {
          padding: 30px;
        }
        .suggestion-detail {
          background: #f8f9fa;
          border-left: 4px solid #667eea;
          padding: 20px;
          margin: 20px 0;
          border-radius: 5px;
        }
        .info-row {
          margin: 15px 0;
          padding: 10px;
          background: #ffffff;
          border-radius: 5px;
          border: 1px solid #e0e0e0;
        }
        .info-label {
          font-weight: bold;
          color: #667eea;
          margin-bottom: 5px;
        }
        .info-value {
          color: #333;
        }
        .badge {
          display: inline-block;
          padding: 5px 10px;
          border-radius: 5px;
          font-size: 12px;
          font-weight: bold;
        }
        .badge-feature {
          background: #e3f2fd;
          color: #1976d2;
        }
        .badge-bug {
          background: #ffebee;
          color: #c62828;
        }
        .footer {
          background: #f8f9fa;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #666;
          border-top: 1px solid #e0e0e0;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✨ New Suggestion Received!</h1>
          <p>Your input matters - check out this new idea</p>
        </div>
        
        <div class="content">
          <div class="info-row">
            <div class="info-label">👤 Submitted by:</div>
            <div class="info-value"><strong>${suggestionData.userName}</strong></div>
          </div>
          
          <div class="info-row">
            <div class="info-label">📧 Email:</div>
            <div class="info-value">${suggestionData.userEmail}</div>
          </div>
          
          <div class="info-row">
            <div class="info-label">📂 Category:</div>
            <div class="info-value">
              <span class="badge ${suggestionData.category === 'Bug Report' ? 'badge-bug' : 'badge-feature'}">
                ${suggestionData.category || 'General'}
              </span>
            </div>
          </div>
          
          <div class="info-row">
            <div class="info-label">🎯 Priority:</div>
            <div class="info-value"><strong>${suggestionData.priority || 'Medium'}</strong></div>
          </div>
          
          <div class="suggestion-detail">
            <div class="info-label">💡 Suggestion:</div>
            <div class="info-value">${suggestionData.suggestion}</div>
          </div>
          
          <div class="info-row">
            <div class="info-label">🆔 Suggestion ID:</div>
            <div class="info-value"><code>${suggestionData.suggestionId || 'N/A'}</code></div>
          </div>
          
          <div class="info-row">
            <div class="info-label">📅 Submitted on:</div>
            <div class="info-value">${new Date().toLocaleString()}</div>
          </div>
          
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/suggestions" class="button">
            View All Suggestions
          </a>
        </div>
        
        <div class="footer">
          <p>This is an automated notification from the Attendance Management System.</p>
          <p>Please review this suggestion and take appropriate action.</p>
          <p>© ${new Date().getFullYear()} Attendance Management System</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export default getSuggestionEmailTemplate;