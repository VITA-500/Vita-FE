"use client";

import { Check, GripVertical } from "lucide-react";
import { Reorder, useDragControls } from "motion/react";
import { useState, type ReactNode } from "react";
import { chatQuickActions } from "@/features/chat/conversation/components/ChatQuickActionMenu";
import { useChatClientSettings } from "@/features/chat/settings/hooks/useChatClientSettings";
import {
  moveQuickAction,
  toggleQuickAction,
} from "@/features/chat/settings/lib/chatClientSettings";
import { cn } from "@/shared/lib/cn";

const sectionClassName =
  "rounded-2xl border border-gray-200 p-4 dark:border-white/10";

const SectionHeader = ({
  description,
  title,
}: {
  description: ReactNode;
  title: string;
}) => (
  <div>
    <p className="font-extrabold">{title}</p>
    <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
      {description}
    </p>
  </div>
);

type QuickAction = (typeof chatQuickActions)[number];
type QuickActionId = QuickAction["id"];

/** 항목 앞 체크 표시. 행을 누르면 메뉴에 보이기/숨기기가 바뀐다. */
const CheckMark = ({ checked }: { checked: boolean }) => (
  <span
    className={cn(
      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition",
      checked
        ? "border-brand bg-brand text-white"
        : "border-gray-300 bg-white dark:border-white/20 dark:bg-transparent",
    )}
  >
    {checked && <Check size={12} strokeWidth={3} />}
  </span>
);

const ToggleButton = ({
  action,
  isVisible,
  onToggle,
}: {
  action: QuickAction;
  isVisible: boolean;
  onToggle: () => void;
}) => {
  const Icon = action.icon;

  return (
    <button
      type="button"
      aria-pressed={isVisible}
      onClick={onToggle}
      className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-gray-50 dark:hover:bg-white/5"
    >
      <CheckMark checked={isVisible} />
      <Icon
        size={17}
        className={cn(
          "shrink-0",
          isVisible ? "text-brand" : "text-gray-300 dark:text-gray-600",
        )}
      />
      <span
        className={cn(
          "truncate text-sm font-bold",
          isVisible
            ? "text-gray-900 dark:text-white"
            : "text-gray-400 dark:text-gray-500",
        )}
      >
        {action.label}
      </span>
    </button>
  );
};

/** 켜진 항목 한 줄. 오른쪽 손잡이를 끌거나, 손잡이에 포커스한 뒤 ↑↓ 키로 순서를 바꾼다. */
const SortableQuickActionRow = ({
  action,
  onMove,
  onToggle,
}: {
  action: QuickAction;
  onMove: (direction: -1 | 1) => void;
  onToggle: () => void;
}) => {
  const dragControls = useDragControls();
  const [isDragging, setIsDragging] = useState(false);

  return (
    <Reorder.Item
      value={action.id}
      dragListener={false}
      dragControls={dragControls}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setIsDragging(false)}
      className={cn(
        "group relative flex items-center gap-1 rounded-xl bg-white py-0.5 dark:bg-zinc-950",
        isDragging &&
          "z-10 shadow-[0_10px_30px_rgba(15,23,42,0.14)] ring-1 ring-gray-200 dark:ring-white/10",
      )}
    >
      <ToggleButton action={action} isVisible onToggle={onToggle} />
      <button
        type="button"
        aria-label={`${action.label} 순서 바꾸기 (위아래 방향키)`}
        onPointerDown={(event) => dragControls.start(event)}
        onKeyDown={(event) => {
          if (event.key === "ArrowUp" || event.key === "ArrowDown") {
            event.preventDefault();
            onMove(event.key === "ArrowUp" ? -1 : 1);
          }
        }}
        className={cn(
          "focus-visible:ring-brand/30 flex h-9 w-8 shrink-0 touch-none items-center justify-center rounded-lg text-gray-300 transition group-hover:text-gray-500 hover:bg-gray-100 focus-visible:text-gray-600 focus-visible:ring-2 focus-visible:outline-none dark:text-gray-600 dark:group-hover:text-gray-400 dark:hover:bg-white/10",
          isDragging ? "cursor-grabbing text-gray-600" : "cursor-grab",
        )}
      >
        <GripVertical size={17} />
      </button>
    </Reorder.Item>
  );
};

export const QuickActionSection = () => {
  const { settings, updateSettings } = useChatClientSettings();
  const visibleIds = settings.quickActionIds;
  const hiddenActions = chatQuickActions.filter(
    (action) => !visibleIds.includes(action.id),
  );
  const findAction = (id: QuickActionId) =>
    chatQuickActions.find((action) => action.id === id);

  const toggle = (id: QuickActionId) =>
    updateSettings({ quickActionIds: toggleQuickAction(visibleIds, id) });

  return (
    <section className={sectionClassName}>
      <SectionHeader
        title="빠른 액션"
        description="메뉴에 표시/숨김 처리하고, 핸들을 끌거나 Tab 핸들 포커스+↑↓ 방향키로 순서를 바꿉니다."
      />

      <Reorder.Group
        as="ul"
        axis="y"
        values={visibleIds}
        onReorder={(quickActionIds: QuickActionId[]) =>
          updateSettings({ quickActionIds })
        }
        className="mt-3 space-y-0.5"
      >
        {visibleIds.map((id) => {
          const action = findAction(id);

          if (!action) return null;

          return (
            <SortableQuickActionRow
              key={id}
              action={action}
              onToggle={() => toggle(id)}
              onMove={(direction) =>
                updateSettings({
                  quickActionIds: moveQuickAction(visibleIds, id, direction),
                })
              }
            />
          );
        })}
      </Reorder.Group>

      {hiddenActions.length > 0 && (
        <ul className="mt-2 space-y-0.5 border-t border-gray-100 pt-2 dark:border-white/5">
          {hiddenActions.map((action) => (
            <li key={action.id} className="flex items-center gap-1 py-0.5">
              <ToggleButton
                action={action}
                isVisible={false}
                onToggle={() => toggle(action.id)}
              />
              <span className="w-8 shrink-0" />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
