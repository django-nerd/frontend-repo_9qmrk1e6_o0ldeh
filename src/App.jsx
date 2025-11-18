import { useEffect, useState } from 'react'

const API_BASE = import.meta.env.VITE_BACKEND_URL || ''

function Login({ onAuthed }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login')
  const [msg, setMsg] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setMsg('')
    try {
      if (mode === 'register') {
        const r = await fetch(`${API_BASE}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
        if (!r.ok) throw new Error('Registration failed')
      }
      const r = await fetch(`${API_BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
      const data = await r.json()
      if (!r.ok) throw new Error(data.detail || 'Login failed')
      onAuthed({ token: data.token })
    } catch (e) {
      setMsg(e.message)
    }
  }

  return (
    <div className="max-w-md w-full mx-auto bg-slate-800/60 border border-blue-500/20 rounded-2xl p-6">
      <h2 className="text-white text-2xl font-bold mb-4">{mode === 'login' ? 'Login' : 'Create account'}</h2>
      <form onSubmit={submit} className="space-y-3">
        <input className="w-full px-3 py-2 rounded bg-slate-900/60 text-white border border-slate-700" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="w-full px-3 py-2 rounded bg-slate-900/60 text-white border border-slate-700" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="w-full py-2 rounded bg-blue-600 hover:bg-blue-500 text-white">{mode === 'login' ? 'Login' : 'Register & Login'}</button>
      </form>
      {msg && <p className="text-red-400 text-sm mt-2">{msg}</p>}
      <div className="text-blue-200/80 text-sm mt-4 text-center">
        {mode === 'login' ? (
          <button onClick={()=>setMode('register')} className="underline">Need an account? Register</button>
        ) : (
          <button onClick={()=>setMode('login')} className="underline">Have an account? Login</button>
        )}
      </div>
    </div>
  )
}

function BreachChecker() {
  const [password, setPassword] = useState('')
  const [result, setResult] = useState(null)

  const check = async () => {
    if (!password) return
    const r = await fetch(`${API_BASE}/breach/${encodeURIComponent(password)}`)
    const data = await r.json()
    setResult(data)
  }

  return (
    <div className="bg-slate-800/60 border border-blue-500/20 rounded-2xl p-4">
      <h3 className="text-white font-semibold mb-2">Password breach check</h3>
      <div className="flex gap-2">
        <input className="flex-1 px-3 py-2 rounded bg-slate-900/60 text-white border border-slate-700" placeholder="Enter a password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button onClick={check} className="px-4 rounded bg-blue-600 hover:bg-blue-500 text-white">Check</button>
      </div>
      {result && (
        <p className={`mt-2 ${result.breached ? 'text-red-400' : 'text-green-400'}`}>{result.breached ? `Found ${result.count} breaches` : 'No breach found in database'}</p>
      )}
    </div>
  )
}

function AISuggest() {
  const [text, setText] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const go = async () => {
    const r = await fetch(`${API_BASE}/ai/suggest`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ context: text }) })
    const d = await r.json()
    setSuggestions(d.suggestions)
  }
  return (
    <div className="bg-slate-800/60 border border-blue-500/20 rounded-2xl p-4">
      <h3 className="text-white font-semibold mb-2">AI suggestions</h3>
      <textarea className="w-full h-24 px-3 py-2 rounded bg-slate-900/60 text-white border border-slate-700" value={text} onChange={e=>setText(e.target.value)} placeholder="Describe your situation or security question" />
      <button onClick={go} className="mt-2 px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white">Get tips</button>
      <ul className="mt-2 list-disc list-inside text-blue-200/90 text-sm">
        {suggestions.map((s,i)=> <li key={i}>{s}</li>)}
      </ul>
    </div>
  )
}

