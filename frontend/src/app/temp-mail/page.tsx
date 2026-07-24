'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Copy, RefreshCw, Mail, Clock, ShieldCheck, Check } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Message {
  id: string;
  sender: string;
  subject: string;
  received_at: string;
}

interface MessageDetail extends Message {
  body: string | null;
  body_html: string | null;
}

interface Inbox {
  id: string;
  email_address: string;
  created_at: string;
  expires_at: string;
  messages?: Message[];
}

export default function Home() {
  const [inbox, setInbox] = useState<Inbox | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<MessageDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [availableDomains, setAvailableDomains] = useState<string[]>([]);
  
  useEffect(() => {
    axios.get(`${API_URL}/domains`)
      .then(res => {
        setAvailableDomains(res.data.domains);
        if (res.data.domains && res.data.domains.length > 0) {
          setSelectedDomain(res.data.domains[0]);
        }
      })
      .catch(err => console.error("Failed to fetch domains", err));
  }, []);

  // Initial inbox creation
  useEffect(() => {
    const savedInboxId = localStorage.getItem('tempmail_inbox_id');
    
    if (savedInboxId) {
      loadInbox(savedInboxId);
    } else {
      createInbox();
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!inbox) return;
    
    const interval = setInterval(() => {
      const expires = new Date(inbox.expires_at).getTime();
      const now = new Date().getTime();
      const distance = expires - now;
      
      if (distance < 0) {
        setTimeLeft('EXPIRED');
        clearInterval(interval);
        localStorage.removeItem('tempmail_inbox_id');
        setInbox(null);
      } else {
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [inbox]);

  // Auto-refresh messages
  useEffect(() => {
    if (!inbox) return;
    
    const interval = setInterval(() => {
      refreshMessages();
    }, 10000); // Poll every 10 seconds
    
    return () => clearInterval(interval);
  }, [inbox]);

  const createInbox = () => {
    setLoading(true);
    axios.post(`${API_URL}/create-inbox`, { domain: selectedDomain })
      .then(res => {
        setInbox(res.data);
        setMessages([]);
        setSelectedMessage(null);
        localStorage.setItem('tempmail_inbox_id', res.data.id);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const loadInbox = async (id: string) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/inbox/${id}`);
      setInbox(res.data);
      setMessages(res.data.messages || []);
    } catch (error) {
      console.error('Inbox expired or not found:', error);
      localStorage.removeItem('tempmail_inbox_id');
      createInbox(); // Create a new one
    } finally {
      setLoading(false);
    }
  };

  const refreshMessages = async () => {
    if (!inbox || refreshing) return;
    setRefreshing(true);
    try {
      const res = await axios.get(`${API_URL}/inbox/${inbox.id}`);
      setMessages(res.data.messages || []);
    } catch (error) {
      console.error('Failed to refresh:', error);
    } finally {
      setTimeout(() => setRefreshing(false), 500); // Visual delay for spinner
    }
  };

  const loadMessage = async (id: string) => {
    try {
      const res = await axios.get(`${API_URL}/message/${id}`);
      setSelectedMessage(res.data);
    } catch (error) {
      console.error('Failed to load message:', error);
    }
  };

  const copyEmail = () => {
    if (inbox) {
      navigator.clipboard.writeText(inbox.email_address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-600">
            <Mail className="w-6 h-6" />
            <span className="font-bold text-lg tracking-tight">GhostMail</span>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium text-gray-500">
            <div className="flex items-center gap-1.5 hidden sm:flex">
              <ShieldCheck className="w-4 h-4 text-green-500" /> Secure
            </div>
            <div className="flex items-center gap-1.5 hidden sm:flex">
              <Clock className="w-4 h-4 text-orange-500" /> Temporary
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-8">
        
        {/* Email Address Hero Section */}
        <div className="bg-indigo-600 rounded-3xl p-8 text-center text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-50 pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-indigo-700 rounded-full blur-3xl opacity-50 pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-indigo-50">Your Temporary Email Address</h1>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-2 pl-6 rounded-2xl flex items-center justify-between shadow-inner">
              <div className="font-mono text-xl sm:text-2xl truncate mr-4">
                {loading ? 'Generating...' : (inbox?.email_address || 'Loading...')}
              </div>
              <button 
                onClick={copyEmail}
                disabled={!inbox}
                className="flex items-center gap-2 bg-white text-indigo-600 hover:bg-indigo-50 px-5 py-3 rounded-xl font-bold transition-all disabled:opacity-50"
              >
                {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
                <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm font-medium text-indigo-100">
              <div className="flex items-center gap-2 bg-indigo-800/40 px-4 py-2 rounded-full">
                <Clock className="w-4 h-4 text-indigo-300" />
                Expires in: <span className="font-mono text-white">{timeLeft}</span>
                {inbox && (
                  <button 
                    onClick={() => {
                      axios.put(`${API_URL}/inbox/${inbox.id}/extend`)
                        .then(res => setInbox(res.data))
                        .catch(err => alert("Failed to extend expiration"));
                    }}
                    className="ml-2 text-xs bg-indigo-500/50 hover:bg-indigo-500 px-2 py-1 rounded transition-colors"
                  >
                    +30m
                  </button>
                )}
              </div>
              
              <div className="flex gap-2 items-center">
                {availableDomains.length > 0 && (
                  <select 
                    value={selectedDomain}
                    onChange={(e) => setSelectedDomain(e.target.value)}
                    className="bg-indigo-900/50 border border-indigo-400/30 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                  >
                    {availableDomains.map(d => (
                      <option key={d} value={d}>@{d}</option>
                    ))}
                  </select>
                )}
                <button 
                  onClick={() => {
                    if (confirm('Generate a new email address? All current messages will be lost.')) {
                      createInbox();
                    }
                  }}
                  className="px-4 py-2 bg-indigo-500/50 hover:bg-indigo-500 rounded-lg transition-colors border border-indigo-400/30"
                >
                  Random
                </button>
                <button 
                  onClick={() => {
                    const customName = prompt("Enter custom alias (e.g. my.name):");
                    if (customName && confirm('Generate custom address? All current messages will be lost.')) {
                      setLoading(true);
                      axios.post(`${API_URL}/create-inbox/custom`, { username: customName, domain: selectedDomain })
                        .then(res => {
                          setInbox(res.data);
                          setMessages([]);
                          setSelectedMessage(null);
                          localStorage.setItem('tempmail_inbox_id', res.data.id);
                        })
                        .catch(err => {
                          alert(err.response?.data?.detail || "Error creating custom alias");
                        })
                        .finally(() => setLoading(false));
                    }
                  }}
                  className="px-4 py-2 bg-indigo-500/50 hover:bg-indigo-500 rounded-lg transition-colors border border-indigo-400/30 flex items-center gap-2"
                >
                  Custom Alias
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Inbox Section */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Message List */}
          <div className={`lg:col-span-5 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden ${selectedMessage ? 'hidden lg:block' : 'block'}`}>
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
              <h2 className="font-semibold flex items-center gap-2">
                Inbox
                <span className="bg-indigo-100 text-indigo-700 text-xs py-0.5 px-2 rounded-full font-bold">
                  {messages.length}
                </span>
              </h2>
              <button 
                onClick={refreshMessages}
                disabled={refreshing || !inbox}
                className="p-2 text-gray-500 hover:bg-white rounded-lg hover:shadow-sm border border-transparent hover:border-gray-200 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            <div className="divide-y divide-gray-100 h-[600px] overflow-y-auto">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                  <Mail className="w-12 h-12 mb-4 opacity-20" />
                  <p className="font-medium text-gray-500">Your inbox is empty</p>
                  <p className="text-sm mt-1">Waiting for incoming emails...</p>
                  <RefreshCw className="w-5 h-5 animate-spin mt-6 opacity-20" />
                </div>
              ) : (
                messages.map((msg) => (
                  <button
                    key={msg.id}
                    onClick={() => loadMessage(msg.id)}
                    className={`w-full text-left p-4 hover:bg-indigo-50/50 transition-colors ${selectedMessage?.id === msg.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : 'border-l-4 border-transparent'}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-gray-900 truncate pr-2">{msg.sender}</span>
                      <span className="text-xs text-gray-500 whitespace-nowrap pt-0.5">
                        {formatDistanceToNow(new Date(msg.received_at), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700 font-medium truncate">{msg.subject || '(No Subject)'}</div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Message Viewer */}
          <div className={`lg:col-span-7 bg-white rounded-2xl shadow-sm border border-gray-200 h-[600px] flex flex-col ${!selectedMessage ? 'hidden lg:flex' : 'flex'}`}>
            {!selectedMessage ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-gray-50/30 rounded-2xl">
                <Mail className="w-16 h-16 mb-4 text-gray-300" />
                <p className="text-lg font-medium text-gray-500">Select a message</p>
                <p className="text-sm mt-1">Click on an email from the list to read it.</p>
              </div>
            ) : (
              <>
                <div className="p-6 border-b border-gray-100">
                  <button 
                    onClick={() => setSelectedMessage(null)}
                    className="lg:hidden mb-4 text-sm font-medium text-indigo-600 flex items-center gap-1"
                  >
                    &larr; Back to Inbox
                  </button>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">{selectedMessage.subject || '(No Subject)'}</h2>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                        {selectedMessage.sender.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{selectedMessage.sender}</div>
                        <div className="text-gray-500 text-xs">To: {inbox?.email_address}</div>
                      </div>
                    </div>
                    <div className="text-gray-500">
                      {format(new Date(selectedMessage.received_at), 'MMM d, h:mm a')}
                    </div>
                  </div>
                </div>
                <div className="flex-1 p-6 overflow-y-auto">
                  {selectedMessage.body_html ? (
                    <div 
                      className="prose prose-sm max-w-none text-gray-800 break-words"
                      dangerouslySetInnerHTML={{ __html: selectedMessage.body_html }}
                    />
                  ) : (
                    <pre className="text-sm text-gray-800 font-sans whitespace-pre-wrap break-words">
                      {selectedMessage.body}
                    </pre>
                  )}
                </div>
              </>
            )}
          </div>
          
        </div>
      </main>
    </div>
  );
}
