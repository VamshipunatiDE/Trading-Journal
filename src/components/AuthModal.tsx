import React, { useState } from 'react';
import { X, LogIn, UserPlus, Sparkles, Check, AlertCircle } from 'lucide-react';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  currentUser: User | null;
  onClose: () => void;
  onSeedSampleData?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  currentUser,
  onClose,
  onSeedSampleData
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      if (auth && googleProvider) {
        await signInWithPopup(auth, googleProvider);
        onClose();
      } else {
        setError('Firebase Auth is not initialized');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setError('');
      setLoading(true);
      if (!auth) throw new Error('Firebase Auth unavailable');

      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (auth) {
      await signOut(auth);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#12161E] text-white border border-gray-800 rounded-3xl w-full max-w-md p-6 shadow-2xl relative overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {currentUser ? (
          /* Logged In View */
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#3ED9B8]/20 border-2 border-[#3ED9B8] flex items-center justify-center mx-auto text-[#3ED9B8] font-bold text-2xl font-display">
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt="User" className="w-full h-full rounded-full object-cover" />
              ) : (
                (currentUser.displayName || currentUser.email || 'U').substring(0, 2).toUpperCase()
              )}
            </div>

            <div>
              <h3 className="text-lg font-display font-semibold text-white">
                {currentUser.displayName || 'Authenticated Trader'}
              </h3>
              <p className="text-xs text-gray-400 font-mono">{currentUser.email}</p>
            </div>

            <div className="bg-[#191F2A] border border-gray-800 rounded-2xl p-4 text-xs text-gray-300 space-y-2 text-left">
              <div className="flex items-center gap-2 text-[#3ED9B8] font-medium">
                <Check className="w-4 h-4" />
                Firebase Realtime Synchronization Active
              </div>
              <p className="text-gray-400">Your trades, watchlist, notes, and settings are saved securely per user account in Firestore.</p>
            </div>

            {onSeedSampleData && (
              <button
                type="button"
                onClick={() => {
                  onSeedSampleData();
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl bg-[#191F2A] hover:bg-[#222a38] text-[#3ED9B8] font-medium text-xs border border-gray-800 flex items-center justify-center gap-2 transition"
              >
                <Sparkles className="w-4 h-4" />
                Load Sample Trades & Journal Data
              </button>
            )}

            <button
              onClick={handleSignOut}
              className="w-full py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold text-xs border border-red-500/30 transition"
            >
              Sign Out
            </button>
          </div>
        ) : (
          /* Login / Sign Up Form */
          <div className="space-y-5">
            <div>
              <h3 className="text-xl font-display font-bold text-white">
                {isSignUp ? 'Create Trading Journal Account' : 'Sign In to Trading Journal'}
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Sync your trades securely across devices with Firebase
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Google Login Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-[#191F2A] hover:bg-[#222a38] border border-gray-700 text-white font-medium text-sm flex items-center justify-center gap-3 transition"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-3 my-2 text-gray-500 text-xs">
              <div className="flex-1 h-px bg-gray-800" />
              <span>or email</span>
              <div className="flex-1 h-px bg-gray-800" />
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="trader@example.com"
                  className="w-full bg-[#161B24] border border-gray-800 rounded-xl px-3 py-2 text-white text-sm focus:border-[#3ED9B8] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#161B24] border border-gray-800 rounded-xl px-3 py-2 text-white text-sm focus:border-[#3ED9B8] focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-[#3ED9B8] hover:bg-[#34c4a5] text-black font-semibold text-sm transition shadow-md mt-2"
              >
                {loading ? 'Processing...' : isSignUp ? 'Sign Up Account' : 'Sign In'}
              </button>
            </form>

            <div className="text-center text-xs text-gray-400 pt-2">
              {isSignUp ? (
                <button onClick={() => setIsSignUp(false)} className="text-[#3ED9B8] underline">
                  Already have an account? Sign in
                </button>
              ) : (
                <button onClick={() => setIsSignUp(true)} className="text-[#3ED9B8] underline">
                  Need an account? Sign up
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
