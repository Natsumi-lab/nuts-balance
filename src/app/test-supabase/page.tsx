import { createClient } from '@/lib/supabase/server'

export default async function TestSupabasePage() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('nuts')
    .select('id, slug, name')
    .order('id', { ascending: true })

  if (error) {
    return (
      <pre style={{ whiteSpace: 'pre-wrap', padding: 24 }}>
        {JSON.stringify(error, null, 2)}
      </pre>
    )
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Supabase 接続テスト</h1>
      <ul>
        {data?.map((n) => (
          <li key={n.id}>
            {n.slug} / {n.name}
          </li>
        ))}
      </ul>
    </main>
  )
}
