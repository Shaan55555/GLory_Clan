import React, { useRef, useState, useEffect, useCallback } from 'react';
import './App.css';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  query,
  orderBy,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  Timestamp,
  writeBatch,
  getDocs,
  limit,
  startAfter,
  onSnapshot
} from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { DateTime } from 'luxon';
import CustomLogin from './CutomLogin';


// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBRbPa3-67A14AkpM5QoTElBxx1Yf-wXcU",
  authDomain: "glory-clan.firebaseapp.com",
  projectId: "glory-clan",
  storageBucket: "glory-clan.firebasestorage.app",
  messagingSenderId: "1011582654353",
  appId: "1:1011582654353:web:6a415ad8d82be6cd8a2c30",
  measurementId: "G-001LJMCHJK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);

function App() {
  const [user] = useAuthState(auth);
  const [userName, setUserName] = useState("");
  const [isNameSet, setIsNameSet] = useState(false);
  const [isNameChangeModalOpen, setIsNameChangeModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      const checkName = async () => {
        const userRef = doc(firestore, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          setUserName(userDoc.data().displayName);
          setIsNameSet(true);
        }
      };
      checkName();
    }
  }, [user]);

  const updateName = async (newName) => {
    if (!user || !newName.trim()) return;

    const newDisplayName = newName.trim();
    const lowerNewName = newDisplayName.toLowerCase();

    const userRef = doc(firestore, 'users', user.uid);
    const usernameRef = doc(firestore, 'usernames', lowerNewName);

    try {
      const usernameDoc = await getDoc(usernameRef);

      if (usernameDoc.exists() && usernameDoc.data().uid !== user.uid) {
        alert("This name is already taken, please choose a different one.");
        return;
      }

      const userDoc = await getDoc(userRef);
      const oldName = userDoc.exists() ? userDoc.data().displayName?.toLowerCase() : null;
      const oldUsernameRef = oldName ? doc(firestore, 'usernames', oldName) : null;

      const batch = writeBatch(firestore);

      batch.set(usernameRef, { uid: user.uid });
      batch.set(userRef, { displayName: newDisplayName }, { merge: true });

      if (oldUsernameRef && oldName !== lowerNewName) {
        batch.delete(oldUsernameRef);
      }

      await batch.commit();

      setUserName(newDisplayName);
      setIsNameSet(true);
      setIsNameChangeModalOpen(false);
    } catch (error) {
      console.error("Error updating name:", error);
      alert("There was an error updating your display name.");
    }
  };

  // Scroll to the bottom when the page loads
  useEffect(() => {
    window.scrollTo(0, document.body.scrollHeight);
  }, []);

  return (
    <div className="App">
      <header>
        <h1>
          <span className="logo">
            <img src="/GL_Logon.png" alt="NFN Logo" style={{ height: '40px', width: 'auto' }} />
          </span>
          Forum of the Sword Battle.io{'{GL}'}
        </h1>
        <div className="right-side">
          <p>Made by Shaan</p>
          {user && (
            <>
              <button className="change-name-button" onClick={() => setIsNameChangeModalOpen(true)}>
                Change Name
              </button>
              <SignOut />
            </>
          )}
        </div>
      </header>

      <section>
        {user ? (
          isNameSet ? (
            <ChatRoom userName={userName} onChangeName={updateName} />
          ) : (
            <SetNameForm onSetName={updateName} />
          )
        ) : (
          <SignIn />
        )}
      </section>

      {isNameChangeModalOpen && (
        <div className="name-change-modal">
          <div className="modal-content">
            <h2>Change Your Display Name</h2>
            <ChangeNameForm
              currentName={userName}
              onSubmit={(newName) => updateName(newName)}
              onCancel={() => setIsNameChangeModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function SignIn() {
  const [showModal, setShowModal] = useState(false);
  const signInWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider).catch((error) => {
      console.error('Error during sign-in:', error.message);
    });
  };

  return (
    <div className="sign-in-container">
      <img src="/GL_Logon.png" alt="NFN Logo" className="big-logo" />
      <p className="welcome-text">
        <span>Welcome to the</span>
        <span>GL Clan Forum</span>
      </p>
      <button className="google-sign-in" onClick={signInWithGoogle}>Sign in with Google</button>
      <button
        onClick={() => setShowModal(true)}
        className="custom-sign-in"
      >
        Login / Sign Up
      </button>

      {/* Popup Modal */}
      {showModal && <CustomLogin onClose={() => setShowModal(false)} />}
    </div>
  );
}

function SignOut() {
  return auth.currentUser && (
    <button className="sign-out" onClick={() => signOut(auth)}>Sign Out</button>
  );
}

function SetNameForm({ onSetName }) {
  const [newName, setNewName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newName.trim()) {
      onSetName(newName);
    } else {
      alert("Name cannot be empty.");
    }
  };

  return (
    <div className="set-name-form">
      <h2>Set Your Display Name</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter your display name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <button type="submit">Set Name</button>
      </form>
    </div>
  );
}

function ChangeNameForm({ currentName, onSubmit, onCancel }) {
  const [newName, setNewName] = useState(currentName || '');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newName.trim()) {
      onSubmit(newName.trim());
    } else {
      alert("Name cannot be empty.");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        ref={inputRef}
        type="text"
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        placeholder="Enter new display name"
      />
      <div className="modal-buttons">
        <button type="submit">Save</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

function ChatRoom({ userName, onChangeName }) {
  const dummy = useRef();
  const messagesRef = collection(firestore, 'messages');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const [isDisappearing, setIsDisappearing] = useState(false);
  const [timeLimit, setTimeLimit] = useState(10);
  const [formValue, setFormValue] = useState('');

  const chatBoxRef = useRef();
  const [, forceUpdate] = useState(0);

  // Fetch initial messages and older messages (pagination)
  const fetchMessages = useCallback(async (loadMore = false) => {
    if (loading || (!hasMore && loadMore)) return;
    setLoading(true);

    const chatBox = chatBoxRef.current;
    const previousScrollHeight = chatBox?.scrollHeight;
    const previousScrollTop = chatBox?.scrollTop;

    try {
      const q = query(
        messagesRef,
        orderBy('createdAt', 'desc'),
        ...(loadMore && lastDoc ? [startAfter(lastDoc)] : []),
        limit(20)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const newMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const reversed = newMessages.reverse();

        setMessages(prev =>
          loadMore ? [...reversed, ...prev] : reversed
        );

        setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
        if (snapshot.docs.length < 20) setHasMore(false);

        if (loadMore && chatBox) {
          setTimeout(() => {
            const newScrollHeight = chatBox.scrollHeight;
            chatBox.scrollTop = newScrollHeight - previousScrollHeight + previousScrollTop;
          }, 50);
        } else {
            // Delay scroll to bottom slightly to ensure DOM is updated
            setTimeout(() => {
              dummy.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }

      } else {
        setHasMore(false);
      }
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, lastDoc, messagesRef]);

  // Scroll event for loading older messages
  useEffect(() => {
    const chatBox = chatBoxRef.current;
    if (!chatBox) return;

    const handleScroll = () => {
      if (chatBox.scrollTop === 0 && hasMore && !loading) {
        fetchMessages(true);
      }
    };

    chatBox.addEventListener('scroll', handleScroll);
    return () => chatBox.removeEventListener('scroll', handleScroll);
  }, [hasMore, loading, fetchMessages]);

  // One-time initial fetch
  useEffect(() => {
    fetchMessages();
  }, []);

  // Real-time listener for new messages
  useEffect(() => {
    const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(1));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const doc = snapshot.docs[0];
      if (!doc) return;
      const newMsg = { id: doc.id, ...doc.data() };

      setMessages(prev => {
        if (!prev.some(m => m.id === newMsg.id)) {
          return [...prev, newMsg].sort((a, b) => a.createdAt?.seconds - b.createdAt?.seconds);
        }
        return prev;
      });

      dummy.current?.scrollIntoView({ behavior: 'smooth' });
    });

    return () => unsubscribe();
  }, []);

  // Force re-render to remove expired disappearing messages
  useEffect(() => {
    const interval = setInterval(() => {
      forceUpdate(n => n + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const sendMessage = async (e) => {
    e.preventDefault();
    const { uid, photoURL } = auth.currentUser;
    const currentTime = new Date().getTime();
    let expiresAt = null;

    if (isDisappearing) {
      expiresAt = currentTime + timeLimit * 1000;
    }

    const messageToSend = {
      text: formValue,
      createdAt: serverTimestamp(),
      uid,
      photoURL,
      displayName: userName,
      ...(isDisappearing && { expiresAt: Timestamp.fromDate(new Date(expiresAt)) })
    };

    setFormValue('');
    dummy.current.scrollIntoView({ behavior: 'smooth' });

    try {
      await addDoc(messagesRef, messageToSend);
    } catch (error) {
      console.error("Message failed to send:", error);
      alert("Failed to send message. Please try again.");
      setFormValue(messageToSend.text);
    }
  };

  return (
    <div>
      <main ref={chatBoxRef} style={{ overflowY: 'auto', height: '70vh' }}>
        {loading && <p style={{ textAlign: 'center' }}>⏳ Loading...</p>}
        {messages
          .filter(msg => !msg.expiresAt || msg.expiresAt.toDate() > new Date())
          .map((msg) => <ChatMessage key={msg.id} message={msg} />)}
        <span ref={dummy}></span>
      </main>

      <form onSubmit={sendMessage}>
        <input
          value={formValue}
          onChange={(e) => setFormValue(e.target.value)}
          placeholder="Say something nice"
        />
        <button type="submit" disabled={!formValue}>
          <img src="./send_icon.png" alt="Send icon" style={{ width: '40px', height: '40px' }} />
        </button>

        <label className='vanishing-texts'>
          <input
            type="checkbox"
            checked={isDisappearing}
            onChange={() => setIsDisappearing(!isDisappearing)}
          />
          Vanishing texts
        </label>

        {isDisappearing && (
          <select value={timeLimit} onChange={(e) => setTimeLimit(Number(e.target.value))}>
            <option value={5}>5 seconds</option>
            <option value={10}>10 seconds</option>
            <option value={30}>30 seconds</option>
            <option value={60}>1 minute</option>
            <option value={300}>5 minutes</option>
          </select>
        )}
      </form>
    </div>
  );
}


function ChatMessage({ message }) {
  const { text, uid, photoURL, createdAt, displayName } = message;
  const messageClass = uid === auth.currentUser.uid ? 'sent' : 'received';

  const [timezone, setTimezone] = useState('UTC');

  useEffect(() => {
    const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimezone(browserTimezone || 'UTC');
  }, []);

  let localTime = '';
  if (createdAt?.seconds) {
    localTime = DateTime
      .fromSeconds(createdAt.seconds)
      .setZone(timezone)
      .toFormat('dd-MM-yy hh:mm a');
  }
  return (
    <div className={`message ${messageClass}`}>
      <img
        src={photoURL || 'https://api.adorable.io/avatars/23/abott@adorable.png'}
        alt="avatar"
        onError={(e) => {
          e.target.onerror = null; // Prevent infinite loop
          e.target.src = './discord-logo.jpg'; // Local fallback
        }}
      />
      <div className="bubble">
        <small className="sender-name" style={{ color: '#aaa', fontSize: '0.75rem', marginLeft: '10px' }}>
          {displayName || 'Anonymous'}
        </small>
        <p className="message-text">{text}</p>
        <small className="timestamp">{localTime}</small>
      </div>
    </div>
  );
}

export default App;