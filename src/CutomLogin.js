// CustomLogin.js
import React, { useState } from 'react';
import {
  getAuth,
  updateProfile,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import './CustomLogin.css';

const CustomLogin = ({ onClose }) => {
  const auth = getAuth();
  const db = getFirestore();

  const [isSignup, setIsSignup] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const dummyEmail = `${username.toLowerCase()}@glforum.fake`;

    try {
      if (isSignup) {
        // Check if username exists
        const usernameDoc = await getDoc(doc(db, 'usernames', username));
        if (usernameDoc.exists()) {
          setError('Username already taken');
          return;
        }

        // Create user with dummy email
        const userCredential = await createUserWithEmailAndPassword(auth, dummyEmail, password);

        // Generate avatar URL
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
          username
        )}&background=random&color=fff`;

        // Update Firebase Auth profile
        await updateProfile(userCredential.user, {
          displayName: username,
          photoURL: avatarUrl,
        });

        // Save to Firestore
        await setDoc(doc(db, 'usernames', username), {
          uid: userCredential.user.uid,
          email: email || null,
          profileImageUrl: avatarUrl,
        });

        alert('Account created!');
        onClose();
      } else {
        // Look up username
        const q = query(collection(db, 'usernames'), where('__name__', '==', username));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          setError('Username not found');
          return;
        }

        const userDoc = snapshot.docs[0].data();
        const emailForLogin = `${username.toLowerCase()}@glforum.fake`;

        // Sign in
        await signInWithEmailAndPassword(auth, emailForLogin, password);

        alert('Logged in!');
        onClose();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <button className="close-btn" onClick={onClose}>×</button>
        <h2>{isSignup ? 'Sign Up' : 'Login'}</h2>

        {error && <p className="error-text">{error}</p>}

        <form onSubmit={handleSubmit} className="modal-form">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
          {isSignup && (
            <input
              type="email"
              placeholder="Email (optional)"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          )}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button type="submit">{isSignup ? 'Sign Up' : 'Login'}</button>
        </form>

        <p>
          {isSignup ? 'Already have an account?' : 'Don’t have an account?'}{' '}
          <span
            onClick={() => {
              setIsSignup(prev => !prev);
              setError('');
            }}
            style={{ cursor: 'pointer', color: 'blue' }}
          >
            {isSignup ? 'Login' : 'Sign up'}
          </span>
        </p>
      </div>
    </div>
  );
};

export default CustomLogin;
