'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SignUpPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string>('')

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // 開発中は一旦これでOK（確認メール後に戻る先）
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })

    if (error) {
      setMessage(`❌ ${error.message}`)
      return
    }

    setMessage('✅ 登録しました。メールを確認してリンクを開いてください。')
  }

  return (
    <main style={{ padding: 24, maxWidth: 420 }}>
      <h1>Sign Up</h1>

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        <label>
          Email
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            style={{ width: '100%', padding: 8 }}
          />
        </label>

        <label>
          Password
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            minLength={6}
            style={{ width: '100%', padding: 8 }}
          />
        </label>

        <button type="submit" style={{ padding: 10 }}>
          Create account
        </button>
      </form>

      {message && <p style={{ marginTop: 12 }}>{message}</p>}
    </main>
  )
}
