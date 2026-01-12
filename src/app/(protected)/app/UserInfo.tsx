'use client';

/**
 * UserInfoコンポーネントのプロパティ型
 */
interface UserInfoProps {
  streak: number;
}

/**
 * ユーザー情報表示コンポーネント
 * ストリーク数とキャラクタープレースホルダーを表示
 */
export default function UserInfo({ streak }: UserInfoProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">マイキャラクター</h2>

      {/* キャラクタープレースホルダー */}
      <div className="h-48 bg-gray-200 rounded-lg mb-4 flex items-center justify-center">
        <p className="text-gray-500">キャラクター表示予定</p>
      </div>

      {/* ストリーク表示 */}
      <div className="mt-4">
        <h3 className="font-medium">ストリーク</h3>
        <div className="flex items-center mt-2">
          <div className="text-2xl font-bold">{streak} 日</div>
          <div className="ml-2 text-sm text-gray-600">連続記録中</div>
        </div>
      </div>
    </div>
  );
}