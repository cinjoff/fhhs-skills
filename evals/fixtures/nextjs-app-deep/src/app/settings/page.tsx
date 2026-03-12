'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState('en');
  const [timezone, setTimezone] = useState('UTC');

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto p-6 bg-white text-gray-900">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>

        <div className="space-y-6 max-w-2xl">
          <section className="border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3">Appearance</h2>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Dark Mode</span>
              <ThemeToggle />
            </div>
          </section>

          <section className="border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3">Notifications</h2>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Email notifications</span>
              <button
                onClick={() => setNotifications(!notifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifications ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </section>

          <section className="border rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-3">Preferences</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Language</span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="px-3 py-1.5 border rounded-md text-sm"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Timezone</span>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="px-3 py-1.5 border rounded-md text-sm"
                >
                  <option value="UTC">UTC</option>
                  <option value="EST">Eastern</option>
                  <option value="PST">Pacific</option>
                </select>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
