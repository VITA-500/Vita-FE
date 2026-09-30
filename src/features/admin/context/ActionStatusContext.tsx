"use client";

import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { cn } from "@/shared/lib/cn";

export type ActionStatusState = "pending" | "success" | "error";

type ActionStatusItem = {
  id: number;
  label: string;
  state: ActionStatusState;
};

type ActionStatusContextValue = {
  runWithStatus: <T>(label: string, action: () => T | Promise<T>) => Promise<T>;
};

const ActionStatusContext = createContext<ActionStatusContextValue | null>(
  null,
);

// 목데이터라 실제로는 즉시 끝나지만, "변경중 → 변경 완료" 흐름이 눈에
// 보이도록 최소 노출 시간을 둬요. 등록/수정/삭제처럼 데이터를 바꾸는
// 액션에만 씁니다(단순 필터/정렬 같은 조회성 상태 변화는 대상이 아니에요).
const MIN_PENDING_MS = 550;
const SUCCESS_VISIBLE_MS = 2000;
const ERROR_VISIBLE_MS = 3200;

export const ActionStatusProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<ActionStatusItem[]>([]);
  const nextId = useRef(1);

  const runWithStatus = useCallback(
    async <T,>(label: string, action: () => T | Promise<T>): Promise<T> => {
      const id = nextId.current++;
      setItems((prev) => [...prev, { id, label, state: "pending" }]);
      const startedAt = Date.now();

      const settle = (state: ActionStatusState) => {
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, state } : item)),
        );
        window.setTimeout(
          () => {
            setItems((prev) => prev.filter((item) => item.id !== id));
          },
          state === "error" ? ERROR_VISIBLE_MS : SUCCESS_VISIBLE_MS,
        );
      };

      try {
        const result = await action();
        const elapsed = Date.now() - startedAt;
        if (elapsed < MIN_PENDING_MS) {
          await new Promise((resolve) =>
            window.setTimeout(resolve, MIN_PENDING_MS - elapsed),
          );
        }
        settle("success");
        return result;
      } catch (error) {
        settle("error");
        throw error;
      }
    },
    [],
  );

  return (
    <ActionStatusContext.Provider value={{ runWithStatus }}>
      {children}
      <ActionStatusTray items={items} />
    </ActionStatusContext.Provider>
  );
};

export const useActionStatus = () => {
  const context = useContext(ActionStatusContext);

  if (!context) {
    throw new Error("useActionStatus must be used within ActionStatusProvider");
  }

  return context;
};

const statusMeta: Record<
  ActionStatusState,
  { label: string; icon: ReactNode; className: string }
> = {
  pending: {
    label: "변경중",
    icon: <Loader2 size={16} className="animate-spin" />,
    className:
      "border-border-soft bg-white text-gray-600 dark:border-white/10 dark:bg-zinc-950 dark:text-gray-300",
  },
  success: {
    label: "변경 완료",
    icon: <CheckCircle2 size={16} />,
    className:
      "border-green-200 bg-green-50 text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-300",
  },
  error: {
    label: "변경 실패",
    icon: <XCircle size={16} />,
    className:
      "border-red-200 bg-red-50 text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300",
  },
};

const ActionStatusTray = ({ items }: { items: ActionStatusItem[] }) => {
  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-5 bottom-5 z-[140] flex w-[min(320px,calc(100vw-40px))] flex-col-reverse gap-2">
      {items.map((item) => {
        const meta = statusMeta[item.state];

        return (
          <div
            key={item.id}
            role="status"
            className={cn(
              "pointer-events-auto flex items-center gap-2.5 rounded-xl border px-4 py-3 shadow-lg transition-all",
              meta.className,
            )}
          >
            <span className="shrink-0">{meta.icon}</span>
            <span className="min-w-0 flex-1 truncate text-sm font-bold">
              {item.label}
            </span>
            <span className="shrink-0 text-xs font-extrabold whitespace-nowrap opacity-80">
              {meta.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};
