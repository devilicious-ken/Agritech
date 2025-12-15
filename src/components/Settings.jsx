import React, { useContext } from "react";
import { ThemeContext } from "../App";
import { Moon, Sun } from "lucide-react";

const Settings = () => {
  const { theme, setTheme } = useContext(ThemeContext);

  return (
    <div className="min-h-screen bg-background text-foreground p-6 transition-colors duration-300">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your application preferences</p>
        </div>

        {/* Theme Section */}
        <div className="bg-card rounded-lg p-6 shadow-sm transition-colors duration-300">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold mb-1">Appearance</h2>
              <p className="text-sm text-muted-foreground">Customize how the application looks</p>
            </div>
          </div>

          {/* Theme Toggle */}
          <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
            <div className="flex items-center gap-3">
              {theme === "dark" ? (
                <Moon className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Sun className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">Theme Mode</p>
                <p className="text-sm text-muted-foreground">
                  Currently using {theme === "dark" ? "Dark" : "Light"} mode
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setTheme("light")}
                className={`px-4 py-2 rounded-md font-medium transition-all duration-200 flex items-center gap-2 ${
                  theme === "light"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <Sun className="h-4 w-4" />
                Light
              </button>
              <button
                onClick={() => setTheme("dark")}
                className={`px-4 py-2 rounded-md font-medium transition-all duration-200 flex items-center gap-2 ${
                  theme === "dark"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <Moon className="h-4 w-4" />
                Dark
              </button>
            </div>
          </div>

          {/* Theme Preview */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/20">
              <p className="text-xs font-semibold text-muted-foreground mb-2">PREVIEW</p>
              <div className="space-y-2">
                <div className="h-8 bg-primary rounded"></div>
                <div className="h-4 bg-secondary rounded"></div>
                <div className="h-4 bg-secondary/50 rounded"></div>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-muted/20">
              <p className="text-xs font-semibold text-muted-foreground mb-2">COLORS</p>
              <div className="flex gap-2">
                <div className="h-6 w-6 bg-primary rounded"></div>
                <div className="h-6 w-6 bg-secondary rounded"></div>
                <div className="h-6 w-6 bg-accent rounded"></div>
                <div className="h-6 w-6 bg-destructive rounded"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-muted/20 rounded-lg">
          <p className="text-sm text-muted-foreground">
            💡 Your theme preference is automatically saved and will be restored when you return.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
