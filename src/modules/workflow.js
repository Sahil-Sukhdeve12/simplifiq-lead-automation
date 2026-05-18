/**
 * Lead Processing Workflow Orchestrator
 * Orchestrates the complete end-to-end lead automation process
 */

const { v4: uuidv4 } = require('uuid');
const { validateLead } = require('./validation');
const { enrichCompanyData } = require('./enrichment');
const { generateReport } = require('./pdfGenerator');
const { sendReportEmail, sendAdminNotification } = require('./emailService');
const { logLeadToSheet, archivePDFToGoogleDrive } = require('./googleServices');

/**
 * Process lead through complete workflow
 */
async function processLead(formData) {
  const leadId = uuidv4();
  const startTime = Date.now();

  const result = {
    leadId,
    status: 'processing',
    steps: [],
    errors: [],
    timing: {}
  };

  try {
    // Step 1: Validate Lead
    console.log(`[${leadId}] Starting lead processing...`);
    const validationStart = Date.now();

    const validation = validateLead(formData);
    result.timing.validation = Date.now() - validationStart;

    if (!validation.valid) {
      result.status = 'failed';
      result.errors = validation.errors;
      result.steps.push({
        name: 'Validation',
        status: 'failed',
        errors: validation.errors
      });
      return result;
    }

    const leadData = validation.data;
    result.steps.push({
      name: 'Validation',
      status: 'completed',
      duration: result.timing.validation
    });
    console.log(`[${leadId}] ✓ Lead validated`);

    // Step 2: Enrich Company Data
    console.log(`[${leadId}] Enriching company data...`);
    const enrichmentStart = Date.now();

    const enrichedData = await enrichCompanyData(leadData);
    result.timing.enrichment = Date.now() - enrichmentStart;
    result.steps.push({
      name: 'Data Enrichment',
      status: 'completed',
      duration: result.timing.enrichment,
      sourcesUsed: {
        websiteScraping: enrichedData.metadata ? 'success' : 'failed',
        clearbit: enrichedData.clearbitData ? 'success' : 'not_available'
      }
    });
    console.log(`[${leadId}] ✓ Company data enriched`);

    // Step 3: Generate PDF Report
    console.log(`[${leadId}] Generating PDF report...`);
    const pdfStart = Date.now();

    const reportInfo = await generateReport(leadData, enrichedData);
    result.timing.pdfGeneration = Date.now() - pdfStart;
    result.steps.push({
      name: 'PDF Report Generation',
      status: 'completed',
      duration: result.timing.pdfGeneration,
      reportPath: reportInfo.filePath
    });
    console.log(`[${leadId}] ✓ PDF report generated`);

    // Step 4: Send Email (Optional - non-blocking)
    console.log(`[${leadId}] Sending report email...`);
    const emailStart = Date.now();

    let emailStatus = 'skipped';
    let emailError = null;
    try {
      const emailResult = await sendReportEmail(leadData, reportInfo.filePath);
      result.timing.emailDelivery = Date.now() - emailStart;
      result.steps.push({
        name: 'Email Delivery',
        status: 'completed',
        duration: result.timing.emailDelivery,
        messageId: emailResult.messageId,
        recipient: emailResult.recipient
      });
      console.log(`[${leadId}] ✓ Email sent to ${leadData.email}`);
      emailStatus = 'completed';
    } catch (emailErr) {
      result.timing.emailDelivery = Date.now() - emailStart;
      emailError = emailErr.message;
      result.steps.push({
        name: 'Email Delivery',
        status: 'failed',
        duration: result.timing.emailDelivery,
        error: emailErr.message
      });
      console.log(`[${leadId}] ⚠ Email delivery failed (non-blocking): ${emailErr.message}`);
    }

    // Step 5: Log to Google Sheets (Bonus - non-blocking)
    console.log(`[${leadId}] Logging lead to Google Sheets...`);
    const sheetsStart = Date.now();

    try {
      const sheetsResult = await logLeadToSheet(leadData, emailStatus === 'completed' ? 'completed' : 'completed-no-email');
      result.timing.sheetsLogging = Date.now() - sheetsStart;
      result.steps.push({
        name: 'Google Sheets Logging',
        status: sheetsResult.success ? 'completed' : 'skipped',
        duration: result.timing.sheetsLogging
      });
      if (sheetsResult.success) {
        console.log(`[${leadId}] ✓ Lead logged to Google Sheets`);
      }
    } catch (sheetsErr) {
      result.timing.sheetsLogging = Date.now() - sheetsStart;
      result.steps.push({
        name: 'Google Sheets Logging',
        status: 'skipped',
        duration: result.timing.sheetsLogging,
        error: sheetsErr.message
      });
      console.log(`[${leadId}] ⚠ Google Sheets logging skipped: ${sheetsErr.message}`);
    }

    // Step 6: Archive PDF to Google Drive (Bonus - non-blocking)
    console.log(`[${leadId}] Archiving PDF to Google Drive...`);
    const driveStart = Date.now();

    try {
      const driveResult = await archivePDFToGoogleDrive(reportInfo.filePath, leadData);
      result.timing.driveArchiving = Date.now() - driveStart;
      result.steps.push({
        name: 'Google Drive Archiving',
        status: driveResult.success ? 'completed' : 'skipped',
        duration: result.timing.driveArchiving,
        fileId: driveResult.fileId
      });
      if (driveResult.success) {
        console.log(`[${leadId}] ✓ PDF archived to Google Drive`);
      }
    } catch (driveErr) {
      result.timing.driveArchiving = Date.now() - driveStart;
      result.steps.push({
        name: 'Google Drive Archiving',
        status: 'skipped',
        duration: result.timing.driveArchiving,
        error: driveErr.message
      });
      console.log(`[${leadId}] ⚠ Google Drive archiving skipped: ${driveErr.message}`);
    }

    // Mark as complete
    result.status = 'completed';
    result.timing.total = Date.now() - startTime;

    console.log(`[${leadId}] ✓ Lead processing completed in ${result.timing.total}ms`);

    return result;
  } catch (error) {
    result.status = 'failed';
    result.errors.push(error.message);
    console.error(`[${leadId}] ✗ Lead processing failed:`, error.message);

    try {
      // Attempt to log failure
      await logLeadToSheet(
        formData,
        `failed: ${error.message}`
      );
    } catch (logError) {
      console.error('Failed to log error to sheets:', logError);
    }

    return result;
  }
}

module.exports = {
  processLead
};
