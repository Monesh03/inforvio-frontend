import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState('loading'); // 'loading'|'success'|'error'
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const token = params.get('token');
    if (!token) { setStatus('error'); setMsg('No verification token found.'); return; }
    axios.get(`http://localhost:5000/api/auth/verify-email?token=${token}`)
      .then(({ data }) => { setStatus('success'); setMsg(data.message); })
      .catch((err) => { setStatus('error'); setMsg(err.response?.data?.message || 'Verification failed'); });
  }, [params]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="flex items-center px-8 py-5 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-gray-800">Inforvio</h1>
      </header>
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-sm text-center bg-white rounded-2xl shadow-lg border border-gray-100 p-10">
          {status === 'loading' && (
            <>
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500 text-sm">Verifying your email…</p>
            </>
          )}
          {status === 'success' && (
            <>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-800 mb-2">Email Verified!</h2>
              <p className="text-sm text-gray-500 mb-6">{msg}</p>
              <a href="/" className="inline-block px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                Go to Sign  In →
              </a>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-800 mb-2">Verification Failed</h2>
              <p className="text-sm text-gray-500 mb-6">{msg}</p>
              <a href="/" className="inline-block px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                Back to Sign  In
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
