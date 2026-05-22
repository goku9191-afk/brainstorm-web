import { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { createRoom, getRoom, subscribeIdeas, setIdeaVisible, deleteIdea, generateCode } from '../lib/firebase';

const TEACHER_PW = '선생님';   // 교사 탭 진입 비밀번호 (UI 레벨)

function formatTime(ts) {
  if (!ts?.toDate) return '';
  return ts.toDate().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export default function TeacherPage() {
  const [pw, setPw] = useState('');
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState('create'); // 'create' | 'manage'

  // Create room
  const [topic, setTopic] = useState('');
  const [roomPw, setRoomPw] = useState('');
  const [createdRoom, setCreatedRoom] = useState(null); // { code, topic }

  // Manage room
  const [joinCode, setJoinCode] = useState('');
  const [joinPw, setJoinPw] = useState('');
  const [room, setRoom] = useState(null);
  const [ideas, setIdeas] = useState([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const unsubRef = useRef(null);
  const [toasts, setToasts] = useState([]);

  function toast(msg) {
    const id = Date.now();
    setToasts(t => [...t, { id, msg }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2200);
  }

  function checkPw() {
    if (pw === TEACHER_PW) setAuthed(true);
    else setErr('비밀번호가 틀렸어요.');
  }

  // ── 방 만들기 ────────────────────────────────────────────────────────
  async function handleCreate() {
    if (!topic.trim()) { setErr('주제를 입력하세요.'); return; }
    setLoading(true);
    setErr('');
    const code = generateCode();
    await createRoom({ code, topic: topic.trim(), password: roomPw.trim() || '' });
    setCreatedRoom({ code, topic: topic.trim() });
    setLoading(false);
  }

  // ── 방 입장 ──────────────────────────────────────────────────────────
  async function handleJoin() {
    const code = joinCode.toUpperCase().trim();
    if (!code) { setErr('방 코드를 입력하세요.'); return; }
    setLoading(true);
    setErr('');
    const r = await getRoom(code).catch(() => null);
    if (!r) { setErr('방을 찾을 수 없어요.'); setLoading(false); return; }
    if (r.password && r.password !== joinPw.trim()) { setErr('방 비밀번호가 틀렸어요.'); setLoading(false); return; }
    setRoom(r);
    unsubRef.current?.();
    unsubRef.current = subscribeIdeas(code, setIdeas);
    setTab('manage');
    setLoading(false);
  }

  useEffect(() => () => unsubRef.current?.(), []);

  const joinUrl = (code) => `${window.location.origin}${window.location.pathname}#/join/${code}`;
  const boardUrl = (code) => `${window.location.origin}${window.location.pathname}#/board/${code}`;

  // ── 비밀번호 입력 ────────────────────────────────────────────────────
  if (!authed) return (
    <div className="page-center">
      <div className="card">
        <div style={{ fontSize: 32, marginBottom: 8 }}>👩‍🏫</div>
        <p className="card-title">교사 메뉴</p>
        <p className="card-subtitle">교사 비밀번호를 입력하세요</p>
        <div className="field">
          <label>비밀번호</label>
          <input type="password" value={pw} onChange={e => setPw(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && checkPw()} autoFocus placeholder="비밀번호" />
        </div>
        {err && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 10 }}>{err}</p>}
        <button className="btn-primary" onClick={checkPw}>입장</button>
        <p style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 10, textAlign: 'center' }}>
          기본 비밀번호: <strong>선생님</strong>
        </p>
      </div>
    </div>
  );

  // ── 탭 ──────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header">
        <span style={{ fontSize: 22 }}>👩‍🏫</span>
        <h1>교사 메뉴</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {['create', 'manage'].map(t => (
            <button key={t} className="btn-sm"
              style={{ background: tab === t ? 'var(--primary)' : undefined, color: tab === t ? '#fff' : undefined }}
              onClick={() => { setTab(t); setErr(''); }}>
              {t === 'create' ? '수업 만들기' : '수업 관리'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', maxWidth: 800, margin: '0 auto', width: '100%' }}>

        {/* ── 수업 만들기 ────────────────────────────────────────────── */}
        {tab === 'create' && (
          <div>
            {!createdRoom ? (
              <div className="card" style={{ maxWidth: '100%' }}>
                <p className="card-title" style={{ marginBottom: 4 }}>새 수업 만들기</p>
                <p className="card-subtitle">방 코드가 자동으로 생성됩니다</p>

                <div className="field">
                  <label>오늘의 주제 / 질문</label>
                  <input value={topic} onChange={e => setTopic(e.target.value)}
                    placeholder="예: 환경 문제 해결 방법은?" onKeyDown={e => e.key === 'Enter' && handleCreate()} autoFocus />
                </div>
                <div className="field">
                  <label>방 비밀번호 (선택 — 교사만 관리 탭 접근)</label>
                  <input value={roomPw} onChange={e => setRoomPw(e.target.value)} placeholder="비워두면 비밀번호 없음" />
                </div>
                {err && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 10 }}>{err}</p>}
                <button className="btn-primary" onClick={handleCreate} disabled={loading}>
                  {loading ? '생성 중…' : '🚀 수업 시작'}
                </button>
              </div>
            ) : (
              <div className="card" style={{ maxWidth: '100%' }}>
                <span className="badge badge-green" style={{ marginBottom: 12 }}>수업 생성 완료!</span>
                <p className="card-title">{createdRoom.topic}</p>

                <p style={{ fontSize: 13, color: 'var(--ink-muted)', marginBottom: 4 }}>방 코드</p>
                <div className="room-code" onClick={() => { navigator.clipboard?.writeText(createdRoom.code); toast('코드 복사됨!'); }}>
                  {createdRoom.code}
                </div>
                <p style={{ fontSize: 11, color: 'var(--ink-muted)', textAlign: 'center', marginBottom: 20 }}>클릭해서 복사</p>

                {/* QR 코드 */}
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-secondary)', marginBottom: 12 }}>
                    📱 학생용 QR 코드 — 스캔하면 바로 입장
                  </p>
                  <div style={{
                    display: 'inline-block',
                    background: '#fff',
                    padding: 16,
                    borderRadius: 16,
                    boxShadow: 'var(--shadow)',
                  }}>
                    <QRCodeSVG
                      value={joinUrl(createdRoom.code)}
                      size={200}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 8 }}>
                    {joinUrl(createdRoom.code)}
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button className="btn-primary" onClick={() => window.open(`#/board/${createdRoom.code}`, '_blank')}>
                    🖥 전자칠판 열기 (새 탭)
                  </button>
                  <button className="btn-secondary" onClick={() => {
                    setJoinCode(createdRoom.code);
                    setTab('manage');
                    handleJoin();
                  }}>
                    📋 관리 탭으로 이동
                  </button>
                  <button className="btn-sm" style={{ width: '100%' }} onClick={() => { setCreatedRoom(null); setTopic(''); setRoomPw(''); }}>
                    새 수업 만들기
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 수업 관리 ───────────────────────────────────────────────── */}
        {tab === 'manage' && !room && (
          <div className="card" style={{ maxWidth: '100%' }}>
            <p className="card-title">수업 입장</p>
            <p className="card-subtitle">관리할 방 코드를 입력하세요</p>
            <div className="field">
              <label>방 코드</label>
              <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
                placeholder="AB3K9" style={{ textTransform: 'uppercase', textAlign: 'center', fontSize: 20, letterSpacing: '.1em' }}
                maxLength={5} onKeyDown={e => e.key === 'Enter' && handleJoin()} autoFocus />
            </div>
            <div className="field">
              <label>방 비밀번호 (설정된 경우)</label>
              <input type="password" value={joinPw} onChange={e => setJoinPw(e.target.value)} placeholder="없으면 비워두세요" />
            </div>
            {err && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 10 }}>{err}</p>}
            <button className="btn-primary" onClick={handleJoin} disabled={loading}>입장</button>
          </div>
        )}

        {tab === 'manage' && room && (
          <div>
            {/* Room info bar */}
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
              <span className="badge badge-purple">{room.id}</span>
              <h2 style={{ fontSize: 18, fontWeight: 800 }}>{room.topic}</h2>
              <span style={{ color: 'var(--ink-muted)', fontSize: 13 }}>
                전체 {ideas.length}개 · 표시 {ideas.filter(i => i.visible).length}개 · 숨김 {ideas.filter(i => !i.visible).length}개
              </span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                <button className="btn-sm" onClick={() => window.open(`#/board/${room.id}`, '_blank')}>🖥 칠판 열기</button>
                <button className="btn-sm" onClick={() => { setRoom(null); setIdeas([]); unsubRef.current?.(); }}>← 다른 방</button>
              </div>
            </div>

            {/* QR 미니 */}
            <details style={{ marginBottom: 16 }}>
              <summary style={{ cursor: 'pointer', fontSize: 13, color: 'var(--primary)', fontWeight: 600, marginBottom: 8 }}>
                📱 학생 QR 보기
              </summary>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '12px 0' }}>
                <QRCodeSVG value={joinUrl(room.id)} size={120} level="M" style={{ borderRadius: 8, background: '#fff', padding: 8 }} />
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>학생 입장 URL</p>
                  <p style={{ fontSize: 12, color: 'var(--ink-muted)', wordBreak: 'break-all' }}>{joinUrl(room.id)}</p>
                </div>
              </div>
            </details>

            {/* Ideas table */}
            {ideas.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--ink-muted)' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
                <p>아직 아이디어가 없습니다.</p>
              </div>
            ) : (
              <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
                <table className="idea-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>아이디어</th>
                      <th>작성자</th>
                      <th>시간</th>
                      <th>상태</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {ideas.map((idea, i) => (
                      <tr key={idea.id} className={!idea.visible ? 'hidden-row' : ''}>
                        <td style={{ color: 'var(--ink-muted)', fontSize: 12 }}>{i + 1}</td>
                        <td style={{ maxWidth: 300 }}>{idea.text}</td>
                        <td style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{idea.authorName}</td>
                        <td style={{ color: 'var(--ink-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>{formatTime(idea.createdAt)}</td>
                        <td>
                          <span className={`badge ${idea.visible ? 'badge-green' : ''}`}
                            style={!idea.visible ? { background: '#f1f5f9', color: 'var(--ink-muted)' } : {}}>
                            {idea.visible ? '표시' : '숨김'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn-sm" onClick={() => setIdeaVisible(room.id, idea.id, !idea.visible)}>
                              {idea.visible ? '숨기기' : '표시'}
                            </button>
                            <button className="btn-danger" onClick={() => {
                              if (window.confirm('이 아이디어를 삭제할까요?')) deleteIdea(room.id, idea.id);
                            }}>삭제</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toasts */}
      <div className="toast-wrap">
        {toasts.map(t => <div key={t.id} className="toast">{t.msg}</div>)}
      </div>
    </div>
  );
}
