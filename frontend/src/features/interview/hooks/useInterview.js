import { getAllInterviewReports, generateInterviewReport, getInterviewReportById, generateResumePdf, deleteInterviewReportById } from "../services/interview.api"
import { useContext, useEffect } from "react"
import { InterviewContext } from "../interview.context"
import { useParams } from "react-router"
// import { useNavigate } from "react-router"


export const useInterview = () => {

    const context = useContext(InterviewContext)
    const { interviewId } = useParams()

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider")
    }

    const { loading, setLoading, report, setReport, reports, setReports } = context

    const generateReport = async ({ jobDescription, selfDescription, resumeFile }) => {
        setLoading(true)
        let response = null
        try {
            response = await generateInterviewReport({ jobDescription, selfDescription, resumeFile })
            setReport(response.interviewReport)
        } catch (error) {
            console.log(error)
        } finally {
            setLoading(false)
        }

        return response.interviewReport
    }

    const getReportById = async (interviewId) => {
        setLoading(true)
        let response = null
        try {
            response = await getInterviewReportById(interviewId)
            setReport(response.interviewReport)
        } catch (error) {
            console.log(error)
        } finally {
            setLoading(false)
        }
        return response.interviewReport
    }

    const getReports = async () => {
        setLoading(true)
        let response = null
        try {
            response = await getAllInterviewReports()
            setReports(response.interviewReports)
        } catch (error) {
            console.log(error)
        } finally {
            setLoading(false)
        }

        return response.interviewReports
    }

    const getResumePdf = async (interviewReportId, onStartDownloading) => {
        let response = null
        try {
            let fileHandle = null
            let filename = `resume_${interviewReportId}.pdf`
            if (report && report.title) {
                const cleanTitle = report.title
                    .replace(/[^a-zA-Z0-9\s-_]/g, '')
                    .trim()
                    .replace(/\s+/g, '_')
                filename = `Resume_${cleanTitle}.pdf`
            }

            // 1. Try to open the save picker first (while user gesture is active)
            if ('showSaveFilePicker' in window) {
                try {
                    fileHandle = await window.showSaveFilePicker({
                        suggestedName: filename,
                        types: [{
                            description: 'PDF Document',
                            accept: {
                                'application/pdf': ['.pdf']
                            }
                        }]
                    })
                } catch (err) {
                    if (err.name === 'AbortError') {
                        return { cancelled: true }
                    }
                    console.warn('Save picker failed to open initially, falling back to link download:', err)
                }
            }

            // 2. Start the actual download/generation process
            if (onStartDownloading) {
                onStartDownloading(true)
            }

            response = await generateResumePdf({ interviewReportId })

            // 3. Write to file if we have a handle
            if (fileHandle) {
                try {
                    const writable = await fileHandle.createWritable()
                    await writable.write(response)
                    await writable.close()
                    return { success: true }
                } catch (err) {
                    console.error('Error writing to file handle, falling back to default download', err)
                }
            }

            // 4. Fallback: Classic standard download link (without picker)
            const url = window.URL.createObjectURL(response)
            const link = document.createElement("a")
            link.href = url
            link.setAttribute("download", filename)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)
            return { success: true }
        }
        catch (error) {
            console.error(error)
            throw error
        }
    }

    const deleteReport = async (interviewId) => {
        setLoading(true)
        try {
            await deleteInterviewReportById(interviewId)
            setReports(prevReports => prevReports.filter(r => r._id !== interviewId))
            if (report && report._id === interviewId) {
                setReport(null)
            }
        } catch (error) {
            console.log(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        } else {
            getReports()
        }
    }, [interviewId])

    return { loading, report, reports, generateReport, getReportById, getReports, getResumePdf, deleteReport }

}