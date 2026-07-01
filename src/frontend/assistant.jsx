import SectionShell from './sectionShell.jsx';
import AIAssistant from './AIAssistant.jsx';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

function Assistant() {
  const { user, isInitialized } = useAuth();

  if (!isInitialized) return <div style={{ padding: 24 }}>Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  return (
    <SectionShell title="AI Assistant" subtitle="Ask questions, summarize spending, and create budgets from one panel.">
      <div className="page-stack">
        <AIAssistant embedded />
      </div>
    </SectionShell>
  );
}

export default Assistant;