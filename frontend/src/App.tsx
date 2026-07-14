import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppLayout } from './layout/AppLayout';
import { HomeMenu } from './home/HomeMenu';
import { EmailSettingsView } from './email-settings/EmailSettingsView';
import { EmailNotesView } from './email-notes/EmailNotesView';
import { TestMailView } from './test-mail/TestMailView';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomeMenu />} />
          <Route path="email-settings" element={<EmailSettingsView />} />
          <Route path="email-notes" element={<EmailNotesView />} />
          <Route path="test/email" element={<TestMailView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
