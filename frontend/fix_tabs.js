import fs from 'fs';

let content = fs.readFileSync('/Users/apple/Desktop/vantage/Vantage/frontend/src/Dashboard.jsx', 'utf8');

const replacement = `        </div>

        {/* Global tab navigation so users always see the prediction box */}
        <div className="flex bg-slate-50 border-b border-slate-200">
          <button 
            onClick={() => setActiveTab('chat')} 
            className={\`flex-1 py-3 text-sm font-semibold \${activeTab === 'chat' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'text-slate-500 hover:bg-slate-100'}\`}
          >
            Ask Questions
          </button>
          <button 
            onClick={() => setActiveTab('prediction')} 
            className={\`flex-1 py-3 text-sm font-semibold \${activeTab === 'prediction' ? 'text-fuchsia-600 border-b-2 border-fuchsia-600 bg-white' : 'text-slate-500 hover:bg-slate-100'}\`}
          >
            What-If Projections (New!)
          </button>
          <button 
            onClick={() => setActiveTab('schema')} 
            className={\`flex-1 py-3 text-sm font-semibold \${activeTab === 'schema' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-white' : 'text-slate-500 hover:bg-slate-100'}\`}
          >
            Data Schema
          </button>
        </div>

        {activeTab === 'schema' ? (`;

content = content.replace("        </div>\n\n        {activeTab === 'schema' ? (", replacement);

// Make sure the empty chat asks them to try the animation
content = content.replace(
    "<p>Ask anything about your data.</p>",
    "<p className=\\"mb-2\\">Ask anything about your data.</p>\\n<p className=\\"text-xs text-indigo-400 bg-indigo-50 px-3 py-1 rounded-full\\">Tip: Upload a new CSV from the sidebar to see the indexing animation!</p>"
);

fs.writeFileSync('/Users/apple/Desktop/vantage/Vantage/frontend/src/Dashboard.jsx', content);
