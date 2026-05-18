/**
 * API Routes
 * Handles lead submission and status endpoints
 */

const express = require('express');
const router = express.Router();
const { processLead } = require('../modules/workflow');

/**
 * POST /api/leads/submit
 * Submit a new lead for processing
 */
router.post('/submit', async (req, res) => {
  try {
    const formData = req.body;

    // Log incoming request
    console.log('Lead submission received:', {
      companyName: formData.companyName,
      email: formData.email,
      timestamp: new Date().toISOString()
    });
    console.log('Full form data:', formData);

    // Start processing
    const result = await processLead(formData);

    // Log processing result
    if (result.status !== 'completed') {
      console.log('Processing errors:', result.errors);
      console.log('Processing details:', result.steps);
    }

    // Return appropriate response
    if (result.status === 'completed') {
      res.status(200).json({
        success: true,
        message: 'Lead processed successfully',
        leadId: result.leadId,
        details: result
      });
    } else if (result.status === 'processing') {
      res.status(202).json({
        success: true,
        message: 'Lead is being processed',
        leadId: result.leadId,
        details: result
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Lead processing failed',
        leadId: result.leadId,
        errors: result.errors,
        details: result
      });
    }
  } catch (error) {
    console.error('Route error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during lead processing',
      error: error.message
    });
  }
});



module.exports = router;
