import React, { useState } from 'react';
import LandingPage from './landing/LandingPage';
import Dashboard from './Dashboard';

export default function App() {
  const [inApp, setInApp] = useState(false);

  // If we are "in the app", serve the real Chat Interface Dashboard!
  if (inApp) {
    return <Dashboard />;
  }

  // Otherwise serve the marketing Landing Page. We'll pass down a prop so the CTA button can launch the app.
  return <LandingPage onLaunch={() => setInApp(true)} />;
}