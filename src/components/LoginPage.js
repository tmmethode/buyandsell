import React, { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, AlertCircle, LogIn, Mail, Lock } from 'lucide-react';
import apiBaseUrl from '../config';
import Header from './Header';

const LoginPage = ({ onSectionChange }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [remember, setRemember] = useState(true);

  useEffect(() => {
    // Prefill remembered email
    try {
      const remembered = localStorage.getItem('rememberEmail');
      if (remembered) setEmail(remembered);
    } catch {}
  }, []);

  const isValidEmail = useMemo(() => /[^@\s]+@[^@\s]+\.[^@\s]+/.test(email), [email]);
  const isFormValid = useMemo(() => isValidEmail && password.length >= 6, [isValidEmail, password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!apiBaseUrl) {
        setError('Missing API base URL');
        setLoading(false);
        return;
      }

      const response = await fetch(`${apiBaseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Persist auth
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      if (remember) {
        try { localStorage.setItem('rememberEmail', email); } catch {}
      } else {
        try { localStorage.removeItem('rememberEmail'); } catch {}
      }

      // After successful login, route everyone to the dashboard base.
      // Admins will see analytics; non-admins will be redirected to /dashboard/houses by the app.
      onSectionChange && onSectionChange('admin');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onSectionChange={onSectionChange} activeSection="home" hideAuthButtons={true} />

      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Left panel */}
          <div className="hidden md:flex relative rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 p-10 text-white">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
            <div className="relative z-10 flex flex-col justify-center">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <LogIn className="w-7 h-7" />
                </div>
                <div>
                  <div className="text-2xl font-bold">Welcome back</div>
                  <div className="text-white/80">Sign in to continue</div>
                </div>
              </div>
              <ul className="space-y-3 text-white/90">
                <li className="flex items-start space-x-3"><span className="mt-1 block w-2 h-2 rounded-full bg-white" /> Secure account access</li>
                <li className="flex items-start space-x-3"><span className="mt-1 block w-2 h-2 rounded-full bg-white" /> Manage your listings and profile</li>
                <li className="flex items-start space-x-3"><span className="mt-1 block w-2 h-2 rounded-full bg-white" /> Admins can access dashboard tools</li>
              </ul>
            </div>
          </div>

          {/* Right panel - form */}
          <div className="flex items-center">
            <div className="w-full bg-white border border-gray-100 shadow-sm rounded-2xl p-6 sm:p-8">
              <div className="mb-6 text-center md:text-left">
                <h1 className="text-2xl font-bold text-gray-900">Sign in</h1>
                <p className="mt-1 text-sm text-gray-600">Use your email and password to log in</p>
              </div>

              {error && (
                <div className="mb-5 rounded-md bg-red-50 p-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">{error}</h3>
                    </div>
                  </div>
                </div>
              )}

              <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                  <div className="mt-1 relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </span>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${email.length && !isValidEmail ? 'border-red-300' : 'border-gray-300'}`}
                      placeholder="you@example.com"
                      aria-invalid={email.length > 0 && !isValidEmail}
                    />
                  </div>
                  {email.length > 0 && !isValidEmail && (
                    <p className="mt-1 text-xs text-red-600">Enter a valid email address.</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                  <div className="mt-1 relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </span>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {password.length > 0 && password.length < 6 && (
                    <p className="mt-1 text-xs text-red-600">Password must be at least 6 characters.</p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <label className="inline-flex items-center space-x-2">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                    />
                    <span className="text-sm text-gray-600">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => onSectionChange && onSectionChange('contact')}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading || !isFormValid}
                  className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <span className="inline-block h-4 w-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    <>Sign in</>
                  )}
                </button>

                <p className="text-center text-xs text-gray-500">
                  By signing in, you agree to our terms and privacy policy.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
