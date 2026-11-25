import { initializeApp } from "https://gstatic.com";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://gstatic.com";
import { getFirestore, collection, addDoc, query, orderBy, limit, onSnapshot, serverTimestamp } from "https://gstatic.com";

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
}

const firebaseConfig = {
  apiKey: "AIzaSyCHYNtlZWcz87KD3a29byrDkBM2dQTDjWE",
  authDomain: "://firebaseapp.com",
  projectId: "superchat-bd-48a39",
  storageBucket: "superchat-bd-48a39.firebasestorage.app",
  messagingSenderId: "539120964827",
  appId: "1:539120964827:web:56d0c23e48aa37d00368fe"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
let currentUser = null;

// লগইন অবস্থা চেক ও WeChat ওয়েলকাম স্ক্রিন কন্ট্রোল
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    document.getElementById('wechatSplash').style.display = 'none';
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('userEmailDisplay').textContent = user.email;
    loadRealtimeData();
  } else {
    currentUser = null;
    document.getElementById('wechatSplash').style.display = 'flex';
  }
});

// নতুন অ্যাকাউন্ট তৈরি (Sign Up)
document.getElementById('btnRegister').addEventListener('click', async () => {
  const email = document.getElementById('authEmail').value.trim();
  const pass = document.getElementById('authPass').value;
  const err = document.getElementById('authError');
  if (!email || pass.length < 6) { err.style.color = "red"; err.textContent = "সঠিক ইমেইল এবং কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন!"; return; }
  err.style.color = "#07C160"; err.textContent = "নিরাপদ অ্যাকাউন্ট তৈরি হচ্ছে...";
  try { await createUserWithEmailAndPassword(auth, email, pass); } 
  catch (e) { err.style.color = "red"; err.textContent = "সমস্যা: " + e.message; }
});

// লগইন (Log In)
document.getElementById('btnLogin').addEventListener('click', async () => {
  const email = document.getElementById('authEmail').value.trim();
  const pass = document.getElementById('authPass').value;
  const err = document.getElementById('authError');
  if (!email || !pass) { err.style.color = "red"; err.textContent = "ইমেইল ও পাসওয়ার্ড দিন!"; return; }
  err.style.color = "#07C160"; err.textContent = "লগইন হচ্ছে...";
  try { await signInWithEmailAndPassword(auth, email, pass); } 
  catch (e) { err.style.color = "red"; err.textContent = "লগইন ব্যর্থ: " + e.message; }
});

document.getElementById('btnLogout').addEventListener('click', () => signOut(auth));

// রিয়েল-টাইম মেসেজ পাঠানো
document.getElementById('btnSend').addEventListener('click', async () => {
  const input = document.getElementById('messageInput');
  const text = input.value.trim();
  if (!text || !currentUser) return;
  input.value = '';
  await addDoc(collection(db, "global_chat"), {
    type: "msg",
    text: text,
    sender: currentUser.email.split('@')[0],
    uid: currentUser.uid,
    createdAt: serverTimestamp()
  });
});

// নিরাপদ YouTube ভিডিও লিংক যাচাই ও পোস্ট করা (XSS সুরক্ষিত)
document.getElementById('btnPostVideo').addEventListener('click', async () => {
  const urlInput = document.getElementById('videoUrlInput');
  const url = urlInput.value.trim();
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  if (!match || !currentUser) { alert("সঠিক YouTube ভিডিও লিংক দিন!"); return; }
  urlInput.value = '';
  await addDoc(collection(db, "global_chat"), {
    type: "video",
    text: match[1],
    sender: currentUser.email.split('@')[0],
    uid: currentUser.uid,
    createdAt: serverTimestamp()
  });
});

// সার্ভার থেকে চ্যাট ও ভিডিও ফিড লোড করা
function loadRealtimeData() {
  const q = query(collection(db, "global_chat"), orderBy("createdAt", "asc"), limit(50));
  onSnapshot(q, (snap) => {
    const chatBox = document.getElementById('chatMessages');
    const videoList = document.getElementById('videoFeedList');
    chatBox.innerHTML = '';
    videoList.innerHTML = '';

    snap.forEach((doc) => {
      const d = doc.data();
      if (d.type === "video") {
        const vCard = document.createElement('div');
        vCard.className = 'video-box';
        const title = document.createElement('p');
        title.style.fontSize = '13px'; title.style.fontWeight = 'bold';
        title.textContent = "🎬 শেয়ার করেছেন: " + d.sender;
        const iframe = document.createElement('iframe');
        iframe.className = 'video-frame';
        iframe.src = "https://youtube.com" + d.text;
        iframe.allowFullscreen = true;
        vCard.appendChild(title); vCard.appendChild(iframe);
        videoList.prepend(vCard);
      } else {
        const isMe = currentUser && d.uid === currentUser.uid;
        const div = document.createElement('div');
        div.className = 'msg ' + (isMe ? 'sent' : 'received');
        const senderTag = document.createElement('span');
        senderTag.className = 'msg-sender';
        senderTag.textContent = isMe ? 'আপনি' : d.sender;
        const t = document.createElement('div');
        t.textContent = d.text;
        div.appendChild(senderTag); div.appendChild(t);
        chatBox.appendChild(div);
        document.getElementById('last-msg-preview').textContent = d.sender + ": " + d.text;
      }
    });
    chatBox.scrollTop = chatBox.scrollHeight;
  });
}

// অ্যান্টি-হ্যাক শিল্ড
document.addEventListener('keydown', e => {
  if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && ['I','J','C'].includes(e.key)) || (e.ctrlKey && e.key === 'U')) e.preventDefault();
});
