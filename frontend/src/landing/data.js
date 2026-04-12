// ── All mock data for the Vantage landing page ──

export const navLinks = [
  { label: 'How it Works', href: '#how-it-works' },
  { label: 'Analytics', href: '#analytics' },
  { label: 'Use Cases', href: '#personas' },
  { label: 'Integrations', href: '#integrations' },
  { label: 'FAQ', href: '#faq' },
];

export const trustLogos = [
  'Snowflake', 'Databricks', 'Stripe', 'Shopify', 'HubSpot',
  'Salesforce', 'Notion', 'Linear', 'Vercel', 'Amplitude',
  'Figma', 'Segment',
];

export const steps = [
  {
    num: 1,
    title: 'Connect Your Data',
    desc: 'Upload CSV/Excel or link a warehouse. Vantage auto-builds a context graph and semantic metric dictionary — no manual schema tuning.',
  },
  {
    num: 2,
    title: 'Ask in Slack',
    desc: 'Anyone on the team asks questions in plain English directly in Slack. No SQL knowledge, no dashboard training, no tickets.',
  },
  {
    num: 3,
    title: 'Get Verified Insights',
    desc: 'AI synthesizes SQL, validates, self-repairs if needed, redacts PII, and narrates the answer in seconds.',
  },
];

export const beforeItems = [
  'Data requests take 2-3 days',
  'Only analysts can query data',
  'Context lost between tools and teams',
  'No semantic consistency across reports',
  'PII exposure risks in ad-hoc queries',
  'Siloed insights trapped in dashboards',
];

export const afterItems = [
  'Answers delivered in under 30 seconds',
  'Anyone can ask questions in Slack',
  'Shared context graph intelligence',
  'Metric dictionary ensures consistency',
  'Automatic dual-layer PII redaction',
  'Democratized, narrated insights for all',
];

export const features = [
  {
    title: 'Context Graph Engine',
    desc: 'Automatically builds semantic entity maps, relationship edges, and business meaning from raw data.',
    icon: 'GitBranch',
    color: 'indigo',
  },
  {
    title: 'TAG Planning',
    desc: 'Uses TASG-style planning to decompose questions into Table → Aggregate → Generate SQL workflows.',
    icon: 'Layers',
    color: 'violet',
  },
  {
    title: 'CSR-RAG Self-Repair',
    desc: 'If SQL fails, the critic module performs one schema-aware repair pass — self-healing intelligence.',
    icon: 'RefreshCw',
    color: 'cyan',
  },
  {
    title: 'Semantic Cache',
    desc: 'Glass-Box Embedding Cache detects semantically similar queries and returns instant results.',
    icon: 'Zap',
    color: 'amber',
  },
  {
    title: 'Privacy-First Narrator',
    desc: 'Regex + LLM dual-layer PII filter redacts sensitive data before narrating insights.',
    icon: 'Shield',
    color: 'emerald',
  },
  {
    title: 'Metric Dictionary',
    desc: 'Auto-generated SQL formulas ensure every query uses consistent, reusable business metrics.',
    icon: 'BookOpen',
    color: 'rose',
  },
];

