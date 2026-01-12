import { signInWithPassword } from './actions';

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm p-6">
      <h1 className="text-2xl font-bold">ログイン</h1>

      <form action={signInWithPassword} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Password</label>
          <input
            name="password"
            type="password"
            required
            className="mt-1 w-full rounded border px-3 py-2"
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
