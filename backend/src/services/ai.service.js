const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");
const puppeteer = require("puppeteer");


const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY,
});


const interviewReportSchema = z.object({

    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job requirements, based on the resume, self-description, and job description"),



    technicalQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked during the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this quetion"),
        answer: z.string().describe("how to answer this question, what points to cover, what approach to take, etc")
    })).describe("Technical questions that can be asked during the interview, along with their intention and how to answer them"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked during the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this quetion"),
        answer: z.string().describe("how to answer this question, what points to cover, what approach to take, etc")
    })).describe("Behavioral questions that can be asked during the interview, along with their intention and how to answer them"),

    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z.enum(['low', 'medium', 'high']).describe("The severity of the skill gap, i.e., how important is this skill for the job and how much it can impact the candidate's chances")
    })).describe("list of skill gaps in the candidate's profile along with their severity"),

    preparationPlan: z.array(z.object({
        day: z.number().describe("The day number in the preparation plan, starting from 1"),
        focus: z.string().describe("The main focus area for this day of preparation, e.g., data structures, system design, mock interviews etc"),
        tasks: z.array(z.string()).describe("List of tasks to be done on this day to prepare for the interview, e.g., read a specific book or article, solve a set of problems, watch a video etc")
    })).describe("A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively"),
    title: z.string().describe("The title of the job for which the interview report is generated"),
})


async function generateInterviewReport({ resume, selfDescription, jobDescription }) {

    const prompt = `Generate an interview report for a candidate based with the following details:
    Resume: ${resume}
    Self Description: ${selfDescription}
    Job Description: ${jobDescription}
    `

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(interviewReportSchema)
        }

    })

    const result = JSON.parse(response.text);
    // console.log(result);
    return result;
}


async function generatePdfFromHtml(htmlContent) {
    let browser = null
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        })
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: "networkidle0" })

        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            preferCSSPageSize: false,
            margin: {
                top: "10mm",
                bottom: "10mm",
                left: "10mm",
                right: "10mm"
            }
        })

        return Buffer.from(pdfBuffer)
    } finally {
        if (browser) {
            await browser.close()
        }
    }
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {
    const resumePdfSchema = z.object({
        html: z.string().describe("The complete HTML content of the resume including embedded CSS styles, ready to be rendered to PDF via puppeteer")
    })

    const prompt = `You are a world-class professional resume writer. Create a highly polished, ATS-optimized resume as a self-contained HTML document.

CANDIDATE DATA:
---
Resume: ${resume}
Self Description: ${selfDescription}
Job Description: ${jobDescription}
---

CONTENT RULES:
- Analyze the job description for keywords, skills, and qualifications. Align all content to the target role.
- Use strong action verbs (Architected, Spearheaded, Optimized, Delivered, Engineered) to start bullets.
- Quantify achievements (e.g., "Reduced latency by 40%", "Managed 5-member team").
- Write a compelling 2-3 sentence professional summary positioning the candidate as an ideal fit.
- Tone: natural, confident, human. Never robotic or generic.
- Keep it concise — 1 page ideal, 2 pages maximum.

SECTION ORDER:
1. Full Name (large, bold, centered)
2. Contact line (email | phone | LinkedIn/portfolio — single line, centered, separated by pipes)
3. Professional Summary
4. Technical Skills (inline comma-separated or grouped by category on one line each)
5. Work Experience (reverse chronological; role, company, duration on one line; 3-5 tight bullet points)
6. Projects (title + tech stack on one line, 1-2 sentence description)
7. Education (degree, institution, year, GPA — all on 1-2 compact lines per entry)
8. Certifications / Achievements (if applicable)

MANDATORY HTML/CSS RULES — YOU MUST FOLLOW ALL OF THESE:

1. Return a COMPLETE <!DOCTYPE html> document. ALL CSS must be inside a single <style> tag in <head>.
2. Font stack: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif.
3. Font sizes: name 22pt, section headers 12pt uppercase with letter-spacing 1.5px, body 10pt, sub-labels 9pt.
4. Colors: body text #333333, section headers #1a5276, name #1a5276, lines/borders #1a5276.
5. Section headers: uppercase, bold, with a 1.5px solid #1a5276 bottom-border. margin-top: 10px, margin-bottom: 4px.
6. Body line-height: 1.4. Paragraph/list margins: 0. Padding: 0.
7. Keep ALL spacing tight and compact — no large gaps anywhere. Use margin-bottom: 2px to 6px between items.
8. For education entries: put degree and year on the SAME line using flexbox (justify-content: space-between). Put university and GPA on the next line. No extra spacing.
9. For experience entries: put role/company and duration on the SAME line using flexbox. Bullets directly below with zero gap.
10. ul/li: margin: 0, padding-left: 16px, list-style: disc, font-size: 10pt. No extra spacing between list items (li margin: 1px 0).
11. Do NOT use tables. Use <section> for each resume section. Use <div> with flexbox for inline layouts.
12. No external resources (no CDN, no images, no external fonts).
13. Wrap each individual experience entry, project entry, and education entry in a <div class="entry">.

ATS RULES:
- Use semantic HTML: h1, h2, h3, p, ul, li, section.
- Single-column layout only. No multi-column, no sidebars, no floating elements.
- Weave job description keywords naturally throughout.

Return a JSON object with one field "html" containing the complete HTML string.`

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(resumePdfSchema),
        }
    })
    const jsonContent = JSON.parse(response.text)

    // Inject page-break CSS programmatically to guarantee correct behavior.
    // IMPORTANT: We do NOT use page-break-inside:avoid on <section> because
    // large sections get pushed entirely to the next page, leaving a huge gap.
    // Instead, we only prevent breaks inside small .entry divs and keep
    // section headers attached to their following content.
    const pageBreakCSS = `
    <style>
        /* Global resets to guarantee no excessive gaps and standard ATS layout */
        * {
            box-sizing: border-box;
        }
        body {
            margin: 0 !important;
            padding: 0 !important;
            line-height: 1.3 !important;
            color: #333333 !important;
        }
        section {
            margin-bottom: 8px !important;
        }
        h1 {
            margin: 0 0 2px 0 !important;
            font-size: 20pt !important;
            text-align: center !important;
        }
        .contact-info {
            text-align: center !important;
            margin-top: 0 !important;
            margin-bottom: 8px !important;
            font-size: 9.5pt !important;
        }
        h2 {
            margin: 8px 0 4px 0 !important;
            font-size: 11.5pt !important;
            padding-bottom: 2px !important;
            border-bottom: 1.5px solid #1a5276 !important;
        }
        .entry {
            margin-bottom: 4px !important;
            page-break-inside: avoid !important; 
            break-inside: avoid !important;
        }
        .flex-row {
            display: flex !important;
            justify-content: space-between !important;
            align-items: baseline !important;
            margin-bottom: 2px !important;
        }
        p, ul, li {
            margin: 0 !important;
        }
        ul {
            padding-left: 16px !important;
        }
        li {
            margin-top: 1px !important;
            margin-bottom: 1px !important;
        }
        h2, h3 { 
            page-break-after: avoid !important; 
            break-after: avoid !important; 
        }
        section { 
            page-break-inside: auto !important; 
            break-inside: auto !important; 
        }
    </style>`

    let html = jsonContent.html
    if (html.includes('</head>')) {
        html = html.replace('</head>', pageBreakCSS + '\n</head>')
    } else {
        html = pageBreakCSS + html
    }

    const pdfBuffer = await generatePdfFromHtml(html)

    return pdfBuffer
}
module.exports = { generateInterviewReport, generateResumePdf }
