# Email Setup Guide - User Approval System

## 📍 Where to Set Email Credentials

- The email address and app password are set in the file:
  `/var/www/storage-app-server/.env.remote`
- Update these lines to change the sender or password:
  ```env
  EMAIL_USER=antonio.guiotto.dev@gmail.com
  EMAIL_PASS=jawz dlnw bzvp kczq
  ```
- **After any change, always restart the server:**
  ```bash
  pm2 restart storage-app-server
  ```

This guide explains how to configure email notifications for the user approval system.

## 🔧 Required Environment Variables

Add these to `/var/www/storage-app-server/.env.remote`:

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## 📧 Gmail App Password Setup

### Step 1: Enable 2-Factor Authentication
1. Go to https://myaccount.google.com/
2. Click "Security" → "2-Step Verification"
3. Enable 2FA if not already enabled

### Step 2: Generate App Password
1. Go to https://myaccount.google.com/security
2. Find "App passwords" (appears after 2FA is enabled)
3. Click "App passwords"
4. Select "Mail" → "Other (Custom name)"
5. Enter name: "Termoparotto App"
6. Click "Generate"
7. **Copy the 16-character password** (format: `abcd efgh ijkl mnop`)

### Step 3: Update Environment File
```env
EMAIL_USER=your-actual-gmail@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop  # Your generated app password
```

## 🔄 Alternative Email Providers

### SendGrid (Free: 100 emails/day)
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
```

### Mailgun (Free: 5,000 emails/month for 3 months)
```env
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=your-mailgun-username
EMAIL_PASS=your-mailgun-password
```

### Brevo (Free: 300 emails/day)
```env
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=587
EMAIL_USER=your-brevo-username
EMAIL_PASS=your-brevo-password
```

## 🚀 After Configuration

1. **Restart the server:**
   ```bash
   cd /var/www
   pm2 restart storage-app-server
   ```

2. **Test the system:**
   - Register a new user at `http://termoparotto.micro-cloud.it/register`
   - Check if admin receives notification email
   - Approve user and check if user receives approval email

## 🔍 Troubleshooting

### Common Issues:
- **"Invalid credentials"**: Check your app password is correct
- **"Authentication failed"**: Ensure 2FA is enabled for Gmail
- **"Connection timeout"**: Check firewall/network settings
- **"Rate limit exceeded"**: Free providers have daily limits

### Test Email Connection:
```bash
# Check server logs for email errors
pm2 logs storage-app-server
```

## 📋 What the System Does

1. **User Registration**: Sends notification email to admin
2. **User Approval**: Sends confirmation email to approved user
3. **User Rejection**: Sends rejection email to user (with optional reason)

## 🔒 Security Notes

- Never commit `.env.remote` to version control
- App passwords are more secure than regular passwords
- Each provider has different security requirements
- Consider using environment-specific email accounts

---

**Next Steps for LLM:**
- Help user generate Gmail App Password step-by-step
- Guide through environment file updates
- Test email functionality
- Troubleshoot any issues 