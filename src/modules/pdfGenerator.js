/**
 * PDF Report Generation Module
 * Creates professional, comprehensive multi-page audit/report documents
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate personalized report PDF
 */
async function generateReport(leadData, enrichedData) {
  try {
    const reportFileName = `report_${leadData.email.replace(/[@.]/g, '_')}_${Date.now()}.pdf`;
    const reportPath = path.join(process.env.REPORTS_DIR || './reports', reportFileName);

    // Ensure reports directory exists
    if (!fs.existsSync(path.dirname(reportPath))) {
      fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    }

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 35,
        bufferPages: true
      });

      const stream = fs.createWriteStream(reportPath);

      doc.on('error', reject);
      stream.on('error', reject);

      doc.pipe(stream);

      // PAGE 1: Cover & Executive Summary
      addCoverPage(doc, leadData, enrichedData);
      
      // Check if we need a new page for content
      if (doc.y > 700) {
        doc.addPage();
      }

      // Executive Summary
      addSectionTitle(doc, 'Executive Summary');
      addExecutiveSummary(doc, leadData, enrichedData);

      // Company Overview
      addSectionTitle(doc, 'Company Overview');
      addCompanyProfile(doc, leadData, enrichedData);

      // Company Details & Background (if available)
      if (enrichedData.wikipediaInfo) {
        if (doc.y > 700) {
          doc.addPage();
        }
        addSectionTitle(doc, 'Company Background');
        addCompanyDetails(doc, enrichedData.wikipediaInfo);
      }

      // Business Focus & Areas of Work
      if (doc.y > 700) {
        doc.addPage();
      }
      addSectionTitle(doc, 'Areas of Work & Business Focus');
      addAreasOfWork(doc, leadData, enrichedData);

      // Market & Industry Analysis
      if (doc.y > 700) {
        doc.addPage();
      }
      addSectionTitle(doc, 'Market & Industry Analysis');
      addIndustryAnalysis(doc, leadData, enrichedData);

      // Recent Announcements & Developments
      if (enrichedData.newsArticles && enrichedData.newsArticles.length > 0) {
        if (doc.y > 700) {
          doc.addPage();
        }
        addSectionTitle(doc, 'Recent Announcements & Developments');
        addNewsSection(doc, enrichedData.newsArticles);
      }

      // Vision & Focus
      if (doc.y > 700) {
        doc.addPage();
      }
      addSectionTitle(doc, 'Vision, Mission & Strategic Focus');
      addVisionAndFocus(doc, leadData, enrichedData);

      // Competitive Analysis
      if (doc.y > 700) {
        doc.addPage();
      }
      addSectionTitle(doc, 'Competitive Position & Opportunities');
      addCompetitiveAnalysis(doc, enrichedData);

      // Strategic Recommendations
      if (doc.y > 700) {
        doc.addPage();
      }
      addSectionTitle(doc, 'Strategic Recommendations');
      addDetailedRecommendations(doc, leadData, enrichedData);

      // Data Sources
      if (doc.y > 700) {
        doc.addPage();
      }
      addSectionTitle(doc, 'Report Information & Data Sources');
      addDataSources(doc, enrichedData);

      // Footer on all pages
      addDynamicFooter(doc);

      doc.end();

      stream.on('finish', () => {
        resolve({
          success: true,
          fileName: reportFileName,
          filePath: reportPath,
          generatedAt: new Date().toISOString()
        });
      });
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error(`Failed to generate report: ${error.message}`);
  }
}

/**
 * Add professional cover page
 */
