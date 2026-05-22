import { initializeApp } from 'firebase/app';
import {
  getFirestore, collection, addDoc, onSnapshot,
  query, orderBy, doc, updateDoc, deleteDoc, setDoc, getDoc, serverTimestamp,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// ── Room ────────────────────────────────────────────────────────────
export async function createRoom({ code, topic, password }) {
  await setDoc(doc(db, 'rooms', code), {
    topic,
    password,
    createdAt: serverTimestamp(),
    active: true,
  });
}

export async function getRoom(code) {
  const snap = await getDoc(doc(db, 'rooms', code));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export function subscribeRoom(code, cb) {
  return onSnapshot(doc(db, 'rooms', code), snap =>
    cb(snap.exists() ? { id: snap.id, ...snap.data() } : null)
  );
}

// ── Ideas ───────────────────────────────────────────────────────────
export async function addIdea({ roomCode, text, authorName }) {
  await addDoc(collection(db, 'rooms', roomCode, 'ideas'), {
    text: text.trim(),
    authorName: authorName.trim(),
    createdAt: serverTimestamp(),
    visible: true,
  });
}

export function subscribeIdeas(roomCode, cb) {
  const q = query(collection(db, 'rooms', roomCode, 'ideas'), orderBy('createdAt', 'asc'));
  return onSnapshot(q, snap => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
}

export async function setIdeaVisible(roomCode, ideaId, visible) {
  await updateDoc(doc(db, 'rooms', roomCode, 'ideas', ideaId), { visible });
}

export async function deleteIdea(roomCode, ideaId) {
  await deleteDoc(doc(db, 'rooms', roomCode, 'ideas', ideaId));
}

// ── Room code generator ─────────────────────────────────────────────
export function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}
