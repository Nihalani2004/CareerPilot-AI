import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);
const THEME_STORAGE_KEY = "careerpilot-theme";

function getInitialTheme() {
    try {
        return window.localStorage.getItem(THEME_STORAGE_KEY) === "light" ? "light" : "dark";
    } catch {
        return "dark";
    }
}

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(getInitialTheme);

    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        document.documentElement.style.colorScheme = theme;
        try {
            window.localStorage.setItem(THEME_STORAGE_KEY, theme);
        } catch {
            // Theme persistence is optional; the in-memory preference still works.
        }
    }, [theme]);

    const toggleTheme = () => setTheme((currentTheme) => currentTheme === "dark" ? "light" : "dark");

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
