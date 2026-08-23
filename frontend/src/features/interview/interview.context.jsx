import { createContext, useState } from "react";

export const InterviewContext = createContext()

export const InterviewProvider = ({ children }) => {
    const [loading, setLoading] = useState(false)
    const [report, setReport] = useState(null)
    const [reports, setReports] = useState([])
    const [nextReportsCursor, setNextReportsCursor] = useState(null)
    const [hasMoreReports, setHasMoreReports] = useState(false)

    return (
        <InterviewContext.Provider value={{ loading, setLoading, report, setReport, reports, setReports, nextReportsCursor, setNextReportsCursor, hasMoreReports, setHasMoreReports }}>
            {children}
        </InterviewContext.Provider>
    )
}
