# SimplifIQ - Lead Automation System

Automated lead intake, company intelligence, and professional PDF report generation.

![Node.js](https://img.shields.io/badge/Node.js-22-green)
![Express](https://img.shields.io/badge/Express-4.x-black)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## Features

- Automated lead capture & validation
- Company enrichment using web research
- Professional multi-page PDF reports
- Email delivery with attachments
- Google Sheets lead logging
- Google Drive PDF archiving
- Real-time processing status tracking

---

## Tech Stack

### Backend
- Node.js
- Express.js
- PDFKit
- Joi
- Axios
- Nodemailer
- Google APIs

### Frontend
- HTML5
- CSS3
- JavaScript

---

## Architecture

```text
User Form Submission
        ↓
Input Validation
        ↓
Company Data Enrichment
        ↓
PDF Report Generation
        ↓
Email / Google Integrations
        ↓
Lead Tracking & Storage
```

---

## Working Module

<p align="center">
  <img src="https://github.com/user-attachments/assets/db8189fa-0ad3-4920-a1c0-df96d6791c6a" width="700"/>
</p>

---

## Installation & Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-username/simplifiq-lead-automation.git
cd simplifiq-lead-automation
```

---

### 2. Install Dependencies

```bash
npm install
```

---

### 3. Create Environment Variables

Create a `.env` file in the root directory.

```env
PORT=3000

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Google Integration (Optional)
GOOGLE_SHEETS_ID=your-sheet-id
GOOGLE_DRIVE_FOLDER_ID=your-folder-id
GOOGLE_SERVICE_ACCOUNT_KEY_FILE=./.gcp-service-account.json
```

---

### 4. Start Development Server

```bash
npm run dev
```

Or:

```bash
npm start
```

---

### 5. Open in Browser

```bash
http://localhost:3000
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Serve form |

---

## Future Enhancements

- AI-powered lead scoring
- CRM integrations
- Advanced analytics dashboard
- WhatsApp & Slack notifications
- Multi-language support

---

## License

MIT License
