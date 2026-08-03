import SectionShell from './sectionShell.jsx';
import AIAssistant from './AIAssistant.jsx';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { useTranslation } from "../utils/translations.js";
import { getLanguageCode } from "../utils/languageHelper.js";

function Assistant() {
  const { user, isInitialized, preferences } = useAuth();
  const language = preferences.language;    
  const languageCode = getLanguageCode(language);
  const t = useTranslation(languageCode);

  if (!isInitialized) return <div style={{ padding: 24 }}>Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  return (
    <SectionShell title={t('ai.title')} subtitle={t('ai.subtitle')}>
      <div className="page-stack">
        <AIAssistant embedded />
      </div>
    </SectionShell>
  );
}

export default Assistant;