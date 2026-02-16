import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import LearnerRegister from './pages/LearnerRegister';
import ProfessorRegister from './pages/ProfessorRegister';
import AdminRegister from './pages/AdminRegister';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';

import ProtectedRoute from './components/ProtectedRoute';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register/learner" element={<LearnerRegister />} />
      <Route path="/register/professor" element={<ProfessorRegister />} />
      <Route path="/register/admin" element={<AdminRegister />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;