function addCoverPage(doc, leadData, enrichedData) {
  // Background color effect with rectangle
  doc.rect(0, 0, doc.page.width, doc.page.height).fill('#f8f9fa');
  
  doc.moveDown(2);
  
  // Main title
  doc.fontSize(28)
    .font('Helvetica-Bold')
    .fillColor('#2c3e50')
    .text('Company Intelligence Report', { align: 'center' });

  doc.moveDown(0.3);
  doc.fontSize(14)
    .font('Helvetica')
    .fillColor('#3498db')
    .text(leadData.companyName, { align: 'center' });

  doc.moveDown(0.2);
  doc.fontSize(10)
    .font('Helvetica')
    .fillColor('#7f8c8d')
    .text('Comprehensive Market & Business Analysis', { align: 'center' });

  // Divider
  doc.moveTo(60, doc.y + 15).lineTo(doc.page.width - 60, doc.y + 15).stroke('#3498db');
  
  doc.moveDown(2);

  // Key Information Box
  const boxX = 45;
  const boxY = doc.y;
  const boxWidth = doc.page.width - 90;
  const boxHeight = 100;

  doc.rect(boxX, boxY, boxWidth, boxHeight).stroke('#3498db');
  doc.fillColor('#f0f7ff').rect(boxX, boxY, boxWidth, boxHeight).fill();
  
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#2c3e50');
  doc.text('Report Information', boxX + 12, boxY + 10);
  
  doc.fontSize(9).font('Helvetica').fillColor('#333');
  doc.text(`Contact: ${leadData.firstName} ${leadData.lastName}`, boxX + 12, boxY + 28);
  doc.text(`Email: ${leadData.email}`, boxX + 12, boxY + 43);
  doc.text(`Industry: ${leadData.industry || 'Not Specified'}`, boxX + 12, boxY + 58);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`, boxX + 12, boxY + 73);

  doc.y = boxY + boxHeight + 15;

  doc.moveDown(1.5);
  
  doc.fontSize(8)
    .font('Helvetica')
    .fillColor('#95a5a6')
    .text('This report is confidential and prepared for the indicated recipient only.', { align: 'center', width: doc.page.width - 90 });
}

/**
 * Add section title with professional styling
 */
function addSectionTitle(doc, title) {
  // Only add spacing if not at top of page
  if (doc.y > 60) {
    doc.moveDown(0.06);
  }
  
  const titleY = doc.y;
  doc.fontSize(13)
    .font('Helvetica-Bold')
    .fillColor('#1a1a1a')
    .text(title);

  // Draw line below title
  const lineY = doc.y + 2;
  doc.moveTo(35, lineY)
    .lineTo(doc.page.width - 35, lineY)
    .stroke('#2c3e50');

  doc.moveDown(0.1);
}

/**
 * Add enhanced executive summary
 */
function addExecutiveSummary(doc, leadData, enrichedData) {
  doc.fontSize(10).font('Helvetica').fillColor('#333');

  const summaryText = `This comprehensive intelligence report provides an in-depth analysis of ${leadData.companyName}, including market positioning, competitive landscape, recent developments, and strategic opportunities. Based on extensive research from multiple authoritative sources including company websites, industry publications, news archives, and market analysis platforms.`;

  doc.text(summaryText, {
    align: 'left',
    width: doc.page.width - 70,
    lineGap: 1
  });

  doc.moveDown(0.08);
}

/**
 * Add company profile section
 */
function addCompanyProfile(doc, leadData, enrichedData) {
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#2c3e50').text('Organization Details:');
  doc.fontSize(10).font('Helvetica').fillColor('#333');
  doc.moveDown(0.04);

  const profileData = [
    ['Company:', leadData.companyName],
    ['Contact:', `${leadData.firstName} ${leadData.lastName}`],
    ['Email:', leadData.email],
    ['Phone:', leadData.phone || 'N/A'],
    ['Industry:', leadData.industry || 'Not Specified'],
    ['Size:', leadData.companySize || 'Not Specified'],
    ['Website:', enrichedData.original.website || enrichedData.domain || 'N/A']
  ];

  profileData.forEach(([label, value]) => {
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#555').text(label, { continued: true });
    doc.font('Helvetica').fillColor('#333').text(` ${value}`);
    doc.moveDown(0.04);
  });

  doc.moveDown(0.06);

  // Website metadata
  if (enrichedData.metadata) {
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#2c3e50').text('Digital Presence:');
    doc.fontSize(10).font('Helvetica').fillColor('#333').moveDown(0.04);

    if (enrichedData.metadata.description) {
      doc.text(`${enrichedData.metadata.description.substring(0, 100)}...`, {
        width: doc.page.width - 70,
        lineGap: 0.5
      });
    }

    if (enrichedData.metadata.socialLinks) {
      const socials = [];
      if (enrichedData.metadata.socialLinks.linkedin) socials.push('LinkedIn');
      if (enrichedData.metadata.socialLinks.twitter) socials.push('Twitter');
      if (enrichedData.metadata.socialLinks.facebook) socials.push('Facebook');
      
      if (socials.length > 0) {
        doc.moveDown(0.03);
        doc.text(`Social: ${socials.join(', ')}`);
      }
    }
  }
}

/**
 * Add detailed company background information
 */
function addCompanyDetails(doc, wikipediaInfo) {
  doc.fontSize(10).font('Helvetica').fillColor('#333');

  if (wikipediaInfo.company_type) {
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#2c3e50').text('Company Type:');
    doc.fontSize(10).font('Helvetica').fillColor('#333').text(wikipediaInfo.company_type);
    doc.moveDown(0.04);
  }

  if (wikipediaInfo.founding_info) {
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#2c3e50').text('Founding:');
    doc.fontSize(10).font('Helvetica').fillColor('#333').text(wikipediaInfo.founding_info);
    doc.moveDown(0.04);
  }

  doc.fontSize(10).font('Helvetica-Bold').fillColor('#2c3e50').text('Background:');
  doc.fontSize(10).font('Helvetica').fillColor('#333');
  doc.text(wikipediaInfo.content.substring(0, 200), {
    width: doc.page.width - 70,
    lineGap: 0.5
  });
}

/**
 * Add areas of work and business focus
 */
function addAreasOfWork(doc, leadData, enrichedData) {
  const industry = leadData.industry || 'Technology';
  
  const areasOfWork = {
    'Technology': ['Software Development', 'Cloud Computing', 'Artificial Intelligence', 'Cybersecurity', 'Enterprise Solutions'],
    'Finance': ['Investment Banking', 'Asset Management', 'Trading', 'Risk Management', 'Financial Advisory'],
    'Healthcare': ['Medical Services', 'Pharmaceuticals', 'Medical Devices', 'Healthcare IT', 'Clinical Research'],
    'Retail': ['E-commerce', 'Store Operations', 'Supply Chain', 'Customer Experience', 'Logistics'],
    'Energy': ['Renewable Energy', 'Oil & Gas', 'Power Generation', 'Infrastructure', 'Sustainability'],
    'Manufacturing': ['Production', 'Industrial Design', 'Supply Chain', 'Quality Control', 'Automation']
  };

  const workAreas = areasOfWork[industry] || ['Core Business Operations', 'Market Development', 'Strategic Initiatives', 'Innovation', 'Customer Service'];

  doc.fontSize(10).font('Helvetica').fillColor('#333');
  
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#2c3e50').text(`Primary Focus Areas (${industry} Sector):`);
  doc.moveDown(0.03);

  workAreas.slice(0, 5).forEach(area => {
    doc.text(`• ${area}`, { width: doc.page.width - 70 });
    doc.moveDown(0.03);
  });

  doc.moveDown(0.04);
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#2c3e50').text('Business Model:');
  doc.fontSize(10).font('Helvetica').fillColor('#333');
  doc.text(`${leadData.companyName} operates a comprehensive ${industry} business model focused on innovation, customer satisfaction, and operational excellence. The organization leverages modern technology and strategic partnerships to maintain market leadership.`, {
    width: doc.page.width - 70,
    lineGap: 0.5
  });
}

/**
 * Add vision, mission and strategic focus
 */
function addVisionAndFocus(doc, leadData, enrichedData) {
  doc.fontSize(10).font('Helvetica').fillColor('#333');

  doc.fontSize(10).font('Helvetica-Bold').fillColor('#2c3e50').text('Vision:');
  doc.fontSize(10).font('Helvetica').fillColor('#333');
  doc.text(`To be a leading global organization in the ${leadData.industry || 'Technology'} industry, delivering innovative solutions that transform businesses and create sustainable value.`, {
    width: doc.page.width - 70,
    lineGap: 0.5
  });
  doc.moveDown(0.04);

  doc.fontSize(10).font('Helvetica-Bold').fillColor('#2c3e50').text('Mission:');
  doc.fontSize(10).font('Helvetica').fillColor('#333');
  doc.text(`Empowering businesses through cutting-edge solutions, exceptional service delivery, and strategic partnerships. Committed to driving digital transformation and operational efficiency.`, {
    width: doc.page.width - 70,
    lineGap: 0.5
  });
  doc.moveDown(0.04);

  doc.fontSize(10).font('Helvetica-Bold').fillColor('#2c3e50').text('Strategic Focus:');
  doc.fontSize(10).font('Helvetica').fillColor('#333');
  doc.moveDown(0.03);

  const focusAreas = [
    'Innovation and R&D Investment',
    'Customer-Centric Solutions',
    'Digital Transformation',
    'Sustainability and ESG Initiatives',
    'Market Expansion and Growth'
  ];

  focusAreas.forEach(focus => {
    doc.text(`• ${focus}`, { width: doc.page.width - 70 });
    doc.moveDown(0.03);
  });
}

/**
 * Add industry analysis section
 */
function addIndustryAnalysis(doc, leadData, enrichedData) {
  const industryData = enrichedData.industryInsights;
  
  if (!industryData) {
    doc.fontSize(10).font('Helvetica').fillColor('#555').text('Industry analysis data compiled from multiple sources.');
    return;
  }

  doc.fontSize(11).font('Helvetica-Bold').fillColor('#2c3e50').text('Market Trends:');
  doc.fontSize(10).font('Helvetica').fillColor('#333').moveDown(0.04);

  if (industryData.marketTrends) {
    industryData.marketTrends.slice(0, 4).forEach(trend => {
      doc.text(`• ${trend}`, { width: doc.page.width - 70 });
      doc.moveDown(0.03);
    });
  }

  doc.moveDown(0.04);
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#2c3e50').text('Industry Outlook:');
  doc.fontSize(10).font('Helvetica').fillColor('#333').moveDown(0.03);

  const industryText = `The ${leadData.industry || 'technology'} industry continues to evolve with increasing focus on digital innovation, customer-centric solutions, and operational efficiency.`;
  
  doc.text(industryText, {
    width: doc.page.width - 70,
    lineGap: 0.5
  });
}

/**
 * Add news and recent developments
 */
function addNewsSection(doc, newsArticles) {
  doc.fontSize(10).font('Helvetica').fillColor('#333').moveDown(0.03);

  newsArticles.slice(0, 4).forEach((article, index) => {
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#2c3e50');
    doc.text(`${index + 1}. ${article.title.substring(0, 75)}`, { width: doc.page.width - 70 });
    
    doc.fontSize(9).font('Helvetica').fillColor('#7f8c8d');
    doc.text(`Source: ${article.source}`, { width: doc.page.width - 70 });
    
    doc.moveDown(0.04);
  });
}

/**
 * Add competitive analysis
 */
function addCompetitiveAnalysis(doc, enrichedData) {
  const competitiveData = enrichedData.industryInsights;

  doc.fontSize(11).font('Helvetica-Bold').fillColor('#2c3e50').text('Competitive Position:');
  doc.fontSize(10).font('Helvetica').fillColor('#333').moveDown(0.04);

  if (competitiveData && competitiveData.competitiveInsights) {
    competitiveData.competitiveInsights.slice(0, 3).forEach(insight => {
      doc.text(`• ${insight}`, { width: doc.page.width - 70 });
      doc.moveDown(0.04);
    });
  } else {
    doc.text('• Company operates in competitive market landscape', { width: doc.page.width - 70 });
    doc.moveDown(0.04);
    doc.text('• Market consolidation presents opportunities', { width: doc.page.width - 70 });
  }

  doc.moveDown(0.04);
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#2c3e50').text('Growth Opportunities:');
  doc.fontSize(10).font('Helvetica').fillColor('#333').moveDown(0.04);

  if (competitiveData && competitiveData.growthOpportunities) {
    competitiveData.growthOpportunities.slice(0, 3).forEach(opportunity => {
      doc.text(`• ${opportunity}`, { width: doc.page.width - 70 });
      doc.moveDown(0.04);
    });
  }
}

/**
 * Add detailed strategic recommendations
 */
function addDetailedRecommendations(doc, leadData, enrichedData) {
  const recommendations = [
    {
      title: 'Strategic Market Engagement',
      description: `Develop a tailored strategy aligned with ${leadData.companyName}'s objectives.`
    },
    {
      title: 'Personalized Value Proposition',
      description: `Create solutions specific to the ${leadData.industry || 'their'} sector.`
    },
    {
      title: 'Data-Driven Approach',
      description: 'Leverage market research to refine engagement strategies.'
    },
    {
      title: 'Partnership & Collaboration',
      description: 'Explore synergies that create mutual value and growth.'
    }
  ];

  recommendations.forEach((rec, index) => {
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#2c3e50');
    doc.text(`${index + 1}. ${rec.title}`);
    
    doc.fontSize(9).font('Helvetica').fillColor('#333').moveDown(0.03);
    doc.text(rec.description, { width: doc.page.width - 70 });
    
    doc.moveDown(0.04);
  });
}

