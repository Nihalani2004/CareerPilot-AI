import {RouterProvider} from "react-router";
import { router } from "./app.routes.jsx";
import { AuthProvider } from "./features/auth/auth.context.jsx";
import { InterviewProvider } from "./features/interview/interview.context.jsx";
import { ThemeProvider } from "./theme.context.jsx";
import ThemeToggle from "./components/ThemeToggle.jsx";
import WorkspaceMenu from "./components/WorkspaceMenu.jsx";

function App() {

  return (
    <ThemeProvider>
      <AuthProvider>
          <InterviewProvider>
          <WorkspaceMenu />
          <ThemeToggle />
          <RouterProvider router={router} />
        </InterviewProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
