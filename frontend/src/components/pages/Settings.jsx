import React, { useState, useEffect } from "react";
import { useSettings } from "../../context/SettingsContext";

const Settings = () => {
  const { settings, loading, error, updateSettings, resetSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleToggleChange = (field) => {
    setLocalSettings((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    setLocalSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    
    const result = await updateSettings({
      theme: localSettings.theme,
      fontSize: localSettings.fontSize,
      emailNotifications: localSettings.emailNotifications,
      compactView: localSettings.compactView
    });
    
    setMessage({
      type: result.success ? "success" : "error",
      text: result.message,
    });
    setSaving(false);
    
    setTimeout(() => {
      setMessage({ type: "", text: "" });
    }, 3000);
  };

  const handleReset = async () => {
    if (window.confirm("Are you sure you want to reset all settings to default?")) {
      const result = await resetSettings();
      setMessage({
        type: result.success ? "success" : "error",
        text: result.message,
      });
      
      setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading your settings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-5">
        <p className="text-red-600 dark:text-red-400">Error: {error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!localSettings) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Initializing settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto my-20 px-4">
      {/* Center Aligned Header */}
      <div className="text-center mb-12">
        <h1 className="text-6xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Settings
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
           Customize your experience and make the app work your way
        </p>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div
          className={`p-4 rounded-lg mb-6 flex items-center gap-2.5 ${
            message.type === "success"
              ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
          }`}
        >
          <span>{message.type === "success" ? "✓" : "⚠"}</span>
          <span>{message.text}</span>
        </div>
      )}

      {/* Settings Cards */}
      <div className="space-y-6">
        {/* Appearance Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex items-center gap-2">
              <i className="fas fa-palette text-gray-600 dark:text-gray-400"></i>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Appearance</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                  <i className="fas fa-moon mr-2"></i>Theme
                </label>
                <div className="flex gap-6 flex-wrap ">
                  {[
                    { value: 'light', label: 'Light', icon: 'fa-sun' },
                    { value: 'dark', label: 'Dark', icon: 'fa-moon' },
                    { value: 'auto', label: 'Auto', icon: 'fa-mobile-alt' }
                  ].map((theme) => (
                    <label key={theme.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="theme"
                        value={theme.value}
                        checked={localSettings.theme === theme.value}
                        onChange={handleSelectChange}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-gray-600 dark:text-gray-300">
                        <i className={`fas ${theme.icon} mr-1`}></i>
                        {theme.label}
                      </span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  <i className="fas fa-info-circle mr-1"></i>
                  Auto follows your system preference
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                  <i className="fas fa-text-height mr-2"></i>Font Size
                </label>
                <div className="flex gap-6 flex-wrap">
                  {[
                    { value: 'small', label: 'Small', preview: 'A', size: 'text-sm' },
                    { value: 'medium', label: 'Medium', preview: 'A', size: 'text-base' },
                    { value: 'large', label: 'Large', preview: 'A', size: 'text-lg' }
                  ].map((size) => (
                    <label key={size.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="fontSize"
                        value={size.value}
                        checked={localSettings.fontSize === size.value}
                        onChange={handleSelectChange}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className={`text-gray-600 dark:text-gray-300 ${size.size}`}>
                        {size.preview} {size.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Layout Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex items-center gap-2">
              <i className="fas fa-columns text-gray-600 dark:text-gray-400"></i>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Layout</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white">
                  <i className="fas fa-compress-alt mr-2"></i>Compact View
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Reduce spacing and make content more compact
                </p>
              </div>
              <button
                onClick={() => handleToggleChange("compactView")}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  localSettings.compactView ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    localSettings.compactView ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Notifications Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex items-center gap-2">
              <i className="fas fa-bell text-gray-600 dark:text-gray-400"></i>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Notifications</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-medium text-gray-900 dark:text-white">
                  <i className="fas fa-envelope mr-2"></i>Email Notifications
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Receive email alerts for important updates
                </p>
              </div>
              <button
                onClick={() => handleToggleChange("emailNotifications")}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  localSettings.emailNotifications ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    localSettings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Buttons */}
      <div className="flex justify-center gap-4 mt-10 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button 
          onClick={handleReset} 
          className="px-8 py-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-base font-medium text-gray-600 dark:text-gray-300 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400"
        >
          <i className="fas fa-undo-alt mr-2"></i>
          Reset to Default
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-8 py-3 bg-blue-600 text-white rounded-lg text-base font-medium cursor-pointer transition-all hover:bg-blue-700 ${
            saving ? "opacity-60 cursor-not-allowed" : ""
          }`}
        >
          {saving ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2"></i>
              Saving...
            </>
          ) : (
            <>
              <i className="fas fa-save mr-2"></i>
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default Settings;