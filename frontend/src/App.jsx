import React from 'react';
import { ChatProvider } from './context/ChatContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ChatWindow } from './components/ChatWindow';
import { ArtifactViewer } from './components/ArtifactViewer';
import { SettingsModal } from './components/SettingsModal';

function AppContent() {
  return (
    <div className="app-container">
      <Navbar />
      <div className="workspace">
        <Sidebar />
        <ChatWindow />
        <ArtifactViewer />
      </div>
      <SettingsModal />
    </div>
  );
}

export default function App() {
  return (
    <ChatProvider>
      <AppContent />
    </ChatProvider>
  );
}
