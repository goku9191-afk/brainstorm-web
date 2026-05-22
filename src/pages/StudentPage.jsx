import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRoom, addIdea, subscribeIdeas } from '../lib/firebase';

export default function StudentPage() {
  const { roomCode: paramCode } = useParams();
  const nav = useNavigate();

  const [step, setStep] = useState(paramCode ? 'name' : 'code'); // 'code' | 'name' | 'board'
  const [roomCode, setRoomCode] = useState((paramCode ?? '').toUpperCase());
  const [room, setRoom] = useState(null);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [myIdeas, setMyIdeas] = useState([]);
  const [allIdeas, setAllIdeas] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const unsubRef = useRef(null);
  const textareaRef = useRef(null);

  // QR 링크로 들어온 경우 방 코드 자동 확인
  useEffect(() => {
    if (paramCode) handleJoinRoom(paramCode.toUpperCase());
  }, []);

  async function handleJoinRoom(code) {
    const c = (code ?? roomCode).toUpperCase().trim();
    if (!c) { setError('방 코드를 입력하세요.'); return; }
    setError('');
    const r = await getRoom(c).catch(() => null);
    if (!r) { setError('방을 찾을 수 없어요. 코드를 다시 확인하세요.'); return; }
    setRoom(r);
    setRoomCode(c);
    setStep('name');
  }

  function handleEnterBoard() {
    const n = name.trim();
    if (!n) { setError('이름을 입력하세요.'); return; }
    setError('');
    setStep('board');
    // 실시간 아이디어 구독
    unsubRef.current = subscribeIdeas(roomCode, ideas => {
      setAllIdeas(ideas);
      setMyIdeas(ideas.filter(i => i.authorName === n));
    });
  }

  useEffect(() => () => unsubRef.current?.(), []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      await addIdea({ roomCode, text, authorName: name });
      setText('');
      textareaRef.current?.focus();
    } catch {
      setError('전송에 실패했어요. 다시 시도하세요.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Step 1: 코드 입력 ────────────────────────────────────────────────
  if (step === 'code') return (
    <div className="page-center">
      <div className="card">
        <div style={{ fontSize: 36, marginBottom: 8 }}>🧠</div>
        <p className="card-title">수업 참여하기</p>
        <p className="card-subtitle">선생님이 알려준 방 코드를 입력하세요</p>

        <div className="field">
          <label>방 코드</label>
          <input
            value={roomCode}
            onChange={e => setRoomCode(e.target.value.toUpperCase())}
            placeholder="예: AB3K9"
            maxLength={5}
            style={{ textTransform: 'uppercase', fontSize: 22, letterSpacing: '.1em', textAlign: 'center' }}
            onKeyDown={e => e.key === 'Enter' && handleJoinRoom()}
          />
        </div>
        {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{error}</p>}
        <button className="btn-primary" onClick={() => handleJoinRoom()}>입장하기</button>
      </div>
    </div>
  );

  // ── Step 2: 이름 입력 ────────────────────────────────────────────────
  if (step === 'name') return (
    <div className="page-center">
      <div className="card">
        <span className="badge badge-purple" style={{ marginBottom: 12 }}>{roomCode}</span>
        <p className="card-title">{room?.topic || '브레인스토밍'}</p>
        <p className="card-subtitle">참여할 이름을 입력하세요</p>

        <div className="field">
          <label>이름</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="예: 홍길동"
            onKeyDown={e => e.key === 'Enter' && handleEnterBoard()}
            autoFocus
          />
        </div>
        {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{error}</p>}
        <button className="btn-primary" onClick={handleEnterBoard}>시작하기</button>
        <button className="btn-sm" style={{ width: '100%', marginTop: 8 }} onClick={() => nav('/')}>← 돌아가기</button>
      </div>
    </div>
  );

  // ── Step 3: 아이디어 입력 ────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header">
        <span style={{ fontSize: 22 }}>🧠</span>
        <div>
          <h1 style={{ fontSize: 16 }}>{room?.topic || '브레인스토밍'}</h1>
          <p style={{ fontSize: 12, color: 'var(--ink-muted)', margin: 0 }}>{name} · {roomCode}</p>
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--ink-muted)' }}>
          전체 {allIdeas.filter(i => i.visible).length}개
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
          <textarea
            ref={textareaRef}
            rows={3}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="아이디어를 자유롭게 적어보세요!"
            style={{ marginBottom: 10 }}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit(e);
            }}
          />
          {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 8 }}>{error}</p>}
          <button
            type="submit"
            className="btn-primary"
            disabled={submitting || !text.trim()}
            style={{ opacity: submitting || !text.trim() ? .5 : 1 }}
          >
            {submitting ? '전송 중…' : '💡 아이디어 제출'}
          </button>
          <p style={{ fontSize: 11, color: 'var(--ink-muted)', textAlign: 'center', marginTop: 6 }}>
            Ctrl+Enter로도 제출 가능
          </p>
        </form>

        {myIdeas.length > 0 && (
          <>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-muted)', marginBottom: 8 }}>
              내가 제출한 아이디어 ({myIdeas.length}개)
            </p>
            {myIdeas.slice().reverse().map(idea => (
              <div key={idea.id} className="idea-chip">
                {idea.text}
                {!idea.visible && <span style={{ fontSize: 11, marginLeft: 8, opacity: .6 }}>(선생님이 숨김)</span>}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
