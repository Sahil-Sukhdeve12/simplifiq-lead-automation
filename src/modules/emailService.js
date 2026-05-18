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
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD || !process.env.SMTP_HOST || !process.env.SMTP_PORT) {
    throw new Error(
      'Email configuration missing. Set SMTP_USER, SMTP_PASSWORD, SMTP_HOST, and SMTP_PORT in .env'
    );
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: false,

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
function generateEmailContent(leadData) {
  const companyName = leadData.companyName;
  const personName = leadData.firstName;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8" />
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

        .insight-item {
          padding: 8px 0;
          border-bottom: 1px solid #eee;
        }

        .footer {
          border-top: 1px solid #ddd;
          margin-top: 30px;
          padding-top: 20px;
          font-size: 12px;
          color: #999;
        }
      </style>
    </head>

    <body>
      <div class="container">
        <div class="header">
          <h1>Your Personalized Company Intelligence Report</h1>
          <p class="subtitle">
            Tailored insights for ${companyName}
          </p>
        </div>

        <div class="content">
          <p>Hello ${personName},</p>

          <p>
            Thank you for your interest! We've prepared a comprehensive,
            personalized intelligence report specifically for
            <strong>${companyName}</strong>.
          </p>

          <div class="highlight">
            <strong>📊 What's Inside Your Report:</strong>

            <div class="insight-item">
              ✓ Executive summary and market positioning analysis
            </div>

            <div class="insight-item">
              ✓ Company profile and organizational insights
            </div>

            <div class="insight-item">
              ✓ Strategic growth opportunities
            </div>

            <div class="insight-item">
              ✓ Personalized recommendations
            </div>
          </div>

          <p>
            Please find your PDF report attached with this email.
          </p>

          <p>
            We look forward to discussing how these insights can help
            ${companyName} achieve its goals.
          </p>
        </div>

        <div class="footer">
          <p>
            This email and attached report are confidential and intended
            only for the named recipient.
          </p>

          <p>
            © ${new Date().getFullYear()} SimplifIQ. All rights reserved.
          </p>
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

    // Verify SMTP connection
    await transporter.verify();
    console.log('✓ SMTP server is ready');

    // Check if report exists
    if (!fs.existsSync(reportPath)) {
      throw new Error(`Report file not found: ${reportPath}`);
    }

    const mailOptions = {
      from: `"SimplifIQ" <${process.env.SMTP_USER}>`,
      to: leadData.email,
      subject: `Your Personalized Intelligence Report - ${leadData.companyName}`,
      html: generateEmailContent(leadData),

      attachments: [
        {
          filename: `Intelligence_Report_${leadData.companyName.replace(/\s+/g, '_')}.pdf`,
          path: reportPath
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('✓ Email sent successfully:', info.messageId);

    return {
      success: true,
      messageId: info.messageId,
      sentAt: new Date().toISOString(),
      recipient: leadData.email
    };

  } catch (error) {
    console.error('Email send error:', error);

    throw new Error(
      `Failed to send email: ${error.message}`
    );
  }
}

/**
 * Send notification email to admin
 */
async function sendAdminNotification(leadData, reportPath, status) {
  try {
    const transporter = createTransporter();

    const adminEmail =
      process.env.ADMIN_EMAIL || process.env.SMTP_USER;

    if (adminEmail === process.env.SMTP_USER) {
      console.log(
        'Admin notification skipped - no separate admin email configured'
      );
      return;
    }

    const mailOptions = {
      from: `"SimplifIQ" <${process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: `[SimplifIQ] New Lead: ${leadData.companyName}`,

      html: `
        <h2>New Lead Processed</h2>

        <p>
          <strong>Company:</strong>
          ${leadData.companyName}
        </p>

        <p>
          <strong>Contact:</strong>
          ${leadData.firstName} ${leadData.lastName}
        </p>

        <p>
          <strong>Email:</strong>
          ${leadData.email}
        </p>

        <p>
          <strong>Status:</strong>
          ${status}
        </p>

        <p>
          <strong>Processed at:</strong>
          ${new Date().toISOString()}
        </p>
      `
    };

    await transporter.sendMail(mailOptions);

    console.log('✓ Admin notification sent');

  } catch (error) {
    console.error('Admin notification error:', error);
  }
}

module.exports = {
  sendReportEmail,
  sendAdminNotification,
  generateEmailContent
};