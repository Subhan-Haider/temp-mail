'use client';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import GeneratorForm from '@/components/GeneratorForm';
import JobsTable from '@/components/JobsTable';
import { Activity, Database, FileText } from 'lucide-react';

export default function Home() {
  const [jobs, setJobs] = useState<any[]>([]);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/jobs');
      setJobs(res.data);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    
    // Poll for active jobs
    const interval = setInterval(() => {
      fetchJobs();
    }, 3000);
    
    return () => clearInterval(interval);
  }, [fetchJobs]);

  const totalRecords = jobs.reduce((acc, job) => acc + (job.status === 'completed' ? job.total_records : 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Records Generated</p>
            <p className="text-2xl font-bold">{totalRecords.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Completed Jobs</p>
            <p className="text-2xl font-bold">{jobs.filter(j => j.status === 'completed').length}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Active Jobs</p>
            <p className="text-2xl font-bold">{jobs.filter(j => j.status === 'processing' || j.status === 'pending').length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <GeneratorForm onJobStarted={fetchJobs} />
        </div>
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            Job History & Downloads
          </h2>
          <JobsTable jobs={jobs} onJobUpdate={fetchJobs} />
        </div>
      </div>
    </div>
  );
}
