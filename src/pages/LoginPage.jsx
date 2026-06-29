import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser, verifyOTP } from '../api/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'otp'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const otpRefs = useRef([]);

  const switchMode = (m) => { setMode(m); setMessage(null); setOtp(['', '', '', '', '', '']); };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      if (mode === 'register') {
        await registerUser({ email, password });
        setMode('otp');
        setMessage({ type: 'success', text: `OTP sent to ${email}. Check your inbox.` });
      } else {
        const { data } = await loginUser({ email, password });
        localStorage.setItem('token', data.token);
        navigate('/documents');
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Something went wrong' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) return setMessage({ type: 'error', text: 'Please enter the full 6-digit OTP' });
    setLoading(true);
    setMessage(null);
    try {
      const { data } = await verifyOTP({ email, otp: code });
      setMessage({ type: 'success', text: data.message + ' You can now Sign  In.' });
      setTimeout(() => switchMode('login'), 2000);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Verification failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="flex items-center px-0 sm:px-8 py-4 sm:py-5">
        <img src="/Logo.png" alt="Inforvio" className="h-12 sm:h-14 w-auto" />
      </header>

      <div className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-sm">

          {/* OTP Step */}
          {mode === 'otp' ? (
            <>
              <button onClick={() => switchMode('register')} className="text-sm text-gray-400 hover:text-gray-600 mb-6 flex items-center gap-1">
                ← Back
              </button>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">Check your email</h2>
              <p className="text-sm text-gray-500 mb-6">
                We sent a 6-digit code to <span className="font-medium text-gray-700">{email}</span>.
              </p>

              {message && (
                <div className={`mb-5 px-4 py-3 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleVerifyOTP}>
                <div className="flex gap-3 justify-between mb-6">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => (otpRefs.current[i] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-11 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 transition"
                    />
                  ))}
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  {loading ? 'Verifying…' : 'Verify OTP →'}
                </button>
              </form>
            </>
          ) : (
            <>
              {/* Sign  In heading */}
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Sign  In</h2>

              {message && (
                <div className={`mb-5 px-4 py-3 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                  />
                </div>

                {/* Password only shown for login or register */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  {loading ? 'Please wait…' : mode === 'login' ? 'Sign  In →' : 'Create Account →'}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">OR</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Create account toggle */}
              {mode === 'login' ? (
                <button
                  onClick={() => switchMode('register')}
                  className="w-full py-2.5 border border-black-600 text-black-600 hover:bg-blue-50 text-sm font-semibold rounded-lg transition-colors"
                >
                  Create an account
                </button>
              ) : (
                <button
                  onClick={() => switchMode('login')}
                  className="w-full py-2.5 border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm font-semibold rounded-lg transition-colors"
                >
                  Already have an account? Sign  In
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
