import { initializeApp } from "https://gstatic.com";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://gstatic.com";
import { getFirestore, collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp } from "https://gstatic.com";

const firebaseConfig = {
  apiKey: "AIzaSyCHYNtlZWcz87KD3a29byrDkBM2dQTDjWE",
  authDomain: "://firebaseapp.com",
  projectId: "superchat-bd-48a39",
  storageBucket: "superchat-bd-48a39.firebasestorage.app",
  messagingSenderId: "539120964827",
  appId: "1:539120964827:web:56d0c23e48aa37d00368fe",
  measurementId: "G-DYYCYBDYMD"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
let currentUser = null;

// ইউজার লগইন স্টেট চেক
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('userEmailDisplay').textContent = user.email;
    loadRealtimeMessages();
  } else {
    currentUser = null;
    document.getElementById('authScreen').style.display = 'flex';
  }
});

// নতুন অ্যাকাউন্ট খোলা
window.registerUser = async () => {
  const email = document.getElementById('authEmail').value.trim();
  const pass = document.getElementById('authPass').value;
  try {
    await createUserWithEmailAndPassword(auth, email, pass);
  } catch (e) { document.getElementById('authError').textContent = "ত্রুটি: " + e.message; }
};

// লগইন করা
window.loginUser = async () => {
  const email = document.getElementById('authEmail').value.trim();
  const pass = document.getElementById('authPass').value;
  try {
    await signInWithEmailAndPassword(auth, email, pass);
  } catch (e) { document.getElementById('authError').textContent = "ভুল ইমেইল বা পাসওয়ার্ড!"; }
};

window.logoutUser = () => signOut(auth);

// রিয়েল-টাইম মেসেজ পাঠানো
window.sendMessage = async () => {
  const input = document.getElementById('messageInput');
  const text = input.value.trim();
  if (!text || !currentUser) return;
  input.value = '';
  await addDoc(collection(db, "global_chat"), {
    text: text,
    sender: currentUser.email.split('@')[0],
    uid: currentUser.uid,
    createdAt: serverTimestamp()
  });
};

// সার্ভার থেকে লাইভ মেসেজ লোড করা
function loadRealtimeMessages() {
  const q = query(collection(db, "global_chat"), orderBy("createdAt", "asc"), limit(50));
  onSnapshot(q, (snapshot) => {
    const msgBox = document.getElementById('chatMessages');
    msgBox.innerHTML = '';
    snapshot.forEach((doc) => {
      const data = doc.data();
      const isMe = currentUser && data.uid === currentUser.uid;
      const div = document.createElement('div');
      div.className = 'msg ' + (isMe ? 'sent' : 'received');
      
      const senderTag = document.createElement('span');
      senderTag.className = 'msg-sender';
      senderTag.textContent = isMe ? 'আপনি' : data.sender;
      
      const textNode = document.createElement('div');
      textNode.textContent = data.text;
      
      div.appendChild(senderTag);
      div.appendChild(textNode);
      msgBox.appendChild(div);
      document.getElementById('last-msg-preview').textContent = data.sender + ": " + data.text;
    });
    msgBox.scrollTop = msgBox.scrollHeight;
  });
}

// ট্যাব ও চ্যাট রুম কন্ট্রোল
window.switchTab = (tabId, title, btn) => {
  document.querySelectorAll('.tab-page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(tabId).classList.add('active');
  btn.classList.add('active');
  document.querySelector('.header-title span').textContent = title;
};

window.openChat = (name) => {
  document.getElementById('chatPartnerName').textContent = name;
  document.getElementById('chatRoom').classList.add('open');
};

window.closeChat = () => document.getElementById('chatRoom').classList.remove('open');

// অ্যান্টি-হ্যাক শিল্ড
document.addEventListener('keydown', e => {
  if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && ['I','J','C'].includes(e.key)) || (e.ctrlKey && e.key === 'U')) e.preventDefault();
});
