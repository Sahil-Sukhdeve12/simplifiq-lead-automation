# SimplifIQ - Assumptions, Tradeoffs & Limitations

Technical decisions, architectural tradeoffs, and known system constraints for the SimplifIQ Lead Automation System.

---

## Core Assumptions

### Environment
- Node.js v18+ required (tested on v22.7.0)
- Cross-platform support: Windows, macOS, Linux
- Internet connectivity required for enrichment APIs
- Port `3000` available during development

### External Services
- Wikipedia and Google News APIs are accessible
- Google Sheets & Drive APIs are configured correctly
- Gmail SMTP credentials are valid

### User Data
- Users provide valid company and email information
- Companies have some public web presence

---

## Key Design Tradeoffs

| Decision | Chosen Approach | Benefit | Tradeoff |
|----------|----------------|---------|----------|
| Data Enrichment | Real-time fetching | Fresh data | Slower responses |
| Storage | In-memory Map | Zero DB setup | No persistence |
| Email Workflow | Non-blocking | Better UX | No retry handling |
| PDF Generation | PDFKit | Fast native PDFs | Manual layout control |
| Validation | Joi schemas | Safer input handling | Small performance overhead |

---

## System Limitations

### Current Technical Constraints
- Processing history resets on server restart
- Single-server architecture only
- No authentication system implemented
- No email bounce tracking
- English-only Wikipedia enrichment
- No rate limiting protection

### Google Integration Constraints
- Service accounts require Shared Drives
- Personal Google Drive folders are unsupported

### Performance Constraints
- Average processing time: 5–15 seconds
- PDF generation: ~150–250 KB per report
- Optimized for low-to-medium traffic workloads

---

## Security Considerations

### Current Protections
- `.env` and service account files excluded via `.gitignore`
- Joi input validation implemented
- Credentials stored server-side only

### Missing Production Security
- No HTTPS/TLS
- No CSRF protection
- No authentication/authorization layer
- No secret rotation strategy

---

## Production Readiness Gaps

The current version is suitable for:
- MVP development
- Demo environments
- Small-scale internal usage

Production deployment would require:
- Database integration
- Authentication system
- Rate limiting
- HTTPS setup
- Monitoring/logging
- Background job processing

---

## Future Improvements

### High Priority
- PostgreSQL/MongoDB integration
- Authentication & authorization
- Rate limiting middleware
- Error monitoring (Sentry)
- Redis caching layer

### Medium Priority
- Batch lead processing
- CRM integrations
- AI-generated insights
- Report template customization

### Long-Term
- Multi-tenant architecture
- Advanced analytics dashboard
- Kubernetes deployment
- AI lead scoring

---

## Technical Debt

| Issue | Severity |
|------|----------|
| In-memory storage | High |
| No authentication | High |
| Single-server architecture | High |
| No monitoring | Medium |
| No email bounce handling | Medium |
| English-only enrichment | Low |

---

## Architecture Evolution

```text
MVP
 → Express.js + In-memory storage

Production
 → Database + Auth + Monitoring

Scalable Platform
 → Redis + Queues + Background Workers

Enterprise
 → Microservices + AI + Multi-tenancy