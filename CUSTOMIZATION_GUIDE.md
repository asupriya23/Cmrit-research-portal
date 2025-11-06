# Customization Guide

## 📅 Cron Job Schedule Customization

### Current Schedules:
```javascript
// Rescrape: 1st of month at 2:00 AM
cron.schedule('0 2 1 * *', rescrapeAllProfiles);

// Emails: 1st of month at 9:00 AM
cron.schedule('0 9 1 * *', sendMonthlyEmails);
```

### Cron Syntax Guide:
```
┌────────────── second (optional, 0-59)
│ ┌──────────── minute (0-59)
│ │ ┌────────── hour (0-23)
│ │ │ ┌──────── day of month (1-31)
│ │ │ │ ┌────── month (1-12)
│ │ │ │ │ ┌──── day of week (0-7)
│ │ │ │ │ │
* * * * * *
```

### Common Examples:
```javascript
// Every day at midnight
cron.schedule('0 0 * * *', task);

// Every Monday at 9 AM
cron.schedule('0 9 * * 1', task);

// Every week (Sunday at midnight)
cron.schedule('0 0 * * 0', task);

// Every 15th of month at 3 PM
cron.schedule('0 15 15 * *', task);

// Every 6 months (Jan 1 and Jul 1 at 2 AM)
cron.schedule('0 2 1 1,7 *', task);

// For testing: Every minute
cron.schedule('* * * * *', task);

// For testing: Every 5 minutes
cron.schedule('*/5 * * * *', task);
```

### To Change Schedule:
Find in `Backend/server.js` around line 1250:
```javascript
// Change this line to your preferred schedule
cron.schedule('0 2 1 * *', () => {
  console.log('Running scheduled monthly rescrape...');
  rescrapeAllProfiles();
});
```

## 📧 Email Template Customization

### Location:
Find `sendMonthlyStatsEmail` function in `Backend/server.js` around line 1090

### Current Template Structure:
```javascript
const mailOptions = {
  from: process.env.EMAIL_USER,
  to: user.email,
  subject: 'Your Monthly Research Statistics',
  html: `
    <!-- Your HTML email template -->
  `
};
```

### Customization Options:

#### 1. Change Subject Line:
```javascript
subject: 'Your Quarterly Research Update - CMRIT'
// or
subject: `${user.name} - Research Stats for ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`
```

#### 2. Add College Logo:
```html
<div style="text-align: center; margin-bottom: 20px;">
  <img src="https://your-college-domain.com/logo.png" alt="CMRIT Logo" style="max-width: 200px;">
</div>
```

#### 3. Change Color Scheme:
Current: Blue theme (#2563eb, #e0f2fe)
```html
<!-- Change these colors throughout the template -->
<h2 style="color: #1e40af;">  <!-- Dark blue -->
<div style="background-color: #dbeafe;">  <!-- Light blue -->
<div style="border-left: 3px solid #3b82f6;">  <!-- Blue accent -->
```

To maroon/gold theme:
```html
<h2 style="color: #7c2d12;">  <!-- Maroon -->
<div style="background-color: #fef3c7;">  <!-- Light gold -->
<div style="border-left: 3px solid: #991b1b;">  <!-- Maroon accent -->
```

#### 4. Add Additional Sections:

**Recent Achievements:**
```javascript
${user.recentAwards ? `
  <div style="margin: 20px 0;">
    <h3>Recent Awards</h3>
    <ul>
      ${user.recentAwards.map(award => `<li>${award}</li>`).join('')}
    </ul>
  </div>
` : ''}
```

**Collaboration Suggestions:**
```javascript
<div style="margin: 20px 0;">
  <h3>Potential Collaborators</h3>
  <p>Faculty in your research area with similar interests...</p>
</div>
```

**Goals Section:**
```javascript
<div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px;">
  <h3>Goals for Next Month</h3>
  <ul>
    <li>Target: ${Math.round(user.citationCount * 1.1)} citations</li>
    <li>Suggested: Submit 1 new paper</li>
  </ul>
</div>
```

#### 5. Add Charts/Graphs:
Use a service like QuickChart:
```javascript
<img src="https://quickchart.io/chart?c={
  type:'bar',
  data:{
    labels:${JSON.stringify(yearLabels)},
    datasets:[{
      label:'Publications',
      data:${JSON.stringify(yearData)}
    }]
  }
}" alt="Publication Chart" style="max-width: 100%;">
```

### Complete Custom Template Example:
```javascript
const mailOptions = {
  from: process.env.EMAIL_USER,
  to: user.email,
  subject: `Research Update - ${new Date().toLocaleString('default', { month: 'long' })} ${currentYear}`,
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; }
        .metric-card { background: #f8fafc; padding: 15px; margin: 10px 0; border-radius: 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="color: white; margin: 0;">Your Research Impact</h1>
          <p style="color: #e2e8f0;">Monthly Update for ${user.name}</p>
        </div>
        
        <div style="padding: 20px;">
          <h2>Hello Dr. ${user.name.split(' ').pop()},</h2>
          <p>Here's your research performance summary:</p>
          
          <!-- Metrics Grid -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div class="metric-card">
              <h3 style="margin: 0 0 5px 0; color: #64748b;">Citations</h3>
              <p style="font-size: 32px; font-weight: bold; margin: 0; color: #1e293b;">${user.citationCount}</p>
            </div>
            <div class="metric-card">
              <h3 style="margin: 0 0 5px 0; color: #64748b;">h-index</h3>
              <p style="font-size: 32px; font-weight: bold; margin: 0; color: #1e293b;">${user.hIndex}</p>
            </div>
          </div>
          
          <!-- Your custom sections here -->
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 14px;">
              Keep up the excellent work!<br>
              <strong>CMRIT Research Portal Team</strong>
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
};
```

## 🎨 Leaderboard Customization

### Change Medal Emojis:
In `project/src/components/Leaderboard.tsx`:
```typescript
const getMedalEmoji = (position: number) => {
  switch (position) {
    case 0: return '👑'; // King crown instead of gold
    case 1: return '⭐'; // Star instead of silver
    case 2: return '🌟'; // Glowing star instead of bronze
    default: return `#${position + 1}`;
  }
};
```

### Change Color Scheme:
```typescript
const getMedalBg = (position: number) => {
  switch (position) {
    case 0: return 'bg-purple-100 border-purple-400'; // Purple theme
    case 1: return 'bg-blue-100 border-blue-400';
    case 2: return 'bg-green-100 border-green-400';
    default: return 'bg-gray-700 border-gray-600';
  }
};
```

### Change Leaderboard Size:
In component usage:
```tsx
<Leaderboard limit={10} />  // Show top 10
<Leaderboard limit={3} />   // Show only top 3
```

## ⚙️ Scraping Customization

### Change Scraping Delay:
In `Backend/server.js`, find `rescrapeAllProfiles` function:
```javascript
// Current: 5 seconds between scrapes
await new Promise(resolve => setTimeout(resolve, 5000));

