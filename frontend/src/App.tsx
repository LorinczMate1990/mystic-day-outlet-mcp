import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './layout/AppLayout';
import { TestMailView } from './test-mail/TestMailView';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/test/email" replace />} />
          <Route path="test/email" element={<TestMailView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
