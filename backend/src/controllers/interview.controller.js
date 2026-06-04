const pdfParse = require("pdf-parse")
const { generateInterviewReport, generateResumePdf } = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")
const PDFDocument = require("pdfkit")
const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY,
})

const tailoredResumeSchema = z.object({
    name: z.string().describe("Candidate's full name"),
    email: z.string().describe("Candidate's email address"),
    phone: z.string().describe("Candidate's phone number"),
    summary: z.string().describe("A professional summary tailored for the target job"),
    education: z.array(z.object({
        degree: z.string().describe("Degree, major, university, and year"),
        gpa: z.string().optional().describe("GPA or CGPA if available")
    })),
    skills: z.array(z.string()).describe("A list of key skills relevant to the job"),
    experience: z.array(z.object({
        role: z.string().describe("Job title / role"),
        company: z.string().describe("Company name"),
        duration: z.string().describe("Duration of employment"),
        points: z.array(z.string()).describe("Key accomplishments and responsibilities")
    })),
    projects: z.array(z.object({
        title: z.string().describe("Project title"),
        description: z.string().describe("Short description of what was built and tools/technologies used")
    })),
    achievements: z.array(z.string()).describe("List of key achievements/awards")
})



/**
 * @description controller to generate interview report based on user self description, resume and job description.
 */

async function generateInterViewReportController(req, res) {
    // const resumeFile = req.file

    const resumeContent = await (new pdfParse.PDFParse(Uint8Array.from(req.file.buffer))).getText()
    const { selfDescription, jobDescription } = req.body

    const interViewReportByAi = await generateInterviewReport({
        resume: resumeContent.text,
        selfDescription,
        jobDescription
    })

    const interviewReport = await interviewReportModel.create({
        user: req.user.id || req.user._id,
        resume: resumeContent.text,
        selfDescription,
        jobDescription,
        ...interViewReportByAi
    })

    res.status(201).json({
        message: "Interview report generated successfully",
        interviewReport: interviewReport
    })

}


/**
 * @description controller to get interview report by interviewId
 * 
 */

async function getInterviewReportByIdController(req, res) {
    const { interviewId } = req.params
    const interviewReport = await interviewReportModel.findOne({
        _id: interviewId,
        $or: [
            { user: req.user.id },
            { user: req.user._id },
            { user: null },
            { user: { $exists: false } }
        ]
    })

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    res.status(200).json({
        message: "Interview report fetched successfully",
        interviewReport
    })
}


async function getAllInterviewReportsController(req, res) {
    const interviewReports = await interviewReportModel.find({
        $or: [
            { user: req.user.id },
            { user: req.user._id },
            { user: null },
            { user: { $exists: false } }
        ]
    }).sort({ createdAt: -1 }).select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan -resumePdfCache")

    res.status(200).json({
        message: "Interview reports fetched successfully.",
        interviewReports
    })
}


/**
 * @description Controller to generate resume PDF based on user self description, resume content and job description.
 */
// async function generateResumePdfController(req, res) {
//     try {
//         const { interviewReportId } = req.params
//         const interviewReport = await interviewReportModel.findOne({
//             _id: interviewReportId,
//             $or: [
//                 { user: req.user.id },
//                 { user: req.user._id },
//                 { user: null },
//                 { user: { $exists: false } }
//             ]
//         })

//         if (!interviewReport) {
//             return res.status(404).json({
//                 message: "Interview report not found."
//             })
//         }

//         let resumeData
//         try {
//             const prompt = `Based on the following candidate information and the job description, generate a polished, structured resume tailored for this role.

// Candidate's Original Resume Content:
// ${interviewReport.resume || "Not provided"}

// Candidate's Self Description:
// ${interviewReport.selfDescription || "Not provided"}

// Target Job Description:
// ${interviewReport.jobDescription || "Not provided"}

// Please generate a professional resume structure with sections: Name, Contact Information, Professional Summary (tailored for the role), Education, Skills, Work Experience, Projects, and Achievements. Return the resume in JSON format matching the schema.`

//             const response = await ai.models.generateContent({
//                 model: "gemini-3-flash-preview",
//                 contents: prompt,
//                 config: {
//                     responseMimeType: "application/json",
//                     responseSchema: zodToJsonSchema(tailoredResumeSchema)
//                 }
//             })

//             resumeData = JSON.parse(response.text)
//         } catch (aiError) {
//             console.error("AI Resume Tailoring Error:", aiError)
//             // Fallback content if AI generation fails
//             resumeData = {
//                 name: req.user.username || "Candidate Profile",
//                 email: req.user.email || "candidate@example.com",
//                 phone: "+91-0000000000",
//                 summary: `Tailored profile for: ${interviewReport.title || "Software Engineer"}. Match Score: ${interviewReport.matchScore}%`,
//                 education: [
//                     { degree: "Education details from original profile", gpa: "" }
//                 ],
//                 skills: interviewReport.skillGaps ? interviewReport.skillGaps.map(s => s.skill) : [],
//                 experience: [
//                     { role: interviewReport.title || "Developer", company: "Company", duration: "Present", points: ["Details available in original profile"] }
//                 ],
//                 projects: [],
//                 achievements: []
//             }
//         }

//         const doc = new PDFDocument({ margin: 50 })

//         res.setHeader("Content-Type", "application/pdf")
//         res.setHeader("Content-Disposition", `attachment; filename=resume_${interviewReportId}.pdf`)

//         doc.pipe(res)

//         // Styling colors
//         const primaryColor = "#1e3a8a" // Deep Blue
//         const secondaryColor = "#475569" // Slate Gray
//         const textColor = "#1e293b" // Dark Gray