function Vault({ token, onLogout }) {
  const [items, setItems] = useState([])
  const [title, setTitle] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [url, setUrl] = useState('')
  const [notes, setNotes] = useState('')
  const [seeds, setSeeds] = useState([])
  const [seedLabel, setSeedLabel] = useState('')
  const [seedPhrase, setSeedPhrase] = useState('')

  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }

  const load = async () => {
    const r = await fetch(`${API_BASE}/vault`, { headers })
    const d = await r.json()
    setItems(d)
    const r2 = await fetch(`${API_BASE}/seed`, { headers })
    const d2 = await r2.json()
    setSeeds(d2)
  }
  useEffect(()=>{ load() },[])

  const add = async (e) => {
    e.preventDefault()
    const r = await fetch(`${API_BASE}/vault`, { method: 'POST', headers, body: JSON.stringify({ title, username, password, url, notes }) })
    if (r.ok) { setTitle(''); setUsername(''); setPassword(''); setUrl(''); setNotes(''); load() }
  }

  const del = async (id) => {
    await fetch(`${API_BASE}/vault/${id}`, { method: 'DELETE', headers })
    load()
  }

  const addSeed = async (e) => {
    e.preventDefault()
    await fetch(`${API_BASE}/seed`, { method: 'POST', headers, body: JSON.stringify({ label: seedLabel, seed_phrase: seedPhrase }) })
    setSeedLabel(''); setSeedPhrase(''); load()
  }

  const delSeed = async (id) => {
    await fetch(`${API_BASE}/seed/${id}`, { method: 'DELETE', headers })
    load()
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-white text-2xl font-bold">Your vault</h2>
        <button onClick={onLogout} className="px-3 py-1 rounded bg-slate-700 text-blue-100">Logout</button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <form onSubmit={add} className="bg-slate-800/60 border border-blue-500/20 rounded-2xl p-4 space-y-2">
          <h3 className="text-white font-semibold">Add credential</h3>
          <input className="w-full px-3 py-2 rounded bg-slate-900/60 text-white border border-slate-700" placeholder="Title" value={title} onChange={e=>setTitle(e.target.value)} />
          <input className="w-full px-3 py-2 rounded bg-slate-900/60 text-white border border-slate-700" placeholder="Username" value={username} onChange={e=>setUsername(e.target.value)} />
          <input className="w-full px-3 py-2 rounded bg-slate-900/60 text-white border border-slate-700" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
          <input className="w-full px-3 py-2 rounded bg-slate-900/60 text-white border border-slate-700" placeholder="URL" value={url} onChange={e=>setUrl(e.target.value)} />
          <textarea className="w-full px-3 py-2 rounded bg-slate-900/60 text-white border border-slate-700" placeholder="Notes" value={notes} onChange={e=>setNotes(e.target.value)} />
          <button className="w-full py-2 rounded bg-blue-600 hover:bg-blue-500 text-white">Save</button>
        </form>

        <div className="space-y-3">
          <BreachChecker />
          <AISuggest />
        </div>
      </div>

      <div className="bg-slate-800/60 border border-blue-500/20 rounded-2xl p-4">
        <h3 className="text-white font-semibold mb-3">Saved credentials</h3>
        <ul className="divide-y divide-slate-700/50">
          {items.map(i => (
            <li key={i.id} className="py-3 flex items-center justify-between">
              <div>
                <div className="text-white font-medium">{i.title}</div>
                <div className="text-blue-200/80 text-sm">{i.username} • {i.password} {i.url && `• ${i.url}`}</div>
                {i.notes && <div className="text-blue-300/70 text-xs mt-1">{i.notes}</div>}
              </div>
              <button onClick={()=>del(i.id)} className="px-2 py-1 text-sm rounded bg-red-600/80 hover:bg-red-500 text-white">Delete</button>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-slate-800/60 border border-blue-500/20 rounded-2xl p-4">
        <h3 className="text-white font-semibold mb-3">Seed phrases</h3>
        <form onSubmit={addSeed} className="grid md:grid-cols-3 gap-2 mb-3">
          <input className="px-3 py-2 rounded bg-slate-900/60 text-white border border-slate-700" placeholder="Label" value={seedLabel} onChange={e=>setSeedLabel(e.target.value)} />
          <input className="px-3 py-2 rounded bg-slate-900/60 text-white border border-slate-700" placeholder="Seed phrase" value={seedPhrase} onChange={e=>setSeedPhrase(e.target.value)} />
          <button className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white">Save Seed</button>
        </form>
        <ul className="divide-y divide-slate-700/50">
          {seeds.map(s => (
            <li key={s.id} className="py-3 flex items-center justify-between">
              <div className="text-blue-200">{s.label} — <span className="text-white">{s.seed_phrase}</span></div>
              <button onClick={()=>delSeed(s.id)} className="px-2 py-1 text-sm rounded bg-red-600/80 hover:bg-red-500 text-white">Delete</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function App() {
  const [auth, setAuth] = useState(null)

  const logout = async () => {
    if (auth?.token) {
      await fetch(`${API_BASE}/auth/logout`, { method: 'POST', headers: { 'Authorization': `Bearer ${auth.token}` } })
    }
    setAuth(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white">Secure Vault</h1>
          <p className="text-blue-200/80">Passwords and seed phrases are fully encrypted with keys only unlocked during your session.</p>
        </div>
        {!auth ? (
          <Login onAuthed={setAuth} />
        ) : (
          <Vault token={auth.token} onLogout={logout} />
        )}
      </div>
    </div>
  )
}

export default App
