# DeepSeek API Setup - Quick Start

## 🚀 Get Your API Key (2 minutes)

1. **Visit**: [console.deepseek.com](https://console.deepseek.com/)
2. **Sign up/Login** with your email
3. **Get API Key** from the dashboard
4. **Add to `.env`**:
```bash
DEEPSEEK_API_KEY=your_key_here
```

## 🔧 Test It

1. **Restart server**: `yarn dev`
2. **Visit dashboard** - should see "🤖 DeepSeek AI" badge
3. **Check console** - should see "Using DeepSeek API for AI analysis..."

## 💰 Cost

- **DeepSeek**: ~$0.14 per 1M tokens
- **Your usage**: ~100-200 tokens per analysis
- **Monthly cost**: ~$0.01-0.05 (very cheap!)

## 🎯 What You Get

- **Human-like insights** from construction industry expert
- **Business context** understanding
- **Actionable recommendations** 
- **Trend analysis** and patterns
- **Professional language** suitable for stakeholders

## 🔄 How It Works

1. **Dashboard loads** → Triggers DeepSeek analysis
2. **Data sent** → Current metrics + business context
3. **AI analyzes** → Industry-specific insights
4. **Results displayed** → Professional business analysis
5. **Fallback ready** → Local analysis if API fails

## 🚨 Troubleshooting

- **No API key**: Uses local analysis (still good!)
- **API errors**: Falls back to local analysis
- **Rate limits**: Very generous, unlikely to hit
- **Timeout**: 30 second limit, then fallback

## 📊 Example Output

**With DeepSeek**: Professional business insights with industry knowledge
**Without API**: Good local analysis with basic patterns

The system works great either way! 🎉
