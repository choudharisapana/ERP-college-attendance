import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getToken = () => localStorage.getItem("token");

  const applyTheme = (theme) => {
    const root = document.documentElement;
    const body = document.body;
    
    // Remove dark class first
    root.classList.remove("dark");
    
    if (theme === "dark") {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
      
      // FORCE background on html and body
      root.style.backgroundColor = "#111827";
      body.style.backgroundColor = "#111827";
      body.style.color = "#f3f4f6";
      
      // Force all backgrounds
      const allElements = document.querySelectorAll('div, section, main, article');
      allElements.forEach(el => {
        const bgColor = window.getComputedStyle(el).backgroundColor;
        if (bgColor === 'rgb(249, 250, 251)' || bgColor === 'rgb(255, 255, 255)') {
          el.style.backgroundColor = '';
        }
      });
    } 
    else if (theme === "light") {
      localStorage.setItem("theme", "light");
      
      // FORCE background on html and body
      root.style.backgroundColor = "#f9fafb";
      body.style.backgroundColor = "#f9fafb";
      body.style.color = "#111827";
    } 
    else if (theme === "auto") {
      localStorage.setItem("theme", "auto");
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (isDark) {
        root.classList.add("dark");
        root.style.backgroundColor = "#111827";
        body.style.backgroundColor = "#111827";
        body.style.color = "#f3f4f6";
      } else {
        root.style.backgroundColor = "#f9fafb";
        body.style.backgroundColor = "#f9fafb";
        body.style.color = "#111827";
      }
    }
    
    console.log("Theme applied:", theme);
    console.log("HTML bg:", root.style.backgroundColor);
    console.log("Body bg:", body.style.backgroundColor);
  };

  const applyFontSize = (fontSize) => {
    const root = document.documentElement;
    const fontSizeMap = {
      small: "14px",
      medium: "16px",
      large: "18px"
    };
    root.style.fontSize = fontSizeMap[fontSize] || "16px";
    localStorage.setItem("fontSize", fontSize);
  };

  const applyCompactView = (compactView) => {
    const root = document.documentElement;
    if (compactView) {
      root.classList.add("compact-view");
    } else {
      root.classList.remove("compact-view");
    }
    localStorage.setItem("compactView", compactView);
  };

  const applyLanguage = (language) => {
    localStorage.setItem("language", language);
    console.log("Language applied:", language);
  };

  const loadSettings = async () => {
    try {
      const token = getToken();
      if (!token) {
        const defaultSettings = {
          theme: localStorage.getItem("theme") || "light",
          language: localStorage.getItem("language") || "en",
          fontSize: localStorage.getItem("fontSize") || "medium",
          emailNotifications: true,
          compactView: localStorage.getItem("compactView") === "true"
        };
        setSettings(defaultSettings);
        applyTheme(defaultSettings.theme);
        applyFontSize(defaultSettings.fontSize);
        applyCompactView(defaultSettings.compactView);
        applyLanguage(defaultSettings.language);
        setLoading(false);
        return;
      }
      
      const response = await axios.get("http://localhost:5000/api/settings", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const settingsData = response.data.data;
        setSettings(settingsData);
        applyTheme(settingsData.theme);
        applyFontSize(settingsData.fontSize);
        applyCompactView(settingsData.compactView);
        applyLanguage(settingsData.language);
      }
      setError(null);
    } catch (err) {
      console.error("Error loading settings:", err);
      const localTheme = localStorage.getItem("theme") || "light";
      const localFontSize = localStorage.getItem("fontSize") || "medium";
      const localCompactView = localStorage.getItem("compactView") === "true";
      const localLanguage = localStorage.getItem("language") || "en";
      
      applyTheme(localTheme);
      applyFontSize(localFontSize);
      applyCompactView(localCompactView);
      applyLanguage(localLanguage);
      
      setError(err.response?.data?.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      const token = getToken();
      
      // Save to localStorage first
      localStorage.setItem("theme", newSettings.theme);
      localStorage.setItem("fontSize", newSettings.fontSize);
      localStorage.setItem("compactView", newSettings.compactView);
      localStorage.setItem("language", newSettings.language);
      localStorage.setItem("emailNotifications", newSettings.emailNotifications);
      
      // Apply immediately
      applyTheme(newSettings.theme);
      applyFontSize(newSettings.fontSize);
      applyCompactView(newSettings.compactView);
      applyLanguage(newSettings.language);
      
      if (!token) {
        setSettings(newSettings);
        return { success: true, message: "Settings saved locally!" };
      }
      
      const payload = {
        theme: newSettings.theme,
        language: newSettings.language,
        fontSize: newSettings.fontSize,
        emailNotifications: newSettings.emailNotifications,
        compactView: newSettings.compactView
      };
      
      const response = await axios.put("http://localhost:5000/api/settings", payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setSettings(response.data.data);
        return { success: true, message: "Settings updated successfully!" };
      } else {
        setSettings(newSettings);
        return { success: true, message: "Settings saved locally!" };
      }
    } catch (err) {
      console.error("Error updating settings:", err);
      setSettings(newSettings);
      return { success: true, message: "Settings saved locally (server sync failed)" };
    }
  };

  const resetSettings = async () => {
    const defaultSettings = {
      theme: "light",
      language: "en",
      fontSize: "medium",
      emailNotifications: true,
      compactView: false
    };
    
    localStorage.setItem("theme", "light");
    localStorage.setItem("fontSize", "medium");
    localStorage.setItem("compactView", "false");
    localStorage.setItem("language", "en");
    localStorage.setItem("emailNotifications", "true");
    
    applyTheme("light");
    applyFontSize("medium");
    applyCompactView(false);
    applyLanguage("en");
    
    setSettings(defaultSettings);
    
    try {
      const token = getToken();
      if (token) {
        const response = await axios.post("http://localhost:5000/api/settings/reset", {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          setSettings(response.data.data);
          return { success: true, message: "Settings reset to default!" };
        }
      }
      return { success: true, message: "Settings reset locally!" };
    } catch (err) {
      console.error("Error resetting settings:", err);
      return { success: true, message: "Settings reset locally!" };
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const currentTheme = localStorage.getItem("theme");
      if (currentTheme === "auto") {
        const root = document.documentElement;
        const body = document.body;
        if (mediaQuery.matches) {
          root.classList.add("dark");
          root.style.backgroundColor = "#111827";
          body.style.backgroundColor = "#111827";
          body.style.color = "#f3f4f6";
        } else {
          root.classList.remove("dark");
          root.style.backgroundColor = "#f9fafb";
          body.style.backgroundColor = "#f9fafb";
          body.style.color = "#111827";
        }
      }
    };
    
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const value = {
    settings,
    loading,
    error,
    updateSettings,
    resetSettings,
    reloadSettings: loadSettings
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};