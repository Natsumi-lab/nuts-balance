'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { Nut, ActionResult } from '@/lib/types';
import { upsertDailyLog } from './actions';

/**
 * ナッツチェックリストコンポーネントのプロパティ型
 * - nuts.id は bigint（Supabaseからは number）想定
 * - selectedNutIds も number[] に寄せるのが理想だが、移行中なので (number|string) を許容
 */
interface NutCheckListProps {
  nuts: Nut[];
  selectedNutIds: Array<number | string>;
  date: string;
}

/**
 * ナッツチェックリストコンポーネント
 * ナッツの選択と保存機能を提供
 */
export default function NutCheckList({ nuts, selectedNutIds, date }: NutCheckListProps) {
  const router = useRouter();

  // 保存中のUI制御（disabled / ボタン文言など）
  const [isPending, startTransition] = useTransition();

  // 保存結果メッセージ表示用
  const [result, setResult] = useState<ActionResult | null>(null);

  // 「保存しました」などの表示を一定時間後に消すためのタイマー参照
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // selectedNutIds を number[] に正規化（bigint列に合わせる）
  const initialSelected = useMemo(() => {
    return selectedNutIds
      .map((v) => (typeof v === 'string' ? Number(v) : v))
      .filter((v) => Number.isFinite(v)) as number[];
  }, [selectedNutIds]);

  // 選択されたナッツIDを管理するローカル状態（numberで統一）
  const [selected, setSelected] = useState<number[]>(initialSelected);

  // ★重要：props が変わったら state を同期し直す（保存後の refresh / 日付移動でも崩れない）
  useEffect(() => {
    setSelected(initialSelected);
  }, [initialSelected, date]);

  // コンポーネント破棄時にタイマーを掃除（メモリリーク防止）
  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  // ナッツの選択状態を切り替える
  const toggleSelection = (nutId: number) => {
    setSelected((prev) =>
      prev.includes(nutId) ? prev.filter((id) => id !== nutId) : [...prev, nutId]
    );
  };

  // 選択したナッツを保存する
  const saveSelection = async () => {
    setResult(null);

    startTransition(async () => {
      try {
        // Server Actionを呼び出し（actions.ts 側で number|string どちらでも受けられる）
        const res = await upsertDailyLog(date, selected);
        setResult(res);

        if (res.success) {
          // 既存タイマーがあればクリア（連続保存でも表示時間が正しくなる）
          if (hideTimerRef.current) clearTimeout(hideTimerRef.current);

          // 2秒後にメッセージを消す
          hideTimerRef.current = setTimeout(() => {
            setResult(null);
          }, 2000);

          // サーバー側データを最新にする（選択済み状態など）
          router.refresh();
        }
      } catch (error) {
        console.error('保存中にエラーが発生しました:', error);
        setResult({
          success: false,
          message: '予期せぬエラーが発生しました',
        });
      }
    });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">今日のナッツ記録</h2>

      <div className="space-y-4">
        {nuts.map((nut) => {
          // nuts.id が number（bigint由来）想定。念のため変換。
          const nutId =
            typeof (nut as any).id === 'string'
              ? Number((nut as any).id)
              : ((nut as any).id as number);

          const checked = selected.includes(nutId);

          return (
            <label
              key={String(nutId)}
              className="flex items-center space-x-4 p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
            >
              {/* ★ onClick と onChange の二重toggleをやめて、input のみで切り替える */}
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleSelection(nutId)}
                disabled={isPending}
                className="w-5 h-5"
              />

              {nut.image_path ? (
                <div className="relative w-16 h-16 overflow-hidden">
                  <Image
                    src={nut.image_path}
                    alt={nut.name}
                    width={80}
                    height={80}
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : null}

              <div>
                <h3 className="font-medium">{nut.name}</h3>
                {nut.description ? (
                  <p className="text-sm text-gray-600">{nut.description}</p>
                ) : null}
              </div>
            </label>
          );
        })}
      </div>

      <div className="mt-6">
        <button
          onClick={saveSelection}
          disabled={isPending}
          className="bg-green-600 text-white px-4 py-2 rounded-lg w-full hover:bg-green-700 disabled:bg-gray-400"
        >
          {isPending ? '保存中...' : '保存する'}
        </button>

        {result ? (
          <div
            className={`mt-2 p-2 rounded ${
              result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {result.message}
          </div>
        ) : null}
      </div>
    </div>
  );
}
