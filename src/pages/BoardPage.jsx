import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { subscribeRoom, subscribeIdeas } from '../lib/firebase';

const COLORS = [
  '#FFD93D', '#6BCB77', '#74C7EC', '#FF9A3C',
  '#C77DFF', '#FF6B9D', '#4CC9F0', '#80FFDB',
];

function assignColor(id) {
  let hash = 0;
  for (const c of id) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
  return COLORS[Math.abs(hash) % COLORS.length];
}

export default function BoardPage() {
  const { roomCode } = useParams();
  const [room, setRoom] = useState(null);
  const [ideas, setIdeas] = useState([]);
  const unseenRef = useRef(new Set());

  useEffect(() => {
    const u1 = subscribeRoom(roomCode, setRoom);
    const u2 = subscribeIdeas(roomCode, setIdeas);
    return () => { u1(); u2(); };
  }, [roomCode]);

  const visible = ideas.filter(i => i.visible);

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 28px',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ marginBottom: 24, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 13, color: '#9895b5', fontWeight: 600, letterSpacing: '.06em', marginBottom: 4 }}>
              🧠 수업 브레인스토밍 · {roomCode}
            </p>
            <h1 style={{
              fontSize: 'clamp(22px, 3.5vw, 42px)',
              fontWeight: 900,
              color: '#ffffff',
              lineHeight: 1.2,
            }}>
              {room?.topic || '브레인스토밍'}
            </h1>
          </div>
          <div style={{
            background: 'rgba(255,255,255,.08)',
            borderRadius: 16,
            padding: '10px 20px',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: 'clamp(24px, 3vw, 40px)', fontWeight: 900, color: '#FFD93D', lineHeight: 1 }}>
              {visible.length}
            </p>
            <p style={{ fontSize: 12, color: '#9895b5', marginTop: 2 }}>아이디어</p>
          </div>
        </div>
      </div>

      {/* Post-it grid */}
      {visible.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,.3)' }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>💡</div>
            <p style={{ fontSize: 18, fontWeight: 600 }}>아이디어를 기다리는 중…</p>
            <p style={{ fontSize: 14, marginTop: 6 }}>학생들이 아이디어를 제출하면 여기에 표시됩니다</p>
          </div>
        </div>
      ) : (
        <div style={{
          flex: 1,
          overflowY: 'auto',
          columns: `clamp(160px, 22vw, 260px)`,
          columnGap: '16px',
          gap: '16px',
        }}>
          {visible.map(idea => (
            <div
              key={idea.id}
              className="postit"
              style={{
                background: assignColor(idea.id),
                marginBottom: 16,
              }}
            >
              {idea.text}
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,.2)', textAlign: 'center', marginTop: 16, flexShrink: 0 }}>
        학생 입장 코드: <strong style={{ letterSpacing: '.1em', color: 'rgba(255,255,255,.4)' }}>{roomCode}</strong>
      </p>
    </div>
  );
}
