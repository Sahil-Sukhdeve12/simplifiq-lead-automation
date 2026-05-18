/**
 * Google Services Module
 * Integration with Google Sheets and Google Drive for logging and archiving
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

let auth = null;
let sheets = null;
let drive = null;
let isInitialized = false;

/**
 * Initialize Google Auth using Service Account
 */
async function initializeGoogleAuth() {
  try {
    // Check for service account key file
    const keyFilePath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE || './.gcp-service-account.json';
    
    if (!fs.existsSync(keyFilePath)) {
      console.warn('Google Service Account key file not found:', keyFilePath);
      console.warn('Google integrations will be skipped.');
      return false;
    }

    // Load service account credentials
    const keyFileContent = fs.readFileSync(keyFilePath);
    const serviceAccount = JSON.parse(keyFileContent);

    console.log('Service Account Email:', serviceAccount.client_email);

    // Create JWT auth
    auth = new google.auth.JWT(
      serviceAccount.client_email,
      null,
      serviceAccount.private_key,
      [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file'  // Allows file-specific access
      ]
    );

    // Authorize
    await auth.authorize();

    // Initialize Google Sheets and Drive APIs
    sheets = google.sheets({ version: 'v4', auth });
    drive = google.drive({ version: 'v3', auth });

    isInitialized = true;
    console.log('✓ Google Services initialized successfully');
    console.log('✓ Make sure to share your Google Drive folder with:', serviceAccount.client_email);
    console.log('✓ Make sure to share your Google Sheet with:', serviceAccount.client_email);
    return true;
  } catch (error) {
    console.error('Google Auth initialization error:', error.message);
    console.warn('Google integrations will be skipped.');
    return false;
  }
}

/**
 * Log lead data to Google Sheet
 */
async function logLeadToSheet(leadData, reportStatus) {
  try {
    if (!isInitialized || !sheets || !process.env.GOOGLE_SHEETS_ID) {
      console.warn('Google Sheets not initialized. Skipping lead logging.');
      return { success: false, reason: 'Google Sheets not configured' };
    }

    const timestamp = new Date().toISOString();
    const values = [[
      leadData.firstName || '',
      leadData.lastName || '',
      leadData.email || '',
      leadData.companyName || '',
      leadData.industry || 'N/A',
      leadData.companySize || 'N/A',
      reportStatus || 'pending',
      timestamp
    ]];

    const request = {
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: 'Sheet1!A:H',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values
      }
    };

    const response = await sheets.spreadsheets.values.append(request);

    console.log('Lead logged to Google Sheets:', {
      company: leadData.companyName,
      status: reportStatus,
      range: response.data.updates.updatedRange
    });

    return {
      success: true,
      updatedRange: response.data.updates.updatedRange,
      updatedRows: response.data.updates.updatedRows
    };
  } catch (error) {
    console.error('Google Sheets logging error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Archive PDF to Google Drive
 */
async function archivePDFToGoogleDrive(reportPath, leadData) {
  try {
    if (!isInitialized) {
      console.warn('Google Drive API not initialized.');
      return { success: false, reason: 'Google Drive API not initialized' };
    }

    if (!drive) {
      console.warn('Google Drive service not available.');
      return { success: false, reason: 'Google Drive service unavailable' };
    }

    if (!process.env.GOOGLE_DRIVE_FOLDER_ID) {
      console.warn('GOOGLE_DRIVE_FOLDER_ID not configured in .env');
      return { success: false, reason: 'GOOGLE_DRIVE_FOLDER_ID not configured' };
    }

    // Check if file exists
    if (!fs.existsSync(reportPath)) {
      console.error(`Report file not found: ${reportPath}`);
      return { success: false, reason: `Report file not found: ${reportPath}` };
    }

    const fileName = `${leadData.companyName}_Report_${leadData.email.replace(/[@.]/g, '_')}_${Date.now()}.pdf`;
    
    console.log('Uploading to Google Drive:', {
      fileName,
      folderId: process.env.GOOGLE_DRIVE_FOLDER_ID,
      filePath: reportPath,
      fileSize: fs.statSync(reportPath).size
    });

    const fileMetadata = {
      name: fileName,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
      mimeType: 'application/pdf'
    };

    const media = {
      mimeType: 'application/pdf',
      body: fs.createReadStream(reportPath)
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media,
      fields: 'id, webViewLink, name, size, createdTime'
    });

    console.log('✓ PDF successfully archived to Google Drive:', {
      fileName: response.data.name,
      fileId: response.data.id,
      fileSize: response.data.size,
      link: response.data.webViewLink,
      createdTime: response.data.createdTime
    });

    return {
      success: true,
      fileId: response.data.id,
      fileName: response.data.name,
      webViewLink: response.data.webViewLink,
      fileSize: response.data.size
    };
  } catch (error) {
    console.error('✗ Google Drive archiving error:', {
      message: error.message,
      code: error.code,
      status: error.status,
      details: error.errors ? error.errors[0] : 'No additional details'
    });
    
    // Log specific error types
    if (error.message.includes('Permission denied')) {
      console.error('ERROR: Service account does not have permission to write to this folder.');
      console.error('ACTION: Share the Google Drive folder with the service account email shown during server startup.');
    } else if (error.message.includes('Not Found')) {
      console.error('ERROR: Folder not found. Check GOOGLE_DRIVE_FOLDER_ID in .env');
      console.error('Your GOOGLE_DRIVE_FOLDER_ID:', process.env.GOOGLE_DRIVE_FOLDER_ID);
    } else if (error.message.includes('Unauthorized')) {
      console.error('ERROR: Authentication failed. Check service account credentials.');
    }

    return {
      success: false,
      error: error.message,
      errorCode: error.code
    };
  }
}

/**
 * Create headers row in Google Sheet if not exists
 */
async function ensureSheetHeaders() {
  try {
    if (!isInitialized || !sheets || !process.env.GOOGLE_SHEETS_ID) {
      console.warn('Google Sheets not initialized. Skipping header check.');
      return;
    }

    const request = {
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: 'Sheet1!1:1'
    };

    const response = await sheets.spreadsheets.values.get(request);

    if (!response.data.values || response.data.values.length === 0) {
      const headers = [[
        'First Name',
        'Last Name',
        'Email',
        'Company Name',
        'Industry',
        'Company Size',
        'Report Status',
        'Timestamp'
      ]];

      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SHEETS_ID,
        range: 'Sheet1!A1:H1',
        valueInputOption: 'USER_ENTERED',
        resource: { values: headers }
      });

      console.log('Google Sheet headers created');
    }
  } catch (error) {
    console.error('Sheet header initialization error:', error.message);
  }
}

/**
 * Get initialization status
 */
function isGoogleInitialized() {
  return isInitialized;
}

module.exports = {
  initializeGoogleAuth,
  logLeadToSheet,
  archivePDFToGoogleDrive,
  ensureSheetHeaders,
  isGoogleInitialized
};
