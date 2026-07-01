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

const emptyCandidateProfile = {
  fullName: '',
  phone: '',
  headline: '',
  bio: '',
  location: '',
}

const emptySkill = {
  name: '',
  category: '',
  proficiencyLevel: '',
  yearsOfExperience: '',
}

const emptyProject = {
  title: '',
  description: '',
  techStack: '',
}

function CandidateDashboard({ setMessage }) {
  const [profile, setProfile] = useState(null)
  const [skills, setSkills] = useState([])
  const [projects, setProjects] = useState([])
  const [profileForm, setProfileForm] = useState(emptyCandidateProfile)
  const [skillForm, setSkillForm] = useState(emptySkill)
  const [projectForm, setProjectForm] = useState(emptyProject)
  const [isLoading, setIsLoading] = useState(false)

  const loadCandidateData = async () => {
    setIsLoading(true)

    try {
      const [profileResult, skillsResult, projectsResult] = await Promise.allSettled([
        api.get('/api/profiles/candidate/me'),
        api.get('/api/candidate-data/skills'),
        api.get('/api/candidate-data/projects'),
      ])

      if (profileResult.status === 'fulfilled') {
        setProfile(profileResult.value.data.profile)
      }

      if (skillsResult.status === 'fulfilled') {
        setSkills(skillsResult.value.data.skills)
      }

      if (projectsResult.status === 'fulfilled') {
        setProjects(projectsResult.value.data.projects)
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCandidateData()
  }, [])

  const updateProfileForm = (event) => {
    setProfileForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  const updateSkillForm = (event) => {
    setSkillForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  const updateProjectForm = (event) => {
    setProjectForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  const submitProfile = async (event) => {
    event.preventDefault()
    setMessage('')

    try {
      const { data } = await api.post('/api/profiles/candidate', profileForm)
      setProfile(data.profile)
      setMessage('Candidate profile saved.')
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not save profile.')
    }
  }

  const submitSkill = async (event) => {
    event.preventDefault()
    setMessage('')

    try {
      await api.post('/api/candidate-data/skills', {
        ...skillForm,
        yearsOfExperience: skillForm.yearsOfExperience
          ? Number(skillForm.yearsOfExperience)
          : undefined,
      })
      setSkillForm(emptySkill)
      await loadCandidateData()
      setMessage('Skill added.')
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not add skill.')
    }
  }

  const submitProject = async (event) => {
    event.preventDefault()
    setMessage('')

    try {
      await api.post('/api/candidate-data/projects', {
        ...projectForm,
        techStack: projectForm.techStack
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
      })
      setProjectForm(emptyProject)
      await loadCandidateData()
      setMessage('Project added.')
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not add project.')
    }
  }

  return (
    <section className="dashboard-stack">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">Candidate setup</p>
          <h2>Profile, skills, and project signals</h2>
        </div>
        <button className="secondary-button compact" type="button" onClick={loadCandidateData}>
          {isLoading ? 'Refreshing' : 'Refresh'}
        </button>
      </div>

      <div className="form-grid">
        <form className="data-form" onSubmit={submitProfile}>
          <h3>{profile ? 'Profile exists' : 'Create profile'}</h3>
          <label>
            Full name
            <input
              name="fullName"
              value={profileForm.fullName}
              onChange={updateProfileForm}
              placeholder={profile?.full_name || 'Your full name'}
              required
            />
          </label>
          <label>
            Headline
            <input
              name="headline"
              value={profileForm.headline}
              onChange={updateProfileForm}
              placeholder="Full Stack Developer"
            />
          </label>
          <label>
            Location
            <input
              name="location"
              value={profileForm.location}
              onChange={updateProfileForm}
              placeholder="India"
            />
          </label>
          <label>
            Bio
            <textarea
              name="bio"
              value={profileForm.bio}
              onChange={updateProfileForm}
              placeholder="Short career summary"
              rows="3"
            />
          </label>
          <button className="primary-button" type="submit">
            Save profile
          </button>
        </form>

        <form className="data-form" onSubmit={submitSkill}>
          <h3>Add skill</h3>
          <label>
            Skill
            <input
              name="name"
              value={skillForm.name}
              onChange={updateSkillForm}
              placeholder="React"
              required
            />
          </label>
          <label>
            Category
            <input
              name="category"
              value={skillForm.category}
              onChange={updateSkillForm}
              placeholder="Frontend"
            />
          </label>
          <label>
            Proficiency
            <input
              name="proficiencyLevel"
              value={skillForm.proficiencyLevel}
              onChange={updateSkillForm}
              placeholder="Intermediate"
            />
          </label>
          <label>
            Years
            <input
              name="yearsOfExperience"
              type="number"
              min="0"
              step="0.5"
              value={skillForm.yearsOfExperience}
              onChange={updateSkillForm}
              placeholder="1"
            />
          </label>
          <button className="primary-button" type="submit">
            Add skill
          </button>
        </form>

        <form className="data-form wide" onSubmit={submitProject}>
          <h3>Add project</h3>
          <label>
            Title
            <input
              name="title"
              value={projectForm.title}
              onChange={updateProjectForm}
              placeholder="AI Resume Matcher"
              required
            />
          </label>
          <label>
            Tech stack
            <input
              name="techStack"
              value={projectForm.techStack}
              onChange={updateProjectForm}
              placeholder="React, Node.js, PostgreSQL"
            />
          </label>
          <label>
            Description
            <textarea
              name="description"
              value={projectForm.description}
              onChange={updateProjectForm}
              placeholder="What the project does"
              rows="3"
            />
          </label>
          <button className="primary-button" type="submit">
            Add project
          </button>
        </form>
      </div>

      <div className="summary-grid">
        <div>
          <h3>Skills</h3>
          {skills.length === 0 ? (
            <p className="muted">No skills added yet.</p>
          ) : (
            <div className="pill-list">
              {skills.map((skill) => (
                <span key={skill.id}>{skill.name}</span>
              ))}
            </div>
          )}
        </div>
        <div>
          <h3>Projects</h3>
          {projects.length === 0 ? (
            <p className="muted">No projects added yet.</p>
          ) : (
            <div className="record-list">
              {projects.slice(0, 3).map((project) => (
                <article key={project.id}>
                  <strong>{project.title}</strong>
                  <p>{project.description || 'No description yet.'}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
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
            {user?.role === 'candidate' ? (
              <CandidateDashboard setMessage={setMessage} />
            ) : (
              <div className="action-list">
                {activeWorkspace.actions.map((action) => (
                  <span key={action}>{action}</span>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  )
}

export default App
