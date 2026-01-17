import Link from "next/link";

export default function PublicHomePage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold">Nuts Balance</h1>
      <p className="mt-2 text-gray-600">
        ナッツ摂取を日次で記録し、ストリークや集計を可視化するアプリです。
      </p>

      <div className="mt-6">
        <Link
          href="/auth/login"
          className="inline-flex items-center rounded-md bg-black px-4 py-2 text-white"
        >
          ログインへ
        </Link>
      </div>
    </main>
  );
}