// Change to 10 seconds (safer, slower)
await new Promise(resolve => setTimeout(resolve, 10000));

// Change to 3 seconds (faster, riskier)
await new Promise(resolve => setTimeout(resolve, 3000));
```

### Scrape Specific Departments Only:
```javascript
const rescrapeAllProfiles = async () => {
  // Only scrape CSE and ISE departments
  const users = await User.find({ 
    googleScholarId: { $exists: true, $ne: '' },
    department: { $in: ['Computer Science & Engineering', 'Information Science & Engineering'] }
  });
  // ... rest of function
};
```

### Skip Users Without Recent Updates:
```javascript
// Only rescrape if last updated more than 30 days ago
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
const users = await User.find({ 
  googleScholarId: { $exists: true, $ne: '' },
  $or: [
    { lastScraped: { $lt: thirtyDaysAgo } },
    { lastScraped: { $exists: false } }
  ]
});
```

## 🔔 Notification Customization

### Add SMS Notifications:
Install Twilio:
```bash
npm install twilio
```

Add to server.js:
```javascript
const twilio = require('twilio');
const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

const sendSMS = async (user) => {
  await twilioClient.messages.create({
    body: `Hi ${user.name}, your monthly research stats are ready! Citations: ${user.citationCount}`,
    from: process.env.TWILIO_PHONE,
    to: user.phoneNumber
  });
};
```

### Add Slack Notifications:
```javascript
const sendSlackNotification = async (message) => {
  await axios.post(process.env.SLACK_WEBHOOK_URL, {
    text: message
  });
};

// Use in cron job
await sendSlackNotification(`Monthly rescrape completed! ${successCount} profiles updated.`);
```

## 📊 Analytics Customization

### Add More Metrics to Email:
```javascript
// Calculate additional metrics
const avgCitationsPerPaper = publications.length > 0 
  ? Math.round(user.citationCount / publications.length) 
  : 0;

const recentPapers = publications.filter(p => 
  parseInt(p.paper_year) >= currentYear - 2
).length;

// Add to email template
<p><strong>Avg Citations/Paper:</strong> ${avgCitationsPerPaper}</p>
<p><strong>Papers (Last 2 Years):</strong> ${recentPapers}</p>
```

### Change Leaderboard Criteria:
Instead of citations, rank by h-index:
```javascript
app.get("/api/analytics/leaderboard/top-researchers", async (req, res) => {
  const topByHIndex = await User.find()
    .sort({ hIndex: -1 })  // Changed from citationCount
    .limit(limit)
    .select('user_id name department designation citationCount hIndex i10Index profilePic');
  
  res.json({ topResearchers: topByHIndex });
});
```

---

**Pro Tip:** Test all customizations thoroughly before deploying to production!
