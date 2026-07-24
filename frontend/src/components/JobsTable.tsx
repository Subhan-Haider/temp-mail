'use client';
import { useState } from 'react';
import { Download, Trash2, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import axios from 'axios';
import DataPreviewModal from './DataPreviewModal';

export default function JobsTable({ jobs, onJobUpdate }: { jobs: any[], onJobUpdate: () => void }) {
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [previewJobId, setPreviewJobId] = useState<string | null>(null);

  const toggleSelectAll = () => {
    if (selectedJobs.length === jobs.length) {
      setSelectedJobs([]);
    } else {
      setSelectedJobs(jobs.map(job => job.id));
    }
  };

  const toggleSelectJob = (id: string) => {
    if (selectedJobs.includes(id)) {
      setSelectedJobs(selectedJobs.filter(jobId => jobId !== id));
    } else {
      setSelectedJobs([...selectedJobs, id]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedJobs.length === 0) return;
    if (confirm(`Delete ${selectedJobs.length} selected job(s) and their files?`)) {
      await axios.post('http://127.0.0.1:8000/jobs/bulk-delete', { job_ids: selectedJobs });
      setSelectedJobs([]);
      onJobUpdate();
    }
  };
  
  const handleDelete = async (id: string) => {
    if (confirm('Delete this job and its files?')) {
      await axios.delete(`http://127.0.0.1:8000/jobs/${id}`);
      setSelectedJobs(selectedJobs.filter(jobId => jobId !== id));
      onJobUpdate();
    }
  };

  const handleDownload = (id: string) => {
    window.open(`http://127.0.0.1:8000/download/${id}`, '_blank');
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {selectedJobs.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 px-6 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {selectedJobs.length} job(s) selected
            </span>
            <button 
              onClick={handleBulkDelete}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected
            </button>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 font-semibold w-10">
                  <input 
                    type="checkbox" 
                    checked={jobs.length > 0 && selectedJobs.length === jobs.length}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:border-gray-600"
                  />
                </th>
                <th className="px-6 py-4 font-semibold">Job ID</th>
                <th className="px-6 py-4 font-semibold">Records</th>
                <th className="px-6 py-4 font-semibold">Format</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Progress</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No generation jobs yet.
                  </td>
                </tr>
              ) : jobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      checked={selectedJobs.includes(job.id)}
                      onChange={() => toggleSelectJob(job.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-white dark:bg-gray-800 dark:border-gray-600"
                    />
                  </td>
                  <td className="px-6 py-4 font-mono text-xs truncate max-w-[120px]" title={job.id}>{job.id}</td>
                  <td className="px-6 py-4">{job.total_records.toLocaleString()}</td>
                  <td className="px-6 py-4 uppercase font-medium">{job.output_format}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {job.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-500" />}
                      {job.status === 'processing' && <Clock className="w-4 h-4 text-blue-500 animate-pulse" />}
                      {job.status === 'pending' && <Clock className="w-4 h-4 text-gray-400" />}
                      {job.status === 'failed' && <XCircle className="w-4 h-4 text-red-500" />}
                      <span className="capitalize">{job.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-2 rounded-full ${job.status === 'failed' ? 'bg-red-500' : 'bg-blue-500'}`} 
                          style={{ width: `${Math.max(0, Math.min(100, job.progress))}%` }} 
                        />
                      </div>
                      <span className="text-xs text-gray-500">{job.progress.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {job.status === 'completed' && (
                        <>
                          <button 
                            onClick={() => setPreviewJobId(job.id)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                            title="Preview Data"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDownload(job.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button 
                        onClick={() => handleDelete(job.id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <DataPreviewModal 
        isOpen={!!previewJobId} 
        jobId={previewJobId} 
        onClose={() => setPreviewJobId(null)} 
      />
    </>
  );
}
