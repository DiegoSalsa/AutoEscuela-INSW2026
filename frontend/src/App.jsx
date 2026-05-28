import React, { useState } from 'react';
import MainLayout from './pages/MainLayout';
import LoginView from './pages/LoginView';
import './App.css';

function App() {
  const [user, setUser] = useState(null);

  if (!user) {
    return <LoginView onLogin={setUser} />;
  }

  return <MainLayout user={user} onLogout={() => setUser(null)} />;
}

export default App;
