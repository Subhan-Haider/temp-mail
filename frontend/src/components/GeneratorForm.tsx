'use client';
import { useState } from 'react';
import axios from 'axios';
import { PlayCircle, Loader2 } from 'lucide-react';

const FIELDS = [
  "First Name", "Middle Name (optional)", "Last Name", 
  "Date of Birth", "Street Address", "City", 
  "Province/State", "Postal Code/ZIP", "Country", 
  "Gender (optional)", "Record ID"
];

const LOCALES = [
  { code: 'en_US', label: 'United States' },
  { code: 'en_CA', label: 'Canada' },
  { code: 'en_GB', label: 'United Kingdom' },
  { code: 'en_AU', label: 'Australia' }
];

export default function GeneratorForm({ onJobStarted }: { onJobStarted: () => void }) {
  const [numRecords, setNumRecords] = useState(100);
  const [format, setFormat] = useState('csv');
  const [locale, setLocale] = useState('en_US');
  const [selectedFields, setSelectedFields] = useState<string[]>(FIELDS);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Canada specifics
  const [caProvince, setCaProvince] = useState('');
  const [caCity, setCaCity] = useState('');

  const toggleField = (field: string) => {
    setSelectedFields(prev => 
      prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]
    );
  };

  const handleGenerate = async () => {
    if (selectedFields.length === 0) {
      alert("Please select at least one field.");
      return;
    }
    
    setIsGenerating(true);
    try {
      const payload: any = {
        num_records: numRecords,
        output_format: format,
        locale: locale,
        fields: selectedFields,
      };

      if (locale === 'en_CA' && (caProvince || caCity)) {
        payload.country_specific = {
          Province: caProvince || null,
          City: caCity || null
        };
      }

      await axios.post('http://127.0.0.1:8000/generate', payload);
      onJobStarted();
    } catch (error) {
      console.error(error);
      alert("Failed to start generation job.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <PlayCircle className="text-blue-500" /> Generate Data
      </h2>
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Number of Records</label>
            <input 
              type="number" 
              min={1} max={10000000}
              value={numRecords}
              onChange={(e) => setNumRecords(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Output Format</label>
            <select 
              value={format} 
              onChange={(e) => setFormat(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-transparent"
            >
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
              <option value="sql">SQL</option>
              <option value="xlsx">Excel (XLSX)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Country / Locale</label>
            <select 
              value={locale} 
              onChange={(e) => setLocale(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-transparent"
            >
              {LOCALES.map(loc => (
                <option key={loc.code} value={loc.code}>{loc.label}</option>
              ))}
            </select>
          </div>
        </div>

        {locale === 'en_CA' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div>
              <label className="block text-sm font-medium mb-1">Specific Province (Optional)</label>
              <input 
                type="text" 
                placeholder="e.g., Saskatchewan"
                value={caProvince}
                onChange={(e) => setCaProvince(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Specific City (Optional)</label>
              <input 
                type="text" 
                placeholder="e.g., Saskatoon"
                value={caCity}
                onChange={(e) => setCaCity(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 bg-transparent"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-3">Fields to Include</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {FIELDS.map(field => (
              <label key={field} className="flex items-center gap-2 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={selectedFields.includes(field)}
                  onChange={() => toggleField(field)}
                  className="rounded text-blue-500 focus:ring-blue-500 h-4 w-4"
                />
                <span className="text-sm">{field}</span>
              </label>
            ))}
          </div>
        </div>

        <button 
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-all flex justify-center items-center gap-2"
        >
          {isGenerating ? <><Loader2 className="animate-spin" /> Starting...</> : 'Generate Data'}
        </button>
      </div>
    </div>
  );
}
