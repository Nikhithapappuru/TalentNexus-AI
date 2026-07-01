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

const emptyCompany = {
  companyName: '',
  description: '',
  website: '',
  location: '',
}

const emptyRecruiterProfile = {
  fullName: '',
  designation: '',
  companyId: '',
}

const emptyJob = {
  title: '',
  description: '',
  experienceRequired: '',
  minimumSalary: '',
  maximumSalary: '',
  employmentType: 'internship',
  workMode: 'remote',
  location: '',
  applicationDeadline: '',
}

const emptyJobSkill = {
  jobId: '',
  name: '',
  category: '',
  isRequired: true,
  weight: '1',
}

function CandidateDashboard({ setMessage }) {
  const [profile, setProfile] = useState(null)
  const [skills, setSkills] = useState([])
  const [projects, setProjects] = useState([])
  const [jobs, setJobs] = useState([])
  const [applications, setApplications] = useState([])
  const [documents, setDocuments] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [selectedMatch, setSelectedMatch] = useState(null)
  const [selectedSkillGap, setSelectedSkillGap] = useState(null)
  const [selectedResumeFile, setSelectedResumeFile] = useState(null)
  const [resumeFeedback, setResumeFeedback] = useState('')
  const [ragQuestion, setRagQuestion] = useState('')
  const [ragResult, setRagResult] = useState(null)
  const [profileForm, setProfileForm] = useState(emptyCandidateProfile)
  const [skillForm, setSkillForm] = useState(emptySkill)
  const [projectForm, setProjectForm] = useState(emptyProject)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploadingResume, setIsUploadingResume] = useState(false)
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false)
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false)
  const [isGeneratingGap, setIsGeneratingGap] = useState(false)
  const [embeddingDocumentId, setEmbeddingDocumentId] = useState('')
  const [isAskingDocuments, setIsAskingDocuments] = useState(false)

  const appliedJobIds = useMemo(
    () => new Set(applications.map((application) => application.job_id || application.jobId)),
    [applications],
  )

  const loadCandidateData = async () => {
    setIsLoading(true)

    try {
      const [
        profileResult,
        skillsResult,
        projectsResult,
        jobsResult,
        applicationsResult,
        documentsResult,
      ] =
        await Promise.allSettled([
          api.get('/api/profiles/candidate/me'),
          api.get('/api/candidate-data/skills'),
          api.get('/api/candidate-data/projects'),
          api.get('/api/jobs?page=1&limit=8'),
          api.get('/api/applications/mine'),
          api.get('/api/documents/mine'),
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

      if (jobsResult.status === 'fulfilled') {
        setJobs(jobsResult.value.data.jobs || [])
      }

      if (applicationsResult.status === 'fulfilled') {
        setApplications(applicationsResult.value.data.applications || [])
      }

      if (documentsResult.status === 'fulfilled') {
        setDocuments(documentsResult.value.data.documents || [])
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

  const applyToJob = async (jobId) => {
    setMessage('')

    try {
      await api.post('/api/applications', { jobId })
      await loadCandidateData()
      setMessage('Application submitted.')
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not submit application.')
    }
  }

  const viewMatch = async (jobId) => {
    setMessage('')
    setSelectedMatch(null)

    try {
      const { data } = await api.get(`/api/matches/jobs/${jobId}/me`)
      setSelectedMatch(data.match || data)
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not calculate match yet.')
    }
  }

  const uploadResume = async (event) => {
    event.preventDefault()
    setMessage('')

    if (!selectedResumeFile) {
      setMessage('Choose a resume file first.')
      return
    }

    const formData = new FormData()
    formData.append('file', selectedResumeFile)
    setIsUploadingResume(true)

    try {
      const { data } = await api.post('/api/documents/resume', formData)
      setSelectedResumeFile(null)
      setResumeFeedback('')
      await loadCandidateData()
      setMessage(`Resume uploaded. ${data.chunkCount || 0} text chunks created.`)
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not upload resume.')
    } finally {
      setIsUploadingResume(false)
    }
  }

  const getResumeFeedback = async () => {
    setMessage('')
    setResumeFeedback('')
    setIsGeneratingFeedback(true)

    try {
      const { data } = await api.get('/api/ai/resume-feedback')
      setResumeFeedback(data.feedback)
      setMessage('Resume feedback generated.')
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not generate resume feedback.')
    } finally {
      setIsGeneratingFeedback(false)
    }
  }

  const getRecommendations = async () => {
    setMessage('')
    setIsLoadingRecommendations(true)

    try {
      const { data } = await api.get('/api/ai/job-recommendations?limit=5')
      setRecommendations(data.recommendations || [])
      setMessage('Job recommendations loaded.')
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not load job recommendations.')
    } finally {
      setIsLoadingRecommendations(false)
    }
  }

  const getSkillGap = async (jobId) => {
    setMessage('')
    setSelectedSkillGap(null)
    setIsGeneratingGap(true)

    try {
      const { data } = await api.get(`/api/ai/jobs/${jobId}/skill-gap`)
      setSelectedSkillGap(data)
      setMessage('Skill gap guidance generated.')
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not generate skill gap guidance.')
    } finally {
      setIsGeneratingGap(false)
    }
  }

  const embedDocument = async (documentId) => {
    setMessage('')
    setEmbeddingDocumentId(documentId)

    try {
      const { data } = await api.post(`/api/documents/${documentId}/chunks/embed`)
      setMessage(`Document prepared for Q&A. ${data.embeddedChunkCount || 0} chunks embedded.`)
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not prepare document for Q&A.')
    } finally {
      setEmbeddingDocumentId('')
    }
  }

  const askDocuments = async (event) => {
    event.preventDefault()
    setMessage('')
    setRagResult(null)

    if (!ragQuestion.trim()) {
      setMessage('Type a question first.')
      return
    }

    setIsAskingDocuments(true)

    try {
      const { data } = await api.post('/api/documents/answer', {
        question: ragQuestion,
        limit: 5,
      })
      setRagResult(data)
      setMessage('Document answer generated.')
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not answer from documents.')
    } finally {
      setIsAskingDocuments(false)
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

      <div className="document-panel">
        <div className="dashboard-header">
          <div>
            <p className="eyebrow">Resume intelligence</p>
            <h3>Upload and improve your resume</h3>
          </div>
          <button
            className="secondary-button compact"
            type="button"
            onClick={getResumeFeedback}
            disabled={isGeneratingFeedback}
          >
            {isGeneratingFeedback ? 'Generating' : 'Get feedback'}
          </button>
        </div>

        <form className="upload-row" onSubmit={uploadResume}>
          <input
            type="file"
            accept=".pdf,.txt,.doc,.docx"
            onChange={(event) => setSelectedResumeFile(event.target.files?.[0] || null)}
          />
          <button
            className="primary-button compact"
            type="submit"
            disabled={isUploadingResume || !selectedResumeFile}
          >
            {isUploadingResume ? 'Uploading' : 'Upload resume'}
          </button>
        </form>

        {documents.length === 0 ? (
          <p className="muted">No documents uploaded yet.</p>
        ) : (
          <div className="record-list">
            {documents.slice(0, 4).map((document) => (
              <article className="document-record" key={document.id}>
                <div>
                  <strong>{document.original_filename}</strong>
                  <p>
                    {document.document_type} - {Math.round((document.file_size_bytes || 0) / 1024)} KB
                  </p>
                </div>
                <button
                  className="secondary-button compact"
                  type="button"
                  disabled={embeddingDocumentId === document.id}
                  onClick={() => embedDocument(document.id)}
                >
                  {embeddingDocumentId === document.id ? 'Preparing' : 'Prepare'}
                </button>
              </article>
            ))}
          </div>
        )}

        {resumeFeedback ? <pre className="feedback-box">{resumeFeedback}</pre> : null}

        <form className="rag-form" onSubmit={askDocuments}>
          <label>
            Ask your documents
            <textarea
              value={ragQuestion}
              onChange={(event) => setRagQuestion(event.target.value)}
              placeholder="What skills should I highlight from my resume?"
              rows="3"
            />
          </label>
          <button className="primary-button compact" type="submit" disabled={isAskingDocuments}>
            {isAskingDocuments ? 'Asking' : 'Ask documents'}
          </button>
        </form>

        {ragResult ? (
          <div className="rag-result">
            <pre className="feedback-box">{ragResult.answer}</pre>
            {ragResult.sources?.length ? (
              <div className="source-list">
                {ragResult.sources.map((source) => (
                  <span key={`${source.documentId}-${source.chunkIndex}`}>
                    {source.sourceNumber}. {source.documentName}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="job-browser">
        <div className="dashboard-header">
          <div>
            <p className="eyebrow">Opportunities</p>
            <h3>Open jobs</h3>
          </div>
          <button
            className="secondary-button compact"
            type="button"
            onClick={getRecommendations}
            disabled={isLoadingRecommendations}
          >
            {isLoadingRecommendations ? 'Loading' : 'Recommend jobs'}
          </button>
        </div>

        {recommendations.length ? (
          <div className="recommendation-list">
            {recommendations.map((recommendation) => (
              <article key={recommendation.job.id}>
                <div>
                  <strong>{recommendation.job.title}</strong>
                  <p>
                    {recommendation.job.company_name || 'Company'} -{' '}
                    {recommendation.job.employment_type} - {recommendation.job.work_mode}
                  </p>
                </div>
                <span>{Math.round(Number(recommendation.match?.score || 0))}%</span>
              </article>
            ))}
          </div>
        ) : null}

        {jobs.length === 0 ? (
          <p className="muted">No open jobs found yet.</p>
        ) : (
          <div className="record-list job-list">
            {jobs.map((job) => {
              const hasApplied = appliedJobIds.has(job.id)

              return (
                <article key={job.id}>
                  <div>
                    <strong>{job.title}</strong>
                    <p>
                      {job.company_name || 'Company'} - {job.employment_type} - {job.work_mode}
                    </p>
                  </div>
                  <div className="job-actions">
                    <button
                      className="secondary-button compact"
                      type="button"
                      onClick={() => viewMatch(job.id)}
                    >
                      View match
                    </button>
                    <button
                      className="secondary-button compact"
                      type="button"
                      disabled={isGeneratingGap}
                      onClick={() => getSkillGap(job.id)}
                    >
                      Skill gap
                    </button>
                    <button
                      className="primary-button compact"
                      type="button"
                      disabled={hasApplied}
                      onClick={() => applyToJob(job.id)}
                    >
                      {hasApplied ? 'Applied' : 'Apply'}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {selectedMatch ? (
          <div className="score-panel">
            <div>
              <span>Match score</span>
              <strong>{Math.round(Number(selectedMatch.score || 0))}%</strong>
            </div>
            <p>{selectedMatch.explanation || 'Match explanation is not available yet.'}</p>
            {selectedMatch.matchedSkills?.length ? (
              <p>
                <b>Matched:</b> {selectedMatch.matchedSkills.join(', ')}
              </p>
            ) : null}
            {selectedMatch.missingSkills?.length ? (
              <p>
                <b>Gaps:</b> {selectedMatch.missingSkills.join(', ')}
              </p>
            ) : null}
          </div>
        ) : null}

        {selectedSkillGap ? (
          <div className="guidance-panel">
            <div>
              <span>Skill gap guidance</span>
              <strong>{Math.round(Number(selectedSkillGap.match?.score || 0))}%</strong>
            </div>
            <pre className="feedback-box">{selectedSkillGap.guidance}</pre>
          </div>
        ) : null}
      </div>
    </section>
  )
}

function RecruiterDashboard({ setMessage }) {
  const [company, setCompany] = useState(null)
  const [profile, setProfile] = useState(null)
  const [jobs, setJobs] = useState([])
  const [companyForm, setCompanyForm] = useState(emptyCompany)
  const [profileForm, setProfileForm] = useState(emptyRecruiterProfile)
  const [jobForm, setJobForm] = useState(emptyJob)
  const [jobSkillForm, setJobSkillForm] = useState(emptyJobSkill)
  const [isLoading, setIsLoading] = useState(false)

  const loadRecruiterData = async () => {
    setIsLoading(true)

    try {
      const [profileResult, jobsResult] = await Promise.allSettled([
        api.get('/api/profiles/recruiter/me'),
        api.get('/api/jobs/mine?page=1&limit=10'),
      ])

      if (profileResult.status === 'fulfilled') {
        const recruiterProfile = profileResult.value.data.profile
        setProfile(recruiterProfile)
        setProfileForm((current) => ({
          ...current,
          companyId: recruiterProfile.company_id || current.companyId,
        }))
        if (recruiterProfile.company_id) {
          setCompany({
            id: recruiterProfile.company_id,
            company_name: recruiterProfile.company_name,
          })
        }
      }

      if (jobsResult.status === 'fulfilled') {
        setJobs(jobsResult.value.data.jobs)
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadRecruiterData()
  }, [])

  const updateCompanyForm = (event) => {
    setCompanyForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  const updateProfileForm = (event) => {
    setProfileForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  const updateJobForm = (event) => {
    setJobForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }))
  }

  const updateJobSkillForm = (event) => {
    const { name, value, type, checked } = event.target
    setJobSkillForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const submitCompany = async (event) => {
    event.preventDefault()
    setMessage('')

    try {
      const { data } = await api.post('/api/profiles/companies', companyForm)
      setCompany(data.company)
      setProfileForm((current) => ({
        ...current,
        companyId: data.company.id,
      }))
      setMessage('Company created.')
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not create company.')
    }
  }

  const submitRecruiterProfile = async (event) => {
    event.preventDefault()
    setMessage('')

    try {
      const { data } = await api.post('/api/profiles/recruiter', profileForm)
      setProfile(data.profile)
      setMessage('Recruiter profile saved.')
      await loadRecruiterData()
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not save recruiter profile.')
    }
  }

  const submitJob = async (event) => {
    event.preventDefault()
    setMessage('')

    try {
      await api.post('/api/jobs', {
        ...jobForm,
        experienceRequired: Number(jobForm.experienceRequired || 0),
        minimumSalary: jobForm.minimumSalary ? Number(jobForm.minimumSalary) : undefined,
        maximumSalary: jobForm.maximumSalary ? Number(jobForm.maximumSalary) : undefined,
      })
      setJobForm(emptyJob)
      await loadRecruiterData()
      setMessage('Job posted.')
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not post job.')
    }
  }

  const submitJobSkill = async (event) => {
    event.preventDefault()
    setMessage('')

    try {
      await api.post(`/api/jobs/${jobSkillForm.jobId}/skills`, {
        name: jobSkillForm.name,
        category: jobSkillForm.category,
        isRequired: jobSkillForm.isRequired,
        weight: Number(jobSkillForm.weight || 1),
      })
      setJobSkillForm(emptyJobSkill)
      setMessage('Job skill added.')
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not add job skill.')
    }
  }

  return (
    <section className="dashboard-stack">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">Recruiter setup</p>
          <h2>Company, profile, jobs, and skill requirements</h2>
        </div>
        <button className="secondary-button compact" type="button" onClick={loadRecruiterData}>
          {isLoading ? 'Refreshing' : 'Refresh'}
        </button>
      </div>

      <div className="form-grid">
        <form className="data-form" onSubmit={submitCompany}>
          <h3>{company ? 'Company linked' : 'Create company'}</h3>
          <label>
            Company name
            <input
              name="companyName"
              value={companyForm.companyName}
              onChange={updateCompanyForm}
              placeholder={company?.company_name || 'TalentNexus Labs'}
              required
            />
          </label>
          <label>
            Website
            <input
              name="website"
              value={companyForm.website}
              onChange={updateCompanyForm}
              placeholder="https://example.com"
            />
          </label>
          <label>
            Location
            <input
              name="location"
              value={companyForm.location}
              onChange={updateCompanyForm}
              placeholder="Remote"
            />
          </label>
          <label>
            Description
            <textarea
              name="description"
              value={companyForm.description}
              onChange={updateCompanyForm}
              placeholder="What your company does"
              rows="3"
            />
          </label>
          <button className="primary-button" type="submit">
            Create company
          </button>
        </form>

        <form className="data-form" onSubmit={submitRecruiterProfile}>
          <h3>{profile ? 'Recruiter profile exists' : 'Create recruiter profile'}</h3>
          <label>
            Full name
            <input
              name="fullName"
              value={profileForm.fullName}
              onChange={updateProfileForm}
              placeholder={profile?.full_name || 'Recruiter name'}
              required
            />
          </label>
          <label>
            Designation
            <input
              name="designation"
              value={profileForm.designation}
              onChange={updateProfileForm}
              placeholder="HR Manager"
            />
          </label>
          <label>
            Company ID
            <input
              name="companyId"
              value={profileForm.companyId}
              onChange={updateProfileForm}
              placeholder="Created company id"
            />
          </label>
          <button className="primary-button" type="submit">
            Save recruiter profile
          </button>
        </form>

        <form className="data-form wide" onSubmit={submitJob}>
          <h3>Post job</h3>
          <div className="two-column-fields">
            <label>
              Title
              <input
                name="title"
                value={jobForm.title}
                onChange={updateJobForm}
                placeholder="Full Stack Developer Intern"
                required
              />
            </label>
            <label>
              Location
              <input
                name="location"
                value={jobForm.location}
                onChange={updateJobForm}
                placeholder="India"
              />
            </label>
            <label>
              Employment type
              <select
                name="employmentType"
                value={jobForm.employmentType}
                onChange={updateJobForm}
              >
                <option value="internship">Internship</option>
                <option value="full_time">Full time</option>
                <option value="part_time">Part time</option>
                <option value="contract">Contract</option>
              </select>
            </label>
            <label>
              Work mode
              <select name="workMode" value={jobForm.workMode} onChange={updateJobForm}>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">Onsite</option>
              </select>
            </label>
            <label>
              Experience years
              <input
                name="experienceRequired"
                type="number"
                min="0"
                value={jobForm.experienceRequired}
                onChange={updateJobForm}
                placeholder="0"
              />
            </label>
            <label>
              Deadline
              <input
                name="applicationDeadline"
                type="date"
                value={jobForm.applicationDeadline}
                onChange={updateJobForm}
              />
            </label>
          </div>
          <label>
            Description
            <textarea
              name="description"
              value={jobForm.description}
              onChange={updateJobForm}
              placeholder="Role responsibilities and requirements"
              rows="4"
              required
            />
          </label>
          <button className="primary-button" type="submit">
            Post job
          </button>
        </form>

        <form className="data-form wide" onSubmit={submitJobSkill}>
          <h3>Add job skill</h3>
          <div className="two-column-fields">
            <label>
              Job
              <select
                name="jobId"
                value={jobSkillForm.jobId}
                onChange={updateJobSkillForm}
                required
              >
                <option value="">Select job</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.id}>
                    {job.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Skill
              <input
                name="name"
                value={jobSkillForm.name}
                onChange={updateJobSkillForm}
                placeholder="React"
                required
              />
            </label>
            <label>
              Category
              <input
                name="category"
                value={jobSkillForm.category}
                onChange={updateJobSkillForm}
                placeholder="Frontend"
              />
            </label>
            <label>
              Weight
              <input
                name="weight"
                type="number"
                min="0"
                step="0.1"
                value={jobSkillForm.weight}
                onChange={updateJobSkillForm}
              />
            </label>
          </div>
          <label className="checkbox-row">
            <input
              name="isRequired"
              type="checkbox"
              checked={jobSkillForm.isRequired}
              onChange={updateJobSkillForm}
            />
            Required skill
          </label>
          <button className="primary-button" type="submit">
            Add job skill
          </button>
        </form>
      </div>

      <div className="summary-grid">
        <div>
          <h3>Posted jobs</h3>
          {jobs.length === 0 ? (
            <p className="muted">No jobs posted yet.</p>
          ) : (
            <div className="record-list">
              {jobs.slice(0, 4).map((job) => (
                <article key={job.id}>
                  <strong>{job.title}</strong>
                  <p>
                    {job.company_name} · {job.employment_type} · {job.work_mode}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
        <div>
          <h3>Current company</h3>
          {company ? (
            <p className="muted">{company.company_name || company.companyName}</p>
          ) : (
            <p className="muted">Create a company before posting jobs.</p>
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
            ) : user?.role === 'recruiter' ? (
              <RecruiterDashboard setMessage={setMessage} />
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
