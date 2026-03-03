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
import Teams from './pages/Teams';
import Setup from './pages/Setup';
import CohortsManagement from './pages/CohortsManagement';
import Settings from './pages/Settings';
import TeamsManagement from './components/admin/TeamsManagement';
import Submissions from './pages/Submissions';
import Feedback from './pages/Feedback';
import Documents from './pages/Documents';
import Announcements from './pages/Announcements';
import MyCohorts from './pages/MyCohorts';
import ProfessorSubmissions from './pages/ProfessorSubmissions';
import ProfessorSubmissionReview from './pages/ProfessorSubmissionReview';
import ProfessorCohortDetails from './pages/ProfessorCohortDetails';
import AdminTaskCreation from './pages/AdminTaskCreation';
import AdminAnnouncements from './pages/AdminAnnouncements';
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
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/learner/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/professor/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/cohorts"
        element={
          <ProtectedRoute>
            <CohortsManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/programs"
        element={
          <ProtectedRoute>
            <ProgramCatalog />
          </ProtectedRoute>
        }
      />
      <Route
        path="/nominations"
        element={
          <ProtectedRoute>
            <NominationManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/weekly-mode"
        element={
          <ProtectedRoute>
            <WeeklyMode />
          </ProtectedRoute>
        }
      />
      <Route
        path="/grading"
        element={
          <ProtectedRoute>
            <ProfessorGrading />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tasks"
        element={
          <ProtectedRoute>
            <Tasks />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teams"
        element={
          <ProtectedRoute>
            <Teams />
          </ProtectedRoute>
        }
      />
      <Route
        path="/setup"
        element={
          <ProtectedRoute>
            <Setup />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/teams"
        element={
          <ProtectedRoute>
            <TeamsManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/tasks"
        element={
          <ProtectedRoute>
            <AdminTaskCreation />
          </ProtectedRoute>
        }
      />
      <Route
        path="/announcements"
        element={
          <ProtectedRoute>
            <Announcements />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/announcements"
        element={
          <ProtectedRoute>
            <AdminAnnouncements />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/cohorts/:id"
        element={
          <ProtectedRoute>
            <AdminCohortDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/projects"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/submissions"
        element={
          <ProtectedRoute>
            <Submissions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/feedback"
        element={
          <ProtectedRoute>
            <Feedback />
          </ProtectedRoute>
        }
      />
      <Route
        path="/documents"
        element={
          <ProtectedRoute>
            <Documents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/community"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/professor/cohorts"
        element={
          <ProtectedRoute>
            <MyCohorts />
          </ProtectedRoute>
        }
      />
      <Route
        path="/professor/cohorts/:id"
        element={
          <ProtectedRoute>
            <ProfessorCohortDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/professor/submissions"
        element={
          <ProtectedRoute>
            <ProfessorSubmissions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/professor/submissions/:teamId"
        element={
          <ProtectedRoute>
            <ProfessorSubmissionReview />
          </ProtectedRoute>
        }
      />
      <Route
        path="/professor/reports"
        element={
          <ProtectedRoute>
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
