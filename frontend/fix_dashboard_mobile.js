import fs from 'fs';

let content = fs.readFileSync('/Users/apple/Desktop/vantage/Vantage/frontend/src/Dashboard.jsx', 'utf8');

// Add a visible tab switcher below the header for all screen sizes so they can easily find the prediction box
const mobileTabs = `
        <div className="flex md:hidden bg-white border-b border-slate-200 w-full overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('chat')} 
            className={\`px-4 py-3 text-sm font-medium whitespace-nowrap \${activeTab === 'chat' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}\`}
          >
            Analytics Agent
          </button>
          <button 
            onClick={() => setActiveTab('prediction')} 
            className={\`px-4 py-3 text-sm font-medium whitespace-nowrap \${activeTab === 'prediction' ? 'text-fuchsia-600 border-b-2 border-fuchsia-600' : 'text-slate-500'}\`}
          >
            What-If Projections
          </button>
          <button 
            onClick={() => setActiveTab('schema')} 
            className={\`px-4 py-3 text-sm font-medium whitespace-nowrap \${activeTab === 'schema' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-500'}\`}
          >
            Data Dictionary
          </button>
        </div>
`;

content = content.replace(
  /{activeTab === 'schema' \? \(/g,
  mobileTabs + "\\n        {activeTab === 'schema' ? ("
);

// Make sure the big initial zero-state screen also points to "Upload Dataset" instead of the modal so it's impossible to miss
content = content.replace(
  /<button onClick={\(\) => setShowUploadModal\\(true\\)} className="mt-4 text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition-colors font-medium shadow-sm">\\n                  Upload file now\\n                <\\/button>/g,
  \`<button onClick={() => setShowUploadModal(true)} className="mt-4 text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl transition-colors font-medium shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2">
                  <UploadCloud size={16} /> Upload CSV to Start Simulation
                </button>\`
);

fs.writeFileSync('/Users/apple/Desktop/vantage/Vantage/frontend/src/Dashboard.jsx', content);
console.log("Dashboard UI fixed!");