/**
 * Add data sources and verification
 */
function addDataSources(doc, enrichedData) {
  doc.fontSize(10).font('Helvetica').fillColor('#333');
  doc.moveDown(0.02);

  doc.fontSize(10).font('Helvetica-Bold').fillColor('#2c3e50').text('Research Sources:');
  doc.fontSize(10).font('Helvetica').fillColor('#333').moveDown(0.03);

  const sources = [
    'Company Website & Official Documentation',
    'Wikipedia & Corporate Information',
    'News Archives & Media Publications',
    'Industry Research & Market Analysis',
    'Public Business Information'
  ];

  sources.forEach(source => {
    doc.text(`• ${source}`, { width: doc.page.width - 70 });
    doc.moveDown(0.03);
  });

  doc.moveDown(0.04);
  
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#2c3e50').text('Report Disclaimer:');
  doc.fontSize(9).font('Helvetica').fillColor('#555');
  const disclaimerText = 'This report is compiled from publicly available information representing a point-in-time analysis. Information accuracy and completeness cannot be guaranteed. Recommendations should be validated through direct engagement and additional due diligence with the target organization.';
  
  doc.text(disclaimerText, {
    width: doc.page.width - 70,
    align: 'left',
    lineGap: 0.5
  });

  doc.moveDown(0.03);
  doc.fontSize(8).font('Helvetica').fillColor('#999').text(`Report Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`);
}

/**
 * Add footer to each page dynamically
 */
function addDynamicFooter(doc) {
  const pages = doc.bufferedPageRange().count;
  
  for (let i = 0; i < pages; i++) {
    const pageHeight = doc.page.height;
    const footerY = pageHeight - 25;

    doc.fontSize(7)
      .fillColor('#999')
      .text('SimplifIQ © 2024 - Confidential', 45, footerY, { align: 'left' });

    doc.fontSize(7)
      .fillColor('#999')
      .text(`${i + 1}/${pages}`, doc.page.width - 65, footerY, { align: 'right', width: 20 });
  }
}

module.exports = {
  generateReport
};
