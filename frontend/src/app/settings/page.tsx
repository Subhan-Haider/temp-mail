'use client';
import { useState } from 'react';
import { Settings2, Key, Shield, Save, Copy, Check, Palette } from 'lucide-react';

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('sk_live_9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c');
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const [retention, setRetention] = useState('7');
  const [theme, setTheme] = useState('system');

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    
    // In a real app, this is where we'd save settings to the backend or localStorage
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // system
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  const regenerateKey = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let newKey = 'sk_live_';
    for (let i = 0; i < 32; i++) {
      newKey += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setApiKey(newKey);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <Settings2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Settings
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage your account preferences, API keys, and data retention policies.
          </p>
        </div>
        
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all"
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved' : 'Save Changes'}
        </button>
      </div>

      <div className="grid gap-8">
        
        {/* Appearance Settings */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Appearance</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Customize how the application looks on your device.</p>
            </div>
          </div>
          
          <div className="pl-16">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Theme Preference</label>
            <select 
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full md:w-1/2 p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
            >
              <option value="system">System Default</option>
              <option value="light">Light Mode</option>
              <option value="dark">Dark Mode</option>
            </select>
            <p className="text-xs text-gray-500 mt-2">
              Requires clicking "Save Changes" to apply.
            </p>
          </div>
        </section>

        {/* API Key Settings */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl">
              <Key className="w-6 h-6" />
            </div>
            <div className="flex-1 flex justify-between items-start">
              <div>
                <h2 className="text-lg font-semibold">API Credentials</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Use this key to authenticate with the /api/v1/generate-instant endpoint.</p>
              </div>
              <button 
                onClick={regenerateKey}
                className="text-sm px-3 py-1.5 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
              >
                Regenerate
              </button>
            </div>
          </div>
          
          <div className="pl-16">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Secret Key</label>
            <div className="flex items-center gap-2 w-full md:w-2/3">
              <input 
                type="text" 
                readOnly 
                value={apiKey}
                className="w-full p-2.5 font-mono text-sm bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 outline-none"
              />
              <button 
                onClick={copyApiKey}
                className="p-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors"
                title="Copy to clipboard"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />}
              </button>
            </div>
            <p className="text-xs text-red-500 mt-2 font-medium">
              Keep this key secret. Do not expose it in client-side code.
            </p>
          </div>
        </section>

        {/* Data Retention Settings */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Data Retention</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Configure how long generated files and job history are kept.</p>
            </div>
          </div>
          
          <div className="pl-16">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Auto-delete jobs after</label>
            <select 
              value={retention}
              onChange={(e) => setRetention(e.target.value)}
              className="w-full md:w-1/2 p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm"
            >
              <option value="1">24 Hours</option>
              <option value="3">3 Days</option>
              <option value="7">7 Days</option>
              <option value="30">30 Days</option>
              <option value="never">Never (Keep forever)</option>
            </select>
          </div>
        </section>

      </div>
    </div>
  );
}
