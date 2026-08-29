import {createBrowserRouter} from "react-router";
import Login from "./features/auth/pages/login";
import Register from "./features/auth/pages/Register";
import Protected from "./features/auth/components/Protected";
import Home from "./features/interview/pages/Home";
import Interview from "./features/interview/pages/Interview";
import AtsDashboard from "./features/interview/pages/AtsDashboard";
import RoadmapLibrary from "./features/roadmaps/pages/RoadmapLibrary";
import RoadmapBuilder from "./features/roadmaps/pages/RoadmapBuilder";
import RoadmapDetail from "./features/roadmaps/pages/RoadmapDetail";
import ComparisonLibrary from "./features/job-comparison/pages/ComparisonLibrary";
import ComparisonBuilder from "./features/job-comparison/pages/ComparisonBuilder";
import ComparisonDashboard from "./features/job-comparison/pages/ComparisonDashboard";
import ResumeAtsLibrary from "./features/resume-ats/pages/ResumeAtsLibrary";
import ResumeAtsDetail from "./features/resume-ats/pages/ResumeAtsDetail";

export const router = createBrowserRouter([
    {
        path: "/login",
        element: <Login />
    },
    {
        path: "/register",
        element: <Register />
    },{
        path:"/",
        element: <Protected><Home /></Protected>
    },{
        path:"/interview/:interviewId",
        element: <Protected><Interview /></Protected>
    },{
        path:"/interview/:interviewId/ats",
        element: <Protected><AtsDashboard /></Protected>
    },{
        path:"/roadmaps",
        element: <Protected><RoadmapLibrary /></Protected>
    },{
        path:"/roadmaps/new",
        element: <Protected><RoadmapBuilder /></Protected>
    },{
        path:"/roadmaps/:roadmapId",
        element: <Protected><RoadmapDetail /></Protected>
    },{
        path:"/job-comparisons",
        element: <Protected><ComparisonLibrary /></Protected>
    },{
        path:"/job-comparisons/new",
        element: <Protected><ComparisonBuilder /></Protected>
    },{
        path:"/job-comparisons/:comparisonId",
        element: <Protected><ComparisonDashboard /></Protected>
    },{
        path:"/resume-ats",
        element: <Protected><ResumeAtsLibrary /></Protected>
    },{
        path:"/resume-ats/:scanId",
        element: <Protected><ResumeAtsDetail /></Protected>
    }
])
