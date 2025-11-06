# CMRIT Research Portal - New Features Documentation

## 🎯 Overview
This document covers the newly implemented advanced analytics and automation features for the CMRIT Research Portal.

## ✨ New Features

### 1. 📊 Enhanced Department Analytics Dashboard
**Location:** `/department-analytics`

**Features:**
- View aggregated statistics for any department
- Total citations across all faculty
- Average h-index and i10-index
- Department-level publication trends over years
- Top research topics/keywords
- Interactive charts showing research patterns

**API Endpoint:**
```
GET /api/analytics/department/:department
```

### 2. 🏆 Leaderboard System
**Location:** `/leaderboard` (dedicated page) and Landing Page (preview)

**Features:**
- **Top Researchers by Citations:** Displays top 5-10 researchers with medal icons (🥇🥈🥉)
- **Most Active Department:** Shows the department with the most publications this year
- Includes faculty count, total citations, and average h-index
- Click-through to individual faculty dashboards

**API Endpoints:**
```
GET /api/analytics/leaderboard/top-researchers?limit=5
GET /api/analytics/leaderboard/most-active-department?year=2025
```

### 3. 🔄 Automated Data Refresh (Cron Jobs)
**Features:**
- Automatically re-scrapes all faculty profiles monthly
- Updates citations, h-index, i10-index, and publications
- Runs on the 1st of every month at 2:00 AM
- Includes delays between requests to avoid overwhelming Google Scholar

**Schedule:**
```javascript
// Monthly rescrape: 1st of every month at 2:00 AM
cron.schedule('0 2 1 * *', rescrapeAllProfiles);
```

**Manual Trigger:**
```
POST /api/admin/rescrape-all
```

### 4. 📧 Email Notifications
**Features:**
- Sends monthly research statistics to faculty members
- Includes overall metrics (publications, citations, h-index, i10-index)
- Shows publications for current year
- Highlights top 3 most cited papers
- Automatically runs on the 1st of every month at 9:00 AM

**Schedule:**
```javascript
// Monthly emails: 1st of every month at 9:00 AM
cron.schedule('0 9 1 * *', sendMonthlyEmails);
```

**Manual Endpoints:**
```
POST /api/admin/send-all-stats-emails
POST /api/admin/send-stats-email/:userId
```

### 5. 🛠️ Admin Panel
**Location:** `/admin`

**Features:**
- Manual trigger for full profile rescrape
- Send emails to all faculty or specific users
- View scheduled cron job status
- Real-time feedback on operation status
- Configuration instructions for email setup

**Access:** Navigate to `/admin` in the application

## 🔧 Configuration

### Email Setup

1. **Create a `.env` file in the Backend directory** (use `.env.example` as template):

```env
# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

2. **For Gmail:**
   - Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
   - Generate an App Password
   - Use that password in `EMAIL_PASSWORD` (not your regular Gmail password)

3. **For other services:**
   - SendGrid: `EMAIL_SERVICE=SendGrid`, `EMAIL_USER=apikey`, `EMAIL_PASSWORD=your-api-key`
   - Mailgun: `EMAIL_SERVICE=Mailgun`, configure accordingly
   - AWS SES: Similar configuration

### Dependencies

New packages installed:
```bash
npm install nodemailer node-cron
```

## 📱 UI Components

### New Pages Created:
1. **LeaderboardPage** (`/leaderboard`) - Full leaderboard view
2. **AdminPanel** (`/admin`) - Admin controls

### New Components Created:
1. **Leaderboard** - Reusable leaderboard component
2. Enhanced existing components with new navigation links

### Navigation Updates:
The navbar now includes:
- Home
- Faculty
- **Leaderboard** (new)
- Compare
- Analytics

## 🔒 Security Considerations

### Email Configuration
- Store email credentials in `.env` file (never commit to git)
- `.env` is already in `.gitignore`
- Use App Passwords for Gmail (more secure than regular passwords)
- Consider using dedicated email services (SendGrid, Mailgun) for production

### Admin Panel
- Currently accessible at `/admin` without authentication
- **TODO for Production:** Add admin authentication middleware
- Consider IP whitelisting for admin routes
- Implement role-based access control (RBAC)

## 📈 Performance Considerations

### Scraping
- Includes 5-second delays between profile scrapes to avoid rate limiting
- Logs progress for each faculty member
- Handles errors gracefully and continues with next profile
- Recommended to run during low-traffic hours (default: 2:00 AM)

### Email Sending
- Includes 1-second delays between emails to avoid rate limiting
- Processes emails in batches
- Logs success/failure for each email
- Recommended to run during business hours (default: 9:00 AM)

## 🚀 Usage Examples

### 1. View Department Analytics
```
Navigate to: http://localhost:5173/department-analytics
Select a department from dropdown
View aggregated statistics and charts
```

### 2. Check Leaderboard
```
Navigate to: http://localhost:5173/leaderboard
Or scroll down on landing page for preview
Click on any researcher to view their full profile
```

### 3. Manual Rescrape
```
Navigate to: http://localhost:5173/admin
Click "Start Rescrape" button
Wait for completion message
```

### 4. Send Test Email
```
Navigate to: http://localhost:5173/admin
Enter a user ID
Click "Send Email"
Check faculty member's email inbox
```

## 🧪 Testing

### Test Leaderboard Endpoints:
```bash
# Top researchers
curl http://localhost:5002/api/analytics/leaderboard/top-researchers?limit=5

# Most active department
curl http://localhost:5002/api/analytics/leaderboard/most-active-department
```

### Test Email (manual):
```bash
# Send to specific user
curl -X POST http://localhost:5002/api/admin/send-stats-email/1
```

### Test Rescrape (manual):
```bash
# Start rescrape process
curl -X POST http://localhost:5002/api/admin/rescrape-all
```

## 📋 Cron Job Schedule

| Task | Schedule | Description |
|------|----------|-------------|
| Profile Rescrape | 1st of month, 2:00 AM | Updates all faculty profiles from Google Scholar |
| Email Notifications | 1st of month, 9:00 AM | Sends monthly stats to all faculty |

**Note:** Server must be running for cron jobs to execute!

## 🐛 Troubleshooting

### Emails Not Sending
1. Check `.env` file has correct EMAIL_* variables
2. Verify Gmail App Password is correct
3. Check console logs for error messages
4. Test with manual send first (`/admin` panel)

### Cron Jobs Not Running
1. Ensure server stays running (use PM2 or similar)
2. Check server logs for "Cron jobs scheduled" message
3. Verify server timezone matches expected schedule

### Leaderboard Empty
1. Ensure faculty profiles have citation data
2. Run a manual rescrape to populate data
3. Check database for user records

## 🔮 Future Enhancements

Potential improvements:
- [ ] Add authentication to admin panel
- [ ] Implement rate limiting on admin endpoints
- [ ] Add email templates for different notification types
- [ ] Create email preferences page for faculty
- [ ] Add webhook support for real-time updates
- [ ] Implement data visualization dashboards
- [ ] Add export functionality (CSV, PDF reports)
- [ ] Create mobile app notifications

## 📞 Support

For issues or questions:
1. Check server logs in terminal
2. Review this documentation
3. Check `.env` configuration
4. Test endpoints manually with curl/Postman

---

**Last Updated:** November 6, 2025
**Version:** 2.0.0
