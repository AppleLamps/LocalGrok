# Grok API Setup Guide

This document will help you set up and troubleshoot your X.AI Grok API integration with this application.

## Getting Your X.AI API Key

1. Visit [https://x.ai/](https://x.ai/) and sign in to your account
2. Navigate to the API section (usually found in your account settings)
3. Generate a new API key
4. Copy the API key - make sure to store it securely, as you won't be able to see it again

## Setting Up the API Key in the Application

1. Open the application
2. Click the Settings icon (gear icon) in the top right corner
3. Paste your X.AI API key in the "XAI API Key" field
4. Click "Test API Key" to verify it works
5. Click "Save" to store the key

## Troubleshooting Common Issues

### API Key Invalid

If you receive an "API Key Invalid" error:

1. **Check the key format**: Make sure you've copied the entire key without any extra spaces
2. **Key permissions**: Ensure your API key has the necessary permissions for chat completions
3. **Account status**: Verify your X.AI account is active and in good standing
4. **Try regenerating**: If all else fails, try generating a new API key

### Rate Limit Exceeded

If you encounter rate limit errors:

1. **Wait and retry**: API rate limits are usually time-based - wait a few minutes before trying again
2. **Check your plan**: Your X.AI subscription plan may have limits on API usage
3. **Reduce requests**: Consider sending fewer requests in a short time period

### Connection Issues

If you're having trouble connecting to the API:

1. **Check your internet**: Ensure you have a stable internet connection
2. **Firewall/VPN**: Check if a firewall or VPN might be blocking the connection
3. **Service status**: Check if the X.AI service is experiencing any outages

## Testing the API Directly

You can test your API key directly using the included test script:

```bash
node test-grok.js YOUR_API_KEY
```

This will show you detailed information about the API request and response, which can help diagnose issues.

## Additional Resources

- [X.AI Documentation](https://x.ai/documentation) - Official documentation for the X.AI API
- [Grok Model Documentation](https://x.ai/models) - Information about the Grok model capabilities

## Support

If you continue to experience issues after trying these troubleshooting steps, please check the X.AI support resources or contact their support team for assistance with API access issues. 