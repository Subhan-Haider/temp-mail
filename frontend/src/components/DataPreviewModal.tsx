'use client';
import { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios';

export default function DataPreviewModal({ jobId, isOpen, onClose }: { jobId: str | null, isOpen: boolean, onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && jobId) {
      setLoading(true);
      setError(null);
      axios.get(`http://127.0.0.1:8000/jobs/${jobId}/preview`)
        .then(res => setData(res.data))
        .catch(err => {
          setError(err.response?.data?.detail || "Failed to load preview");
          console.error(err);
        })
        .finally(() => setLoading(false));
    } else {
      setData(null);
      setError(null);
    }
  }, [isOpen, jobId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-semibold">Data Preview</h2>
            <p className="text-xs text-gray-500 font-mono mt-0.5">Job: {jobId}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-black/50 p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
              <p>Loading preview...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-red-500">
              <AlertCircle className="w-8 h-8 mb-4" />
              <p>{error}</p>
            </div>
          ) : data ? (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
              
              {(data.format === 'csv' || data.format === 'json') && data.columns && data.rows ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-gray-500 dark:text-gray-400 w-12 text-center">#</th>
                        {data.columns.map((col: string, i: number) => (
                          <th key={i} className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-mono text-xs">
                      {data.rows.length === 0 ? (
                        <tr>
                          <td colSpan={data.columns.length + 1} className="px-4 py-8 text-center text-gray-500">
                            No data available
                          </td>
                        </tr>
                      ) : data.rows.map((row: string[], i: number) => (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                          <td className="px-4 py-3 text-center text-gray-400 border-r border-gray-100 dark:border-gray-800">{i + 1}</td>
                          {row.map((cell, j) => (
                            <td key={j} className="px-4 py-3 text-gray-600 dark:text-gray-400 truncate max-w-xs" title={cell}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 overflow-auto max-h-[60vh]">
                  <pre className="text-xs font-mono text-gray-800 dark:text-gray-300 whitespace-pre-wrap">
                    {data.content || "No preview available."}
                  </pre>
                </div>
              )}
              
            </div>
          ) : null}
          
          {data && (
            <div className="mt-4 text-center text-xs text-gray-500">
              Showing preview of the first 100 records. Download the file to view all data.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
