import React, { useState } from 'react';
import MainLayout from './pages/MainLayout';
import LoginView from './pages/LoginView';
import { getSession, logout as authLogout } from './service/auth.Service';
import './App.css';

function App() {
  const [user, setUser] = useState(() => getSession());

  const handleLogout = () => {
    authLogout();
    setUser(null);
  };

  if (!user) {
    return <LoginView onLogin={setUser} />;
  }

  return <MainLayout user={user} onLogout={handleLogout} />;
}

export default App;
