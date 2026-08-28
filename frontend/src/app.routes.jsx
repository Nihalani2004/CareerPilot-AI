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
    }
])