export const analyticsDataSets = {
  RevOps: {
    line: [
      { month: 'Jan', value: 45 },
      { month: 'Feb', value: 38 },
      { month: 'Mar', value: 29 },
      { month: 'Apr', value: 22 },
      { month: 'May', value: 15 },
      { month: 'Jun', value: 9 },
    ],
    bar: [
      { name: 'Pipeline', current: 840, previous: 620 },
      { name: 'Closed Won', current: 520, previous: 380 },
      { name: 'Expansion', current: 310, previous: 190 },
      { name: 'Renewals', current: 480, previous: 450 },
    ],
    area: [
      { week: 'W1', queries: 120 },
      { week: 'W2', queries: 180 },
      { week: 'W3', queries: 240 },
      { week: 'W4', queries: 310 },
      { week: 'W5', queries: 420 },
      { week: 'W6', queries: 580 },
      { week: 'W7', queries: 640 },
      { week: 'W8', queries: 720 },
    ],
    kpis: [
      { label: 'Avg Response', value: 12, suffix: 'min', change: -68 },
      { label: 'Hours Saved', value: 340, suffix: '/mo', change: 42 },
      { label: 'Queries', value: 2847, suffix: '', change: 156 },
      { label: 'Accuracy', value: 97.2, suffix: '%', change: 8 },
    ],
    lineLabel: 'Response Time (min)',
    barLabel: 'Revenue Segments ($K)',
    areaLabel: 'Weekly Query Volume',
  },
  Sales: {
    line: [
      { month: 'Jan', value: 320 },
      { month: 'Feb', value: 380 },
      { month: 'Mar', value: 410 },
      { month: 'Apr', value: 475 },
      { month: 'May', value: 520 },
      { month: 'Jun', value: 610 },
    ],
    bar: [
      { name: 'Outbound', current: 420, previous: 280 },
      { name: 'Inbound', current: 380, previous: 340 },
      { name: 'Partner', current: 210, previous: 160 },
      { name: 'Upsell', current: 290, previous: 180 },
    ],
    area: [
      { week: 'W1', queries: 85 },
      { week: 'W2', queries: 110 },
      { week: 'W3', queries: 145 },
      { week: 'W4', queries: 190 },
      { week: 'W5', queries: 230 },
      { week: 'W6', queries: 285 },
      { week: 'W7', queries: 340 },
      { week: 'W8', queries: 410 },
    ],
    kpis: [
      { label: 'Deals Influenced', value: 186, suffix: '', change: 34 },
      { label: 'Pipeline Velocity', value: 28, suffix: ' days', change: -22 },
      { label: 'Win Rate Lift', value: 18, suffix: '%', change: 18 },
      { label: 'Rep Adoption', value: 94, suffix: '%', change: 31 },
    ],
    lineLabel: 'Closed Revenue ($K)',
    barLabel: 'Deal Sources',
    areaLabel: 'Sales Queries / Week',
  },
  Marketing: {
    line: [
      { month: 'Jan', value: 12400 },
      { month: 'Feb', value: 14200 },
      { month: 'Mar', value: 15800 },
      { month: 'Apr', value: 18300 },
      { month: 'May', value: 21000 },
      { month: 'Jun', value: 24800 },
    ],
    bar: [
      { name: 'SEO', current: 8200, previous: 5400 },
      { name: 'Paid', current: 6100, previous: 5800 },
      { name: 'Social', current: 4900, previous: 3200 },
      { name: 'Email', current: 5600, previous: 4100 },
    ],
    area: [
      { week: 'W1', queries: 40 },
      { week: 'W2', queries: 65 },
      { week: 'W3', queries: 90 },
      { week: 'W4', queries: 130 },
      { week: 'W5', queries: 175 },
      { week: 'W6', queries: 220 },
      { week: 'W7', queries: 280 },
      { week: 'W8', queries: 350 },
    ],
    kpis: [
      { label: 'Campaign ROI', value: 340, suffix: '%', change: 85 },
      { label: 'Attribution', value: 4, suffix: 'min', change: -91 },
      { label: 'A/B Tests', value: 156, suffix: '', change: 120 },
      { label: 'Channel Insights', value: 48, suffix: '/wk', change: 67 },
    ],
    lineLabel: 'MQLs Generated',
    barLabel: 'Channel Performance',
    areaLabel: 'Marketing Queries / Week',
  },
  Finance: {
    line: [
      { month: 'Jan', value: 2.4 },
      { month: 'Feb', value: 2.1 },
      { month: 'Mar', value: 1.8 },
      { month: 'Apr', value: 1.4 },
      { month: 'May', value: 0.9 },
      { month: 'Jun', value: 0.5 },
    ],
    bar: [
      { name: 'Rev Rec', current: 980, previous: 840 },
      { name: 'COGS', current: 420, previous: 510 },
      { name: 'OpEx', current: 680, previous: 730 },
      { name: 'Margin', current: 880, previous: 600 },
    ],
    area: [
      { week: 'W1', queries: 60 },
      { week: 'W2', queries: 80 },
      { week: 'W3', queries: 105 },
      { week: 'W4', queries: 140 },
      { week: 'W5', queries: 180 },
      { week: 'W6', queries: 230 },
      { week: 'W7', queries: 290 },
      { week: 'W8', queries: 360 },
    ],
    kpis: [
      { label: 'Close Time', value: 2, suffix: ' days', change: -76 },
      { label: 'Audit Ready', value: 99.1, suffix: '%', change: 12 },
      { label: 'Auto Reports', value: 72, suffix: '/mo', change: 240 },
      { label: 'Cost Savings', value: 128, suffix: 'K', change: 95 },
    ],
    lineLabel: 'Close Variance (days)',
    barLabel: 'Financial Segments ($K)',
    areaLabel: 'Finance Queries / Week',
  },
};

