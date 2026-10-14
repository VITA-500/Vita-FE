"use client";

import { Check, ChevronDown, History } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import {
  historyPreferenceOptions,
  type ChatPreferences,
  type HistoryPreference,
} from "@/features/chat/lib/chatPreferences";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";

type ChatPreferencesPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (preferences: ChatPreferences) => void;
  preferences: ChatPreferences;
};

const sectionClassName =
  "rounded-2xl border border-gray-200 p-4 dark:border-white/10";

const switchClassName =
  "relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center disabled:cursor-not-allowed";

const SwitchControl = ({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) => (
  <label className={switchClassName}>
    <input
      type="checkbox"
      className="peer sr-only"
      checked={checked}
      aria-label={label}
      onChange={(event) => onChange(event.target.checked)}
    />
    <span className="peer-checked:bg-brand h-7 w-12 rounded-full bg-gray-300 transition dark:bg-white/20" />
    <span className="absolute left-1 h-5 w-5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-5" />
  </label>
);

const MENU_MAX_HEIGHT = 288;
const MENU_GAP = 24;
const MENU_MIN_HEIGHT = 120;

type MenuPlacement = { maxHeight: number; side: "bottom" | "top" };

const getMenuPlacement = (
  triggerRect: Pick<DOMRect, "bottom" | "top">,
  viewportHeight: number,
): MenuPlacement => {
  const spaceBelow = viewportHeight - triggerRect.bottom - MENU_GAP;
  const spaceAbove = triggerRect.top - MENU_GAP;
  const side =
    spaceBelow >= MENU_MAX_HEIGHT || spaceBelow >= spaceAbove
      ? "bottom"
      : "top";
  const space = side === "bottom" ? spaceBelow : spaceAbove;

  return {
    maxHeight: Math.max(MENU_MIN_HEIGHT, Math.min(MENU_MAX_HEIGHT, space)),
    side,
  };
};

const HistoryPreferenceDropdown = ({
  disabled,
  onChange,
  value,
}: {
  disabled: boolean;
  onChange: (value: HistoryPreference) => void;
  value: HistoryPreference;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPlacement, setMenuPlacement] = useState<MenuPlacement>({
    maxHeight: MENU_MAX_HEIGHT,
    side: "bottom",
  });
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = historyPreferenceOptions.find(
    (option) => option.value === value,
  );

  const toggleMenu = () => {
    if (disabled) return;

    if (!isOpen && rootRef.current) {
      setMenuPlacement(
        getMenuPlacement(
          rootRef.current.getBoundingClientRect(),
          window.innerHeight,
        ),
      );
    }

    setIsOpen((wasOpen) => !wasOpen);
  };
  const openOffset = menuPlacement.side === "top" ? 6 : -6;

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="상담 기록 활용 방식"
        disabled={disabled}
        onClick={toggleMenu}
        className="border-border hover:border-brand/40 flex h-12 w-full items-center justify-between gap-2 rounded-2xl border bg-white px-4 text-sm font-extrabold text-gray-700 shadow-sm transition hover:text-gray-950 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:text-white dark:disabled:bg-white/[0.03] dark:disabled:text-gray-500"
      >
        <span className="truncate">{selected?.label}</span>
        <ChevronDown
          size={16}
          className={cn(
            "shrink-0 text-gray-400 transition-transform duration-300",
            isOpen && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            role="listbox"
            initial={{ opacity: 0, scale: 0.96, y: openOffset }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: openOffset }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "border-border-soft absolute right-0 z-20 w-full rounded-2xl border bg-white p-1.5 shadow-lg dark:border-white/10 dark:bg-zinc-950",
              menuPlacement.side === "top"
                ? "bottom-full mb-2 origin-bottom-right"
                : "top-full mt-2 origin-top-right",
            )}
          >
            <div
              className="space-y-0.5 overflow-y-auto overscroll-contain pr-0.5"
              style={{ maxHeight: menuPlacement.maxHeight }}
            >
              {historyPreferenceOptions.map((option) => {
                const isSelected = option.value === value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-start justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-200",
                      isSelected
                        ? "bg-brand-soft text-brand-hover dark:bg-brand/10 dark:text-brand"
                        : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/10",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-extrabold">
                        {option.label}
                      </span>
                      <span className="mt-0.5 block text-xs leading-5 font-medium text-gray-500 dark:text-gray-400">
                        {option.description}
                      </span>
                    </span>
                    {isSelected && (
                      <Check size={14} className="mt-1 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const ChatPreferencesPanel = ({
  isOpen,
  onClose,
  onSave,
  preferences,
}: ChatPreferencesPanelProps) => {
  const [draft, setDraft] = useState(preferences);

  const closePanel = () => {
    setDraft(preferences);
    onClose();
  };

  const updateDraft = (patch: Partial<ChatPreferences>) => {
    setDraft((current) => ({ ...current, ...patch }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closePanel}
      size="lg"
      title="상담 기록 활용"
      description="API 연결 전까지 이 설정은 이 브라우저에 저장됩니다."
      actions={
        <>
          <Button variant="secondary" onClick={closePanel}>
            닫기
          </Button>
          <Button
            onClick={() => {
              onSave(draft);
              onClose();
            }}
          >
            저장하기
          </Button>
        </>
      }
    >
      <section className={sectionClassName}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-extrabold">
              <History size={18} />
              이전 상담 기록 정보 활용
            </p>
            <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
              이전 상담에서 확인한 조건을 새 상담에 참고할지 설정합니다.
            </p>
          </div>
          <SwitchControl
            checked={draft.usePreviousConsultation}
            label="이전 상담 기록 정보 활용"
            onChange={(usePreviousConsultation) =>
              updateDraft({ usePreviousConsultation })
            }
          />
        </div>

        <div
          className={cn(
            "mt-4 transition",
            !draft.usePreviousConsultation && "opacity-55",
          )}
        >
          <p className="mb-2 text-sm font-extrabold">활용 방식</p>
          <HistoryPreferenceDropdown
            disabled={!draft.usePreviousConsultation}
            value={draft.historyPreference}
            onChange={(historyPreference) => updateDraft({ historyPreference })}
          />
        </div>
      </section>
    </Modal>
  );
};
