'use client';

import ApiDocs from '@/components/ApiDocs';

export default function ApiDocsPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">API Documentation</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Learn how to integrate the Synthetic Data Generator directly into your applications.
        </p>
      </div>
      
      <ApiDocs />
    </div>
  );
}
