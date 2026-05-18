/**
 * SimplifIQ Lead Automation Server
 * Main application entry point
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Import modules
const leadsRouter = require('./src/services/leads');
const { initializeGoogleAuth, ensureSheetHeaders } = require('./src/modules/googleServices');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

/**
 * Middleware Configuration
 */

// CORS
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') 
    : '*',
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Request Logging Middleware
 */
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

/**
 * API Routes
 */
app.use('/api/leads', leadsRouter);

/**
 * Root endpoint - serve form
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/**
 * Error Handling Middleware
 */
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

/**
 * 404 Handler
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

/**
 * Initialize Application
 */
async function initialize() {
  try {
    console.log('🚀 SimplifIQ Lead Automation System Starting...\n');

    // Check required directories
    const requiredDirs = [
      process.env.REPORTS_DIR || './reports',
      process.env.TEMP_DIR || './temp'
    ];

    for (const dir of requiredDirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✓ Created directory: ${dir}`);
      }
    }

    // Check environment configuration
    console.log('\n📋 Configuration Status:');
    
    if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
      console.log('✓ Email service configured');
    } else {
      console.log('⚠ Email service not configured (leads will not be sent)');
    }

    if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE || fs.existsSync('./.gcp-service-account.json')) {
      console.log('📍 Initializing Google Services...');
      const authSuccess = await initializeGoogleAuth();
      if (authSuccess) {
        console.log('✓ Google integration configured');
        if (process.env.GOOGLE_SHEETS_ID) {
          console.log('✓ Google Sheets logging enabled');
          await ensureSheetHeaders();
        } else {
          console.log('⚠ Google Sheets ID not configured (logging disabled)');
        }
        if (process.env.GOOGLE_DRIVE_FOLDER_ID) {
          console.log('✓ Google Drive archiving enabled');
        } else {
          console.log('⚠ Google Drive Folder ID not configured (archiving disabled)');
        }
      } else {
        console.log('⚠ Google services initialization failed');
      }
    } else {
      console.log('⚠ Google service account key not found (bonus features disabled)');
    }


    console.log('\n' + '='.repeat(50));
    console.log('Server Configuration:');
    console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`  Port: ${PORT}`);
    console.log(`  Reports Directory: ${process.env.REPORTS_DIR || './reports'}`);
    console.log('='.repeat(50) + '\n');

    // Start server
    app.listen(PORT, () => {
      console.log(`✓ Server running on http://localhost:${PORT}`);
      console.log(`✓ Form available at http://localhost:${PORT}`);
      console.log(`✓ API endpoint: http://localhost:${PORT}/api/leads/submit\n`);
    });
  } catch (error) {
    console.error('❌ Initialization error:', error);
    process.exit(1);
  }
}

/**
 * Graceful Shutdown
 */
process.on('SIGTERM', () => {
  console.log('\n📍 SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n📍 SIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Start application
initialize();

module.exports = app;
