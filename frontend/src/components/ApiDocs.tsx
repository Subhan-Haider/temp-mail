import { Terminal, Code, Webhook, Key } from 'lucide-react';

export default function ApiDocs() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mt-8">
      <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Terminal className="text-gray-500" /> Developer API Integration
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Connect your other websites and services directly to this data generator engine.
          </p>
        </div>
        <a 
          href="http://127.0.0.1:8000/docs" 
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
        >
          View Interactive OpenAPI Specs
        </a>
      </div>
      
      <div className="p-6 space-y-8">
        
        {/* Instant API */}
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
            <Code className="w-5 h-5 text-blue-500" /> 1. Instant Generation (Sync)
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            Get raw JSON data instantly in the HTTP response. Ideal for seeding databases or real-time UI data. Limited to 5,000 records.
          </p>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 font-mono text-sm overflow-x-auto border border-gray-200 dark:border-gray-700">
            <div className="text-gray-400 mb-2">POST http://127.0.0.1:8000/api/v1/generate-instant</div>
            <div className="text-purple-600 dark:text-purple-400">Headers:</div>
            <div className="pl-4 mb-2">Authorization: Bearer sk_test_12345</div>
            <div className="text-purple-600 dark:text-purple-400">Body (JSON):</div>
            <pre className="pl-4 text-green-600 dark:text-green-400">
{`{
  "num_records": 100,
  "locale": "en_US",
  "fields": ["First Name", "Last Name", "City"]
}`}
            </pre>
          </div>
        </div>

        {/* Webhooks */}
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
            <Webhook className="w-5 h-5 text-green-500" /> 2. Massive Generation (Async Webhooks)
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            For millions of records. The API instantly returns a Job ID, generates the file in the background, and sends a POST request to your webhook URL when it's ready.
          </p>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 font-mono text-sm overflow-x-auto border border-gray-200 dark:border-gray-700">
            <div className="text-gray-400 mb-2">POST http://127.0.0.1:8000/generate</div>
            <div className="text-purple-600 dark:text-purple-400">Body (JSON):</div>
            <pre className="pl-4 text-green-600 dark:text-green-400">
{`{
  "num_records": 1000000,
  "output_format": "csv",
  "locale": "en_US",
  "fields": ["First Name", "Last Name"],
  "webhook_url": "https://your-website.com/api/webhooks/data-ready"
}`}
            </pre>
            <div className="text-purple-600 dark:text-purple-400 mt-4">Webhook Payload Received On Completion:</div>
            <pre className="pl-4 text-blue-600 dark:text-blue-400">
{`{
  "job_id": "abc-123",
  "status": "completed",
  "download_url": "http://127.0.0.1:8000/download/abc-123",
  "total_records": 1000000
}`}
            </pre>
          </div>
        </div>

        {/* Simple GET API */}
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
            <Webhook className="w-5 h-5 text-indigo-500" /> 3. Simple Preset Generators (GET)
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            The easiest way to generate 1 or many specific entities. Supports <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">identity</code>, <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">address</code>, and <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">company</code>.
          </p>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 font-mono text-sm overflow-x-auto border border-gray-200 dark:border-gray-700">
            <div className="text-gray-400 mb-2">GET http://127.0.0.1:8000/api/v1/identity?count=1</div>
            <div className="text-purple-600 dark:text-purple-400">Headers:</div>
            <div className="pl-4 mb-2">Authorization: Bearer sk_test_12345</div>
            <div className="text-purple-600 dark:text-purple-400">Response (JSON):</div>
            <pre className="pl-4 text-blue-600 dark:text-blue-400">
{`{
  "First Name": "John",
  "Last Name": "Doe",
  "Email": "john.doe@example.com",
  "Phone": "+1-555-123-4567",
  "Job Title": "Software Engineer",
  "SSN": "XXX-XX-XXXX"
}`}
            </pre>
            <div className="text-gray-500 mt-4 text-xs italic">
              Note: Using ?count=5 will return a {"{ \"data\": [...] }"} array instead of a single object.
            </div>
          </div>
        </div>

        {/* API Keys Note */}
        <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-blue-800 dark:text-blue-300">
          <Key className="w-5 h-5 mt-0.5 shrink-0" />
          <p className="text-sm">
            <strong>Security Note:</strong> The instant generation endpoints require the API key <code className="bg-white/50 dark:bg-black/20 px-1 py-0.5 rounded">sk_test_12345</code>. You can change this by modifying the <code>API_KEY</code> environment variable in the backend.
          </p>
        </div>

        <hr className="my-8 border-gray-200 dark:border-gray-700" />
        
        <div>
          <h2 className="text-xl font-bold mb-4">Temp Mail API (Email Reception)</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Automate disposable email generation and message fetching. GhostMail provides a simple REST API to interact with the service programmatically.
          </p>
        </div>

        {/* Create Inbox */}
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
            <Webhook className="w-5 h-5 text-green-500" /> 4. Create Random Inbox (POST)
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            Generates a new random temporary email address. The inbox will expire after 60 minutes.
          </p>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 font-mono text-sm overflow-x-auto border border-gray-200 dark:border-gray-700">
            <div className="text-gray-400 mb-2">POST http://127.0.0.1:8000/create-inbox</div>
            <div className="text-purple-600 dark:text-purple-400">Response (JSON):</div>
            <pre className="pl-4 text-blue-600 dark:text-blue-400">
{`{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email_address": "xy7a9b2@ghostmail.example.com",
  "created_at": "2026-07-24T12:00:00Z",
  "expires_at": "2026-07-24T13:00:00Z"
}`}
            </pre>
          </div>
        </div>

        {/* Create Custom Inbox */}
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
            <Webhook className="w-5 h-5 text-indigo-500" /> 5. Create Custom Inbox (POST)
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            Generates a specific custom email address (Vanity URL). Optionally select a domain.
          </p>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 font-mono text-sm overflow-x-auto border border-gray-200 dark:border-gray-700">
            <div className="text-gray-400 mb-2">POST http://127.0.0.1:8000/create-inbox/custom</div>
            <div className="text-purple-600 dark:text-purple-400">Body (JSON):</div>
            <pre className="pl-4 text-green-600 dark:text-green-400">
{`{
  "username": "my.custom.name",
  "domain": "ghostmail.example.com"
}`}
            </pre>
          </div>
        </div>

        {/* Fetch Messages */}
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
            <Webhook className="w-5 h-5 text-blue-500" /> 6. Fetch Inbox Messages (GET)
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            Retrieves the list of messages received by the inbox. Polling this endpoint allows you to wait for verification emails.
          </p>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 font-mono text-sm overflow-x-auto border border-gray-200 dark:border-gray-700">
            <div className="text-gray-400 mb-2">GET http://127.0.0.1:8000/inbox/{'{inbox_id}'}</div>
          </div>
        </div>

        {/* Read Message */}
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
            <Webhook className="w-5 h-5 text-purple-500" /> 7. Read Message (GET)
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            Retrieves the full content (body and sanitized HTML) of a specific message.
          </p>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 font-mono text-sm overflow-x-auto border border-gray-200 dark:border-gray-700">
            <div className="text-gray-400 mb-2">GET http://127.0.0.1:8000/message/{'{message_id}'}</div>
          </div>
        </div>

        {/* Extend Inbox */}
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
            <Webhook className="w-5 h-5 text-orange-500" /> 8. Extend Expiration (PUT)
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            Extends the expiration timer of an active inbox by 30 minutes.
          </p>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 font-mono text-sm overflow-x-auto border border-gray-200 dark:border-gray-700">
            <div className="text-gray-400 mb-2">PUT http://127.0.0.1:8000/inbox/{'{inbox_id}'}/extend</div>
          </div>
        </div>

        {/* Domains */}
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
            <Webhook className="w-5 h-5 text-yellow-500" /> 9. Get Available Domains (GET)
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            Retrieves the list of active domains you can use for your temporary email addresses.
          </p>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 font-mono text-sm overflow-x-auto border border-gray-200 dark:border-gray-700">
            <div className="text-gray-400 mb-2">GET http://127.0.0.1:8000/domains</div>
            <div className="text-purple-600 dark:text-purple-400">Response (JSON):</div>
            <pre className="pl-4 text-blue-600 dark:text-blue-400">
{`{
  "domains": [
    "tempmail.local",
    "ghostmail.example.com"
  ]
}`}
            </pre>
          </div>
        </div>

        <hr className="my-8 border-gray-200 dark:border-gray-700" />

        {/* End-to-End Example */}
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
            <Code className="text-indigo-500" /> Real World Example: Connect Your App
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Here is a complete Node.js script showing how your other websites or test suites (like Jest or Cypress) can use the Temp Mail API to automate email verification flows!
          </p>
          <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-gray-300 overflow-x-auto border border-gray-700">
{`const axios = require('axios');

async function testSignupFlow() {
  const API = 'http://127.0.0.1:8000';
  
  // 1. Generate a custom inbox for the test
  const inboxRes = await axios.post(\`\${API}/create-inbox/custom\`, {
    username: 'testuser.abc',
    domain: 'ghostmail.example.com'
  });
  const inbox = inboxRes.data;
  console.log(\`Created inbox: \${inbox.email_address}\`);
  
  // 2. Perform your app's signup flow using the email...
  // await myOtherWebsite.signup({ email: inbox.email_address });
  
  // 3. Poll for the verification email (every 5 seconds)
  console.log("Waiting for email...");
  let messages = [];
  for(let i=0; i<10; i++) {
    const res = await axios.get(\`\${API}/inbox/\${inbox.id}\`);
    messages = res.data.messages;
    if (messages.length > 0) break;
    await new Promise(r => setTimeout(r, 5000));
  }
  
  // 4. Read the email content
  if (messages.length > 0) {
    const emailRes = await axios.get(\`\${API}/message/\${messages[0].id}\`);
    console.log("Received Email Body:", emailRes.data.body);
    // Extract verification link and click it!
  } else {
    throw new Error("Timeout waiting for email");
  }
}

testSignupFlow();`}
          </div>
        </div>

      </div>
    </div>
  );
}