//         // Helper to render section header with a nice line
//         const renderSectionHeader = (title) => {
//             doc.fillColor(primaryColor).fontSize(14).text(title)
//             doc.moveDown(0.2)
//             doc.moveTo(50, doc.y)
//                .lineTo(562, doc.y)
//                .strokeColor("#cbd5e1")
//                .lineWidth(1)
//                .stroke()
//             doc.moveDown(0.6)
//         }

//         // Header Section
//         doc.fillColor(primaryColor).fontSize(26).text(resumeData.name || "Candidate Name", { align: "center" })
//         doc.fillColor(secondaryColor).fontSize(12).text(interviewReport.title || "Software Engineer", { align: "center" })
//         doc.fontSize(10).text(`Email: ${resumeData.email || ""} | Phone: ${resumeData.phone || ""}`, { align: "center" })
//         doc.moveDown(1.5)

//         // Professional Summary Section
//         if (resumeData.summary) {
//             renderSectionHeader("Professional Summary")
//             doc.fillColor(textColor).fontSize(10).text(resumeData.summary, { align: "justify", lineGap: 3 })
//             doc.moveDown(1.2)
//         }

//         // Skills Section
//         if (resumeData.skills && resumeData.skills.length > 0) {
//             renderSectionHeader("Skills")
//             doc.fillColor(textColor).fontSize(10).text(resumeData.skills.join("  •  "), { lineGap: 3 })
//             doc.moveDown(1.2)
//         }

//         // Work Experience Section
//         if (resumeData.experience && resumeData.experience.length > 0) {
//             renderSectionHeader("Work Experience")

//             for (const exp of resumeData.experience) {
//                 // Role & Duration
//                 doc.fillColor(textColor).fontSize(11).text(`${exp.role} at ${exp.company}`)
//                 doc.fillColor(secondaryColor).fontSize(9).text(exp.duration)
//                 doc.moveDown(0.3)

//                 // Bullet points
//                 if (exp.points && exp.points.length > 0) {
//                     for (const pt of exp.points) {
//                         doc.fillColor(textColor).fontSize(10).text(`• ${pt}`, { indent: 15, lineGap: 2 })
//                     }
//                 }
//                 doc.moveDown(0.8)
//             }
//             doc.moveDown(0.4)
//         }

//         // Projects Section
//         if (resumeData.projects && resumeData.projects.length > 0) {
//             renderSectionHeader("Key Projects")

//             for (const proj of resumeData.projects) {
//                 doc.fillColor(textColor).fontSize(11).text(proj.title)
//                 doc.fillColor(textColor).fontSize(10).text(proj.description, { indent: 15, lineGap: 2 })
//                 doc.moveDown(0.6)
//             }
//             doc.moveDown(0.6)
//         }

//         // Education Section
//         if (resumeData.education && resumeData.education.length > 0) {
//             renderSectionHeader("Education")

//             for (const edu of resumeData.education) {
//                 doc.fillColor(textColor).fontSize(10).text(edu.degree)
//                 if (edu.gpa) {
//                     doc.fillColor(secondaryColor).fontSize(9).text(`GPA/CGPA: ${edu.gpa}`)
//                 }
//                 doc.moveDown(0.6)
//             }
//             doc.moveDown(0.8)
//         }

//         // Achievements Section
//         if (resumeData.achievements && resumeData.achievements.length > 0) {
//             renderSectionHeader("Achievements")

//             for (const ach of resumeData.achievements) {
//                 doc.fillColor(textColor).fontSize(10).text(`• ${ach}`, { indent: 15, lineGap: 2 })
//             }
//         }

//         doc.end()
//     } catch (error) {
//         console.error("Generate Resume PDF Error:", error)
//         res.status(500).json({ message: "Internal Server Error", error: error.message })
//     }
// }
async function generateResumePdfController(req, res) {
    try {
        const { interviewReportId } = req.params

        const interviewReport = await interviewReportModel.findById(interviewReportId)

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found."
            })
        }

        // Return cached PDF if available (instant download)
        if (interviewReport.resumePdfCache) {
            const cachedBuffer = Buffer.isBuffer(interviewReport.resumePdfCache)
                ? interviewReport.resumePdfCache
                : Buffer.from(interviewReport.resumePdfCache)
            res.set({
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
            })
            return res.send(cachedBuffer)
        }

        // Generate fresh PDF (first time only)
        const { resume, jobDescription, selfDescription } = interviewReport
        const pdfResult = await generateResumePdf({ resume, jobDescription, selfDescription })

        // Puppeteer v25+ returns Uint8Array; ensure it's a proper Node.js Buffer
        const pdfBuffer = Buffer.isBuffer(pdfResult) ? pdfResult : Buffer.from(pdfResult)

        // Cache the generated PDF for future instant downloads
        interviewReport.resumePdfCache = pdfBuffer
        await interviewReport.save()

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
        })

        res.send(pdfBuffer)
    } catch (error) {
        console.error("Generate Resume PDF Error:", error)
        res.status(500).json({ message: "Internal Server Error", error: error.message })
    }
}

async function deleteInterviewReportController(req, res) {
    try {
        const { interviewId } = req.params
        const interviewReport = await interviewReportModel.findOneAndDelete({
            _id: interviewId,
            $or: [
                { user: req.user.id },
                { user: req.user._id },
                { user: null },
                { user: { $exists: false } }
            ]
        })

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found or unauthorized to delete."
            })
        }

        res.status(200).json({
            message: "Interview report deleted successfully."
        })
    } catch (error) {
        console.error("Delete Interview Report Error:", error)
        res.status(500).json({ message: "Internal Server Error", error: error.message })
    }
}


module.exports = {
    generateInterViewReportController,
    getInterviewReportByIdController,
    getAllInterviewReportsController,
    generateResumePdfController,
    deleteInterviewReportController
}