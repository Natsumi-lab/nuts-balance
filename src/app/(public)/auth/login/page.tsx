import { signInWithPassword } from "./actions";

type PageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const error = params?.error;

  return (
    <div className="mx-auto max-w-sm p-6">
      <h1 className="text-2xl font-bold">ログイン</h1>

      {error ? (
        <div className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <form action={signInWithPassword} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded border px-3 py-2"
            autoComplete="email"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Password</label>
          <input
            name="password"
            type="password"
            required
            className="mt-1 w-full rounded border px-3 py-2"
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded bg-black px-4 py-2 text-white"
        >
          ログイン
        </button>
      </form>

      <p className="mt-4 text-sm text-gray-600">
        ※ テスト用のメールアドレス / パスワードを使用してください
      </p>
    </div>
  );
}
