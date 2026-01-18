"use client";

import Image from "next/image";

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
    <div className="px-5 py-6">
      {/* キャラクターエリア */}
      <div className="flex flex-col items-center">
        <div className="relative w-full max-w-sm mx-auto aspect-[3/4]">
          <Image
            src="/nuts/5almond-flower.png"
            alt="ナッツキャラクター"
            fill
            sizes="(max-width: 768px) 90vw, 320px"
            className="object-contain drop-shadow-sm"
            priority
          />
        </div>

        <p className="text-sm text-muted-foreground">
          あなたのナッツキャラクター
        </p>
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
