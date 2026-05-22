import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const nav = useNavigate();
  return (
    <div className="page-center">
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 52, marginBottom: 10 }}>🧠</div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--primary)' }}>수업 브레인스토밍</h1>
        <p style={{ color: 'var(--ink-muted)', marginTop: 6 }}>실시간으로 아이디어를 모아보세요</p>
      </div>

      <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button className="btn-primary" onClick={() => nav('/join')} style={{ fontSize: 17, padding: '16px' }}>
          🙋 학생으로 참여하기
        </button>
        <button className="btn-secondary" onClick={() => nav('/teacher')} style={{ fontSize: 17, padding: '14px' }}>
          👩‍🏫 교사 메뉴
        </button>
      </div>
    </div>
  );
}
