/**
 * 操作面板组件
 * 显示玩家可选操作按钮：荣/自摸/碰/杠/吃/跳过
 * 含5秒倒计时自动跳过
 */
import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import type { Action, ActionType, Tile } from '../../engine/types';

interface ActionPanelProps {
  availableActions: Action[];
  onAction: (action: Action) => void;
  timeoutSeconds?: number;
}

/** 操作按钮配置 */
const ACTION_CONFIG: Record<ActionType, { label: string; color: string; priority: number }> = {
  ron:    { label: '荣和', color: 'bg-gold text-black hover:bg-gold-dark', priority: 0 },
  tsumo:  { label: '自摸', color: 'bg-gold text-black hover:bg-gold-dark', priority: 0 },
  kan:    { label: '杠',   color: 'bg-orange-500 text-white hover:bg-orange-600', priority: 1 },
  pon:    { label: '碰',   color: 'bg-orange-500 text-white hover:bg-orange-600', priority: 2 },
  chi:    { label: '吃',   color: 'bg-blue-600 text-white hover:bg-blue-700', priority: 3 },
  riichi: { label: '立直', color: 'bg-purple-600 text-white hover:bg-purple-700', priority: 1 },
  skip:   { label: '跳过', color: 'bg-gray-600 text-white hover:bg-gray-700', priority: 99 },
  ankan:  { label: '暗杠', color: 'bg-orange-500 text-white hover:bg-orange-600', priority: 1 },
  kakan:  { label: '加杠', color: 'bg-orange-500 text-white hover:bg-orange-600', priority: 1 },
};

/**
 * 操作面板
 */
export const ActionPanel: React.FC<ActionPanelProps> = ({
  availableActions,
  onAction,
  timeoutSeconds = 5,
}) => {
  const [timeLeft, setTimeLeft] = useState(timeoutSeconds);
  const [selectedChi, setSelectedChi] = useState<Tile[] | null>(null);

  // 倒计时：超时自动跳过
  useEffect(() => {
    if (availableActions.length === 0) return;
    setTimeLeft(timeoutSeconds);
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(interval);
          onAction({ type: 'skip' });
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [availableActions, timeoutSeconds, onAction]);

  if (availableActions.length === 0) return null;

  // 去重：同类操作只显示一个按钮（吃牌例外，有多个组合）
  const uniqueTypes = new Set(availableActions.map((a) => a.type));
  const sortedTypes = [...uniqueTypes].sort(
    (a, b) => (ACTION_CONFIG[a]?.priority ?? 99) - (ACTION_CONFIG[b]?.priority ?? 99)
  );

  const handleAction = (type: ActionType) => {
    if (type === 'chi') {
      // 吃牌需要选择组合
      const chiActions = availableActions.filter((a) => a.type === 'chi');
      if (chiActions.length === 1) {
        onAction(chiActions[0]);
      } else {
        // 多个吃法，显示选择子面板
        setSelectedChi(chiActions[0].tiles ?? null);
      }
      return;
    }
    const action = availableActions.find((a) => a.type === type);
    if (action) onAction(action);
  };

  const progressPercent = (timeLeft / timeoutSeconds) * 100;

  return (
    <div className="flex flex-col items-center gap-2 animate-bounce-in">
      {/* 倒计时进度条 */}
      <div className="w-full max-w-xs h-1 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gold transition-all duration-1000 ease-linear"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-2 flex-wrap justify-center">
        {sortedTypes.map((type) => {
          const config = ACTION_CONFIG[type];
          if (!config) return null;
          return (
            <button
              key={type}
              type="button"
              className={clsx(
                'px-4 py-2 rounded-lg font-bold text-sm',
                'transition-all duration-150 active:scale-95',
                'shadow-lg min-w-[56px]',
                config.color
              )}
              onClick={() => handleAction(type)}
              aria-label={config.label}
            >
              {config.label}
            </button>
          );
        })}
      </div>

      {/* 吃牌组合选择 */}
      {selectedChi && (
        <div className="flex flex-col items-center gap-1 p-2 bg-black/50 rounded-lg">
          <span className="text-white text-xs">选择吃牌组合：</span>
          <div className="flex gap-2">
            {availableActions
              .filter((a) => a.type === 'chi')
              .map((a, i) => (
                <button
                  key={i}
                  type="button"
                  className="flex gap-0.5 p-1 bg-blue-800 rounded hover:bg-blue-600"
                  onClick={() => { setSelectedChi(null); onAction(a); }}
                >
                  {a.tiles?.map((t) => (
                    <span key={t.id} className="text-white text-xs">
                      {t.value}{t.suit === 'man' ? '万' : t.suit === 'pin' ? '饼' : '索'}
                    </span>
                  ))}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* 剩余秒数 */}
      <span className="text-gray-400 text-xs">{timeLeft}s 后自动跳过</span>
    </div>
  );
};

export default ActionPanel;
