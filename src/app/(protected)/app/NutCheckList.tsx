'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Nut, ActionResult } from '@/lib/types';
import { upsertDailyLog } from './actions';

/**
 * ナッツチェックリストコンポーネントのプロパティ型
 */
interface NutCheckListProps {
  nuts: Nut[];
  selectedNutIds: string[];
  date: string;
}

/**
 * ナッツチェックリストコンポーネント
 * ナッツの選択と保存機能を提供
 */
export default function NutCheckList({ nuts, selectedNutIds, date }: NutCheckListProps) {
  // 選択されたナッツIDを管理するローカル状態
  const [selected, setSelected] = useState<string[]>(selectedNutIds);
  // ローディング状態管理用のtransition
  const [isPending, startTransition] = useTransition();
  // アクション実行結果のメッセージ
  const [result, setResult] = useState<ActionResult | null>(null);
  // ルーター
  const router = useRouter();

  // ナッツの選択状態を切り替える
  const toggleSelection = (nutId: string) => {
    setSelected(prev =>
      prev.includes(nutId)
        ? prev.filter(id => id !== nutId)
        : [...prev, nutId]
    );
  };

  // 選択したナッツを保存する
  const saveSelection = async () => {
    setResult(null);

    startTransition(async () => {
      try {
        // Server Actionを呼び出し
        const result = await upsertDailyLog(date, selected);
        setResult(result);

        if (result.success) {
          // 成功したら画面を更新
          router.refresh();
        }
      } catch (error) {
        console.error('保存中にエラーが発生しました:', error);
        setResult({
          success: false,
          message: '予期せぬエラーが発生しました'
        });
      }
    });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">今日のナッツ記録</h2>

      <div className="space-y-4">
        {nuts.map((nut) => (
          <div
            key={nut.id}
            className="flex items-center space-x-4 p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
            onClick={() => toggleSelection(nut.id)}
          >
            <input
              type="checkbox"
              checked={selected.includes(nut.id)}
              onChange={() => toggleSelection(nut.id)}
              className="w-5 h-5"
            />

            <div className="relative w-16 h-16 overflow-hidden">
              <Image
                src={nut.image_path}
                alt={nut.name}
                width={80}
                height={80}
                className="object-cover"
              />
            </div>

            <div>
              <h3 className="font-medium">{nut.name}</h3>
              {nut.description && (
                <p className="text-sm text-gray-600">{nut.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <button
          onClick={saveSelection}
          disabled={isPending}
          className="bg-green-600 text-white px-4 py-2 rounded-lg w-full hover:bg-green-700 disabled:bg-gray-400"
        >
          {isPending ? '保存中...' : '保存する'}
        </button>

        {result && (
          <div className={`mt-2 p-2 rounded ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {result.message}
          </div>
        )}
      </div>
    </div>
  );
}