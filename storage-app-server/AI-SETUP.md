# AI Dashboard Analysis Setup

This feature provides AI-powered insights for your dashboard using the DeepSeek API.

## 🚀 Quick Setup

### 1. Get DeepSeek API Key
- Visit [DeepSeek Console](https://console.deepseek.com/)
- Sign up and get your API key
- Add to your `.env` file:
```bash
DEEPSEEK_API_KEY=your_api_key_here
```

### 2. Install Dependencies
```bash
npm install axios
```

### 3. Features
- **Real-time Analysis**: Every time you visit the dashboard
- **Smart Insights**: Business metrics analysis
- **Actionable Recommendations**: Improvement suggestions
- **Trend Identification**: Business pattern recognition
- **Fallback Mode**: Local analysis if API is unavailable

## 🔧 Configuration

### Environment Variables
```bash
# Required for AI features
DEEPSEEK_API_KEY=your_api_key_here

# Optional: Customize API behavior
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_TEMPERATURE=0.3
DEEPSEEK_MAX_TOKENS=800
```

### API Endpoint
```
POST /api/ai/analyze-dashboard
```

## 📊 What Gets Analyzed

The AI analyzes these dashboard metrics:
- Total Clients & Users
- Admin-to-User Ratio
- Product Catalog & Pricing
- Worksite Utilization
- Report Completion Rates
- Business Performance Trends

## 🎯 Benefits

- **Instant Insights**: Get business intelligence on every dashboard visit
- **Cost Effective**: DeepSeek is ~$0.14 per 1M tokens
- **Professional Analysis**: Business-focused recommendations
- **Always Available**: Fallback to local analysis if API fails
- **Real-time Updates**: Fresh insights with each analysis

## 🔄 How It Works

1. **Dashboard Load**: Component automatically triggers analysis
2. **Data Collection**: Gathers current dashboard metrics
3. **AI Processing**: Sends data to DeepSeek API
4. **Response Parsing**: Extracts insights, recommendations, trends
5. **Display**: Shows professional analysis in dashboard
6. **Fallback**: Uses local analysis if API unavailable

## 💡 Customization

### Modify Analysis Prompt
Edit the prompt in `server/routes/ai.js` to focus on specific business areas.

### Add New Metrics
Extend the metrics object in the frontend component to include additional data.

### Custom Fallback Logic
Modify `generateLocalAnalysis()` function for business-specific insights.

## 🚨 Troubleshooting

### API Key Issues
- Verify API key is correct
- Check API key permissions
- Ensure environment variable is loaded

### Rate Limiting
- DeepSeek has generous rate limits
- Monitor usage in console
- Implement caching if needed

### Fallback Mode
- Check server logs for API errors
- Verify local analysis is working
- Test with network disconnected

## 📈 Performance

- **Response Time**: ~2-3 seconds with DeepSeek
- **Fallback Time**: <100ms local analysis
- **Cache Strategy**: None (real-time data)
- **Error Handling**: Graceful degradation

## 🔒 Security

- API key stored in environment variables
- No sensitive data sent to AI service
- Input validation on all metrics
- Rate limiting protection
