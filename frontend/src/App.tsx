import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import LearnerRegister from './pages/LearnerRegister';
import ProfessorRegister from './pages/ProfessorRegister';
import AdminRegister from './pages/AdminRegister';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';

import ProtectedRoute from './components/ProtectedRoute';
import ProgramCatalog from './pages/ProgramCatalog';
import NominationManagement from './pages/NominationManagement';
import WeeklyMode from './pages/WeeklyMode';
import ProfessorGrading from './pages/ProfessorGrading';
import Tasks from './pages/Tasks';
import CapstoneGuidelines from './pages/CapstoneGuidelines';
import Teams from './pages/Teams';
import Setup from './pages/Setup';
import CohortsManagement from './pages/CohortsManagement';
import Settings from './pages/Settings';
import TeamsManagement from './components/admin/TeamsManagement';
import Submissions from './pages/Submissions';
import Feedback from './pages/Feedback';
import Documents from './pages/Documents';
import Notifications from './pages/Notifications';
import MyCohorts from './pages/MyCohorts';
import ProfessorSubmissions from './pages/ProfessorSubmissions';
import ProfessorSubmissionReview from './pages/ProfessorSubmissionReview';
import ProfessorCohortDetails from './pages/ProfessorCohortDetails';
import AdminNotifications from './pages/AdminNotifications';
import AdminCohortDetails from './pages/AdminCohortDetails';

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
          <ProtectedRoute allowedRoles={['LEARNER']}>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/learner/dashboard"
        element={
          <ProtectedRoute allowedRoles={['LEARNER']}>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/professor/dashboard"
        element={
          <ProtectedRoute allowedRoles={['PROFESSOR']}>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/cohorts"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <CohortsManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/programs"
        element={
          <ProtectedRoute allowedRoles={['LEARNER']}>
            <ProgramCatalog />
          </ProtectedRoute>
        }
      />
      <Route
        path="/nominations"
        element={
          <ProtectedRoute allowedRoles={['LEARNER']}>
            <NominationManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/weekly-mode"
        element={
          <ProtectedRoute allowedRoles={['LEARNER']}>
            <WeeklyMode />
          </ProtectedRoute>
        }
      />
      <Route
        path="/grading"
        element={
          <ProtectedRoute allowedRoles={['PROFESSOR']}>
            <ProfessorGrading />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks"
        element={
          <ProtectedRoute allowedRoles={['LEARNER']}>
            <Tasks />
          </ProtectedRoute>
        }
      />
      <Route
        path="/guidelines"
        element={
          <ProtectedRoute allowedRoles={['LEARNER']}>
            <CapstoneGuidelines />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teams"
        element={
          <ProtectedRoute allowedRoles={['LEARNER', 'PROFESSOR']}>
            <Teams />
          </ProtectedRoute>
        }
      />
      <Route
        path="/setup"
        element={
          <ProtectedRoute allowedRoles={['LEARNER']}>
            <Setup />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/teams"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <TeamsManagement />
          </ProtectedRoute>
        }
      />

      <Route
        path="/notifications"
        element={
          <ProtectedRoute allowedRoles={['LEARNER', 'PROFESSOR']}>
            <Notifications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/notifications"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminNotifications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/cohorts/:id"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminCohortDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/projects"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/submissions"
        element={
          <ProtectedRoute allowedRoles={['LEARNER']}>
            <Submissions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/feedback"
        element={
          <ProtectedRoute allowedRoles={['LEARNER']}>
            <Feedback />
          </ProtectedRoute>
        }
      />
      <Route
        path="/documents"
        element={
          <ProtectedRoute allowedRoles={['LEARNER', 'PROFESSOR']}>
            <Documents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/community"
        element={
          <ProtectedRoute allowedRoles={['LEARNER']}>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/professor/cohorts"
        element={
          <ProtectedRoute allowedRoles={['PROFESSOR']}>
            <MyCohorts />
          </ProtectedRoute>
        }
      />
      <Route
        path="/professor/cohorts/:id"
        element={
          <ProtectedRoute allowedRoles={['PROFESSOR']}>
            <ProfessorCohortDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/professor/submissions"
        element={
          <ProtectedRoute allowedRoles={['PROFESSOR']}>
            <ProfessorSubmissions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/professor/submissions/:teamId"
        element={
          <ProtectedRoute allowedRoles={['PROFESSOR']}>
            <ProfessorSubmissionReview />
          </ProtectedRoute>
        }
      />
      <Route
        path="/professor/reports"
        element={
          <ProtectedRoute allowedRoles={['PROFESSOR']}>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
