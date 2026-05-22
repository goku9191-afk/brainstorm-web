import { HashRouter, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import HomePage from './pages/HomePage';
import StudentPage from './pages/StudentPage';
import BoardPage from './pages/BoardPage';
import TeacherPage from './pages/TeacherPage';

function Toast({ toasts }) {
  return (
    <div className="toast-wrap">
      {toasts.map(t => <div key={t.id} className="toast">{t.msg}</div>)}
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState([]);
  function toast(msg) {
    const id = Date.now();
    setToasts(t => [...t, { id, msg }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2500);
  }
  return { toasts, toast };
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/join/:roomCode" element={<StudentPage />} />
        <Route path="/join" element={<StudentPage />} />
        <Route path="/board/:roomCode" element={<BoardPage />} />
        <Route path="/teacher" element={<TeacherPage />} />
      </Routes>
    </HashRouter>
  );
}