export const personas = {
  RevOps: {
    title: 'Revenue Operations',
    question: 'What drove the pipeline increase last quarter?',
    answer:
      'Pipeline grew 34% QoQ, primarily driven by the Enterprise segment (+$2.1M). Outbound contributed 62% of new pipeline, with APAC showing the strongest regional growth at 48%.',
    bullets: ['CRM synced', 'Pipeline metrics', 'Cohort analysis'],
  },
  'Data Teams': {
    title: 'Data & Analytics',
    question: 'How many data requests are self-served vs escalated?',
    answer:
      '78% of 847 monthly queries were self-served through Vantage (up from 31%). Average self-serve resolution is 18 seconds vs 2.3 days for escalated requests.',
    bullets: ['Schema introspection', 'Query audit trail', 'Backlog reduction'],
  },
  Sales: {
    title: 'Sales',
    question: 'Which reps are trending above quota this quarter?',
    answer:
      '12 of 34 AEs are tracking above 100% quota attainment. Top performers: Sarah C. (142%), Marcus O. (131%). Mid-Market leads at 108% average.',
    bullets: ['Real-time quotas', 'Deal intelligence', 'Territory analysis'],
  },
  Marketing: {
    title: 'Marketing',
    question: 'What is the true conversion rate by channel?',
    answer:
      'Overall MQL→SQL conversion is 24.3% MTD. Organic Search leads at 31.2%, followed by Product-Led (28.7%). Google Ads dropped 6pts this cycle.',
    bullets: ['Channel attribution', 'Spend efficiency', 'Funnel analysis'],
  },
  Finance: {
    title: 'Finance',
    question: 'What is our current burn rate vs last quarter?',
    answer:
      'Monthly burn is $428K — down 12% from Q3 ($486K). Reduction from headcount efficiency (+8% rev/employee) and renegotiated AWS contract (-$31K/mo). Runway: 19.2 months.',
    bullets: ['Burn tracking', 'Revenue recognition', 'Automated reporting'],
  },
};

export const integrations = [
  { name: 'Snowflake', category: 'warehouse' },
  { name: 'BigQuery', category: 'warehouse' },
  { name: 'Redshift', category: 'warehouse' },
  { name: 'PostgreSQL', category: 'database' },
  { name: 'MySQL', category: 'database' },
  { name: 'Databricks', category: 'warehouse' },
  { name: 'Fivetran', category: 'pipeline' },
  { name: 'dbt', category: 'transform' },
  { name: 'Looker', category: 'bi' },
  { name: 'Tableau', category: 'bi' },
  { name: 'Salesforce', category: 'crm' },
  { name: 'HubSpot', category: 'crm' },
  { name: 'Stripe', category: 'payments' },
  { name: 'Shopify', category: 'commerce' },
  { name: 'Segment', category: 'cdp' },
  { name: 'Slack', category: 'messaging' },
];

export const testimonials = [
  {
    quote:
      'Vantage eliminated our 3-day data request backlog. Our sales team went from filing tickets to getting answers in Slack within seconds.',
    author: 'Sarah Chen',
    role: 'VP Revenue Operations',
    company: 'ScaleAI Corp',
  },
  {
    quote:
      'The context graph is brilliant. It actually understands what our columns mean and writes better SQL than most of our junior analysts.',
    author: 'Marcus Obi',
    role: 'Head of Data',
    company: 'NovaTech',
  },
  {
    quote:
      'We went from 12% self-serve analytics adoption to 78% in two months. Finance, marketing, sales — everyone asks questions now.',
    author: 'Priya Sharma',
    role: 'Chief of Staff',
    company: 'Meridian Health',
  },
];

export const faqs = [
  {
    q: 'How does Vantage understand my data without manual configuration?',
    a: 'Vantage uses Context Graph Engineering — it automatically profiles your data with Gemini Flash, maps semantic column meanings, generates a metric dictionary with reusable SQL formulas, and indexes everything in ChromaDB for retrieval.',
  },
  {
    q: 'What happens when the AI generates incorrect SQL?',
    a: 'Vantage includes a CSR-RAG (Critic with Schema-Aware Repair) module. If the initial SQL fails, the system performs one schema-aware repair pass using the full schema and error context — self-healing intelligence.',
  },
  {
    q: 'Is my data secure? How is PII handled?',
    a: 'Vantage applies a dual-layer privacy filter: regex-based detection catches emails, phone numbers, and SSNs. Then, an LLM entity redaction pass masks remaining PII like names and addresses. All data stays within your infrastructure.',
  },
  {
    q: 'What data sources are supported?',
    a: 'Currently CSV and Excel file upload with automatic SQLite ingestion. Warehouse connectors for Snowflake, BigQuery, Redshift, and PostgreSQL are on the roadmap.',
  },
  {
    q: 'Can multiple teams use Vantage simultaneously?',
    a: 'Yes. The semantic cache accelerates repeated queries, and the metric dictionary ensures consistent answers whether asked by sales, marketing, or finance.',
  },
  {
    q: 'How does the semantic cache work?',
    a: 'Every query is embedded and stored in a Glass-Box Embedding Cache (GBEC). When a new question is semantically similar (within a configurable L2 distance threshold), the cached SQL is reused — delivering instant results.',
  },
];

export const slackMessages = [
  {
    role: 'user',
    author: 'Alex Kim',
    avatar: 'AK',
    text: 'What was our revenue by region last quarter?',
  },
  {
    role: 'thinking',
  },
  {
    role: 'assistant',
    text: 'Total revenue last quarter was $4.2M across 5 regions. North America led with $1.8M (43%), followed by EMEA at $1.1M (26%). APAC showed the strongest growth at +34% QoQ, reaching $680K.',
    hasChart: true,
  },
];
