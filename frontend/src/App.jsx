import { useEffect, useMemo, useState } from 'react'
import api from './services/api'
import './App.css'

const roleTabs = [
  { label: 'Candidate', value: 'candidate' },
  { label: 'Recruiter', value: 'recruiter' },
  { label: 'Admin', value: 'admin' },
]

const workspaceCopy = {
  candidate: {
    title: 'Candidate Workspace',
    summary: 'Build your profile, browse matched jobs, upload resumes, and ask grounded career questions.',
    actions: ['Complete profile', 'Add skills', 'Upload resume', 'View job recommendations'],
  },
  recruiter: {
    title: 'Recruiter Workspace',
    summary: 'Create your company profile, post jobs, upload hiring documents, and review ranked applicants.',
    actions: ['Create company', 'Post job', 'Upload guidelines', 'Review applicants'],
  },
  admin: {
    title: 'Admin Workspace',
    summary: 'Monitor platform usage, review users, and manage account verification states.',
    actions: ['View stats', 'Review users', 'Inspect companies', 'Manage status'],
  },
}

function App() {
  const [mode, setMode] = useState('login')
  const [selectedRole, setSelectedRole] = useState('candidate')
  const [form, setForm] = useState({
    email: '',
    password: '',
  })
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('talentnexus_token'))
  const [health, setHealth] = useState('checking')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const activeWorkspace = useMemo(() => {
    return workspaceCopy[user?.role || selectedRole]
  }, [selectedRole, user])

  useEffect(() => {
    const checkHealth = async () => {
      try {
        await api.get('/health')
        setHealth('online')
      } catch {
        setHealth('offline')
      }
    }

    checkHealth()
  }, [])

  useEffect(() => {
    const loadMe = async () => {
      if (!token) return

      try {
        const { data } = await api.get('/api/auth/me')
        setUser(data.user)
      } catch {
        localStorage.removeItem('talentnexus_token')
        setToken(null)
      }
    }

    loadMe()
  }, [token])

  const updateForm = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  const submitAuth = async (event) => {
    event.preventDefault()
    setMessage('')
    setIsSubmitting(true)

    try {
      const payload =
        mode === 'register'
          ? { ...form, role: selectedRole }
          : { email: form.email, password: form.password }
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login'
      const { data } = await api.post(endpoint, payload)

      localStorage.setItem('talentnexus_token', data.token)
      setToken(data.token)
      setUser(data.user)
      setMessage(mode === 'register' ? 'Account created.' : 'Signed in.')
    } catch (error) {
      setMessage(error.response?.data?.message || 'Something went wrong.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('talentnexus_token')
    setToken(null)
    setUser(null)
    setMessage('')
  }

  return (
    <main className="app-shell">
      <section className="workspace-panel">
        <header className="topbar">
          <div>
            <p className="eyebrow">TalentNexus AI</p>
            <h1>Recruitment intelligence workspace</h1>
          </div>
          <span className={`status-dot ${health}`}>{health}</span>
        </header>

        <div className="workspace-grid">
          <section className="auth-panel">
            {user ? (
              <div className="signed-in">
                <p className="eyebrow">Signed in</p>
                <h2>{user.email}</h2>
                <dl>
                  <div>
                    <dt>Role</dt>
                    <dd>{user.role}</dd>
                  </div>
                  <div>
                    <dt>Status</dt>
                    <dd>{user.account_status}</dd>
                  </div>
                </dl>
                <button className="secondary-button" type="button" onClick={logout}>
                  Sign out
                </button>
              </div>
            ) : (
              <form className="auth-form" onSubmit={submitAuth}>
                <div className="mode-switch" aria-label="Authentication mode">
                  <button
                    type="button"
                    className={mode === 'login' ? 'active' : ''}
                    onClick={() => setMode('login')}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    className={mode === 'register' ? 'active' : ''}
                    onClick={() => setMode('register')}
                  >
                    Register
                  </button>
                </div>

                {mode === 'register' && (
                  <div className="role-tabs" aria-label="Account role">
                    {roleTabs.map((role) => (
                      <button
                        key={role.value}
                        type="button"
                        className={selectedRole === role.value ? 'active' : ''}
                        onClick={() => setSelectedRole(role.value)}
                      >
                        {role.label}
                      </button>
                    ))}
                  </div>
                )}

                <label>
                  Email
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={updateForm}
                    placeholder="candidate@test.com"
                    required
                  />
                </label>

                <label>
                  Password
                  <input
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={updateForm}
                    placeholder="At least 8 characters"
                    minLength={8}
                    required
                  />
                </label>

                <button className="primary-button" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Please wait' : mode === 'register' ? 'Create account' : 'Sign in'}
                </button>
              </form>
            )}

            {message && <p className="form-message">{message}</p>}
          </section>

          <section className="role-panel">
            <p className="eyebrow">{user ? user.role : selectedRole}</p>
            <h2>{activeWorkspace.title}</h2>
            <p>{activeWorkspace.summary}</p>
            <div className="action-list">
              {activeWorkspace.actions.map((action) => (
                <span key={action}>{action}</span>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}

export default App
