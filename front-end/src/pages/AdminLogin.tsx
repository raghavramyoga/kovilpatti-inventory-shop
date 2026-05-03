import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ShieldCheck, ArrowLeft } from 'lucide-react'
import { useApp } from '../context/AppContext'
import './AdminLogin.css'

export default function AdminLogin() {
  const navigate = useNavigate()
  const { login } = useApp()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const ok = await login(username, password)
      if (ok) {
        navigate('/admin/products')
      } else {
        setError('Invalid credentials')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col">
      <header className="relative z-10 px-6 sm:px-8 py-5">
        <Link
          to="/"
          className="admin-login-back-button inline-flex items-center gap-2 text-sm text-[#1F1F1F] hover:bg-[#1F1F1F] hover:text-[#FCD835] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg bg-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 pb-12">
        <div className="admin-login-card max-w-md w-full rounded-2xl overflow-hidden bg-white">
          <div className="admin-login-card-header px-8 pt-7 pb-6 text-center">
            <div className="w-14 h-14 bg-[#1F1F1F] rounded-2xl flex items-center justify-center mb-3 mx-auto">
              <ShieldCheck className="w-7 h-7 text-[#FCD835]" />
            </div>
            <h1 className="text-2xl font-bold uppercase tracking-wide text-[#1F1F1F] mb-0.5">Admin Login</h1>
            <p className="text-sm text-[#1F1F1F]/75 font-medium">Manage products and inventory</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-[#1F1F1F]/75 mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="admin"
                className="admin-login-input w-full px-3 py-2.5 rounded-lg text-sm text-[#1F1F1F] focus:outline-none focus:ring-2 focus:ring-[#FCD835] bg-white"
                required
                autoComplete="username"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-[#1F1F1F]/75 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="admin-login-input w-full px-3 py-2.5 rounded-lg text-sm text-[#1F1F1F] focus:outline-none focus:ring-2 focus:ring-[#FCD835] bg-white"
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="px-3 py-2 bg-red-50 border-2 border-red-700 rounded-lg text-sm text-red-700 font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!username || !password || submitting}
              className="admin-login-submit w-full bg-[#1F1F1F] hover:bg-[#0A0A0A] disabled:bg-gray-300 disabled:text-gray-500 text-[#FCD835] py-3 rounded-lg text-sm font-bold uppercase tracking-widest transition"
            >
              {submitting ? 'Signing in…' : 'Sign In'}
            </button>

            <div className="admin-login-credentials-box mt-2 p-3 rounded-lg text-xs text-[#1F1F1F]/75">
              <p className="font-bold uppercase tracking-wide text-[#1F1F1F] mb-1">Demo credentials:</p>
              <code className="text-[#1F1F1F] font-bold">admin / admin123</code>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
