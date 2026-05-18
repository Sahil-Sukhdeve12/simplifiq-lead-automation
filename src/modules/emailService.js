/**
 * Email Service Module
 * Sends personalized reports via email
 */

const nodemailer = require('nodemailer');
const fs = require('fs');

/**
 * Initialize email transporter
 */
function createTransporter() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    throw new Error('Email configuration missing. Set SMTP_USER and SMTP_PASSWORD in .env');
  }

  return nodemailer.createTransport({
    service: 'gmail',

    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    },

    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,

    tls: {
      rejectUnauthorized: false
    }
  });
}

/**
 * Generate professional email HTML content
 */
function generateEmailContent(leadData, enrichedData) {
  const companyName = leadData.companyName;
  const personName = leadData.firstName;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .container {
          background-color: #f9f9f9;
          border-radius: 8px;
          padding: 30px;
          border-left: 4px solid #3498db;
        }
        .header {
          color: #1a1a1a;
          margin-bottom: 20px;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          color: #1a1a1a;
        }
        .subtitle {
          color: #666;
          font-size: 14px;
          margin-top: 5px;
        }
        .content {
          margin: 20px 0;
          color: #555;
        }
        .highlight {
          background-color: #e8f4f8;
          padding: 15px;
          border-radius: 5px;
          margin: 15px 0;
        }
        .cta-button {
          display: inline-block;
          background-color: #3498db;
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
          font-weight: bold;
        }
        .cta-button:hover {
          background-color: #2980b9;
        }
        .footer {
          border-top: 1px solid #ddd;
          margin-top: 30px;
          padding-top: 20px;
          font-size: 12px;
          color: #999;
        }
        .insight-item {
          padding: 8px 0;
          border-bottom: 1px solid #eee;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Your Personalized Company Intelligence Report</h1>
          <p class="subtitle">Tailored insights for ${companyName}</p>
        </div>

        <div class="content">
          <p>Hello ${personName},</p>

          <p>Thank you for your interest! We've prepared a comprehensive, personalized intelligence report specifically for ${companyName}.</p>

          <div class="highlight">
            <strong>📊 What's Inside Your Report:</strong>
            <div class="insight-item">✓ Executive summary and market positioning analysis</div>
            <div class="insight-item">✓ Company profile and key organizational details</div>
            <div class="insight-item">✓ Strategic insights and growth opportunities</div>
            <div class="insight-item">✓ Personalized recommendations</div>
          </div>

          <p>This report demonstrates our commitment to understanding your business and how we can create meaningful value together.</p>

          <div style="text-align: center;">
            <a href="#" class="cta-button">View Your Full Report</a>
          </div>

          <p style="margin-top: 30px; font-size: 14px;">
            <strong>What's Next?</strong><br>
            We'd love to discuss how our insights can help ${companyName} achieve its strategic objectives. Feel free to reply to this email or schedule a quick conversation at your convenience.
          </p>
        </div>

        <div class="footer">
          <p>This email and attached report are confidential and intended only for the named recipient.</p>
          <p>© ${new Date().getFullYear()} SimplifIQ. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send report email to prospect
 */
async function sendReportEmail(leadData, reportPath) {
  try {
    const transporter = createTransporter();

    // Check if report file exists
    if (!fs.existsSync(reportPath)) {
      throw new Error(`Report file not found: ${reportPath}`);
    }

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: leadData.email,
      subject: `Your Personalized Intelligence Report - ${leadData.companyName}`,
      html: generateEmailContent(leadData, {}),
      attachments: [
        {
          filename: `Intelligence_Report_${leadData.companyName.replace(/\s+/g, '_')}.pdf`,
          path: reportPath
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);

    return {
      success: true,
      messageId: info.messageId,
      sentAt: new Date().toISOString(),
      recipient: leadData.email
    };
  } catch (error) {
    console.error('Email send error:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

/**
 * Send notification email to admin
 */
async function sendAdminNotification(leadData, reportPath, status) {
  try {
    const transporter = createTransporter();
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;

    if (adminEmail === process.env.SMTP_USER) {
      // Skip if no admin email configured separately
      console.log('Admin notification skipped - no separate admin email configured');
      return;
    }

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: adminEmail,
      subject: `[SimplifIQ] New Lead: ${leadData.companyName}`,
      html: `
        <h2>New Lead Processed</h2>
        <p><strong>Company:</strong> ${leadData.companyName}</p>
        <p><strong>Contact:</strong> ${leadData.firstName} ${leadData.lastName}</p>
        <p><strong>Email:</strong> ${leadData.email}</p>
        <p><strong>Status:</strong> ${status}</p>
        <p><strong>Processed at:</strong> ${new Date().toISOString()}</p>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Admin notification error:', error);
  }
}

module.exports = {
  sendReportEmail,
  sendAdminNotification,
  generateEmailContent
};
