import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import handlebars from 'handlebars';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const appEnv = process.env.APP_ENV || 'local';

let envFile = '.env.local';

if (appEnv === 'uat') {
  envFile = '.env.uat';
} else if (appEnv === 'production') {
  envFile = '.env.production';
}
const generatePDF = async (templateName, data) => {
  try {
    const templatePath = path.join(
      __dirname,
      '../modules/pdfTemplates',
      `${templateName}.hbs`
    );
    //const templatePath = path.resolve(__dirname, `${templateName}.hbs`);
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    const template = handlebars.compile(templateContent);
    const html = template(data);
    const configuredExecutablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    const fallbackExecutablePath = envFile === '.env.production'
      ? '/snap/chromium/current/usr/lib/chromium-browser/chrome'
      : envFile === '.env.uat'
        ? '/usr/bin/chromium-browser'
        : undefined;
    const executablePath = configuredExecutablePath || fallbackExecutablePath;
    const launchOptions = {
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    };

    if (executablePath) {
      launchOptions.executablePath = executablePath;
    }

    if (executablePath && !fs.existsSync(executablePath)) {
      throw new Error(`Configured Chromium executable was not found: ${executablePath}`);
    }

    const browser = await puppeteer.launch(launchOptions);
        const headerTemplateContent = `
  <div style="width:100%; font-size:12px; padding:5px 20px; box-sizing:border-box;"> <!-- changed padding -->
    <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
      
      <div style="display:flex; flex-direction:column; font-size:12px; line-height:1.2;">
        <div>{{outlet.outletName}}{{#if includeFranchise}}, Franchise of TVS Automobile Solutions Private Limited{{/if}}</div>
        <div>{{outlet.address}},</div>
        <div>{{outlet.city}}, {{outlet.state}}, {{outlet.pincode}}</div>
        <div>Mobile: {{outlet.mobile}}</div>
      </div>

      <div style="display:flex; align-items:center; justify-content:flex-end;">
        <img src="data:image/png;base64,{{base64Logo}}" style="height:30px; width:100px; object-fit:contain; margin-left:20px;"/>
      </div>

    </div>

    <div style="width:100%; height:1px; background-color:#000; margin-top:5px;"></div>
  </div>
`;
    const headerTemplate = handlebars.compile(headerTemplateContent);
    const renderedHeader = headerTemplate(data);



    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    const defaultPdfOptions = {
      format: 'A4',
      printBackground: true,
      margin: {
        top: '50px',
        bottom: '50px',
        left: '50px',
        right: '50px',
      },
    };

    const pdfOptions = { ...defaultPdfOptions };

    if (data.showHeaderAllPages) {
      pdfOptions.displayHeaderFooter = true;
      pdfOptions.headerTemplate = renderedHeader;
      pdfOptions.footerTemplate = `
        <div style="width:100%; font-size:10px; text-align:center;">
          Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>
      `;
      pdfOptions.margin.top = '120px';   
      pdfOptions.margin.bottom = '60px';  
    }

    const pdfBuffer = await page.pdf(pdfOptions);
    await browser.close();

    return pdfBuffer;
  } catch (error) {
    throw new Error('Error generating PDF: ' + error.message);
  }
};

const PdfUtility = {
  generatePDF,
};
export default PdfUtility;
