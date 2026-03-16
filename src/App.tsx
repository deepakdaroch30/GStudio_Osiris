import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/Layout';

import Dashboard from './pages/Dashboard';
import Connections from './pages/Connections';
import Workspaces from './pages/Workspaces';
import WorkspaceDetail from './pages/WorkspaceDetail';
import Requirements from './pages/Requirements';
import TestDesign from './pages/TestDesign';
import PushExecutions from './pages/PushExecutions';
import ActivityLog from './pages/ActivityLog';
import Admin from './pages/Admin';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/connections" element={<Connections />} />
                <Route path="/workspaces" element={<Workspaces />} />
                <Route path="/workspaces/:id" element={<WorkspaceDetail />} />
                <Route path="/requirements" element={<Requirements />} />
                <Route path="/test-design" element={<TestDesign />} />
                <Route path="/push-executions" element={<PushExecutions />} />
                <Route path="/activity-log" element={<ActivityLog />} />
                <Route path="/admin" element={<Admin />} />
              </Routes>
            </Layout>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
