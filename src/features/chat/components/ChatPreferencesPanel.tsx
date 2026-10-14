"use client";

import { useState } from "react";
import { BadgeCheck, MapPin, MessageSquareText } from "lucide-react";
import {
  chatPreferenceTopics,
  type ChatAnswerTone,
  type ChatPreferences,
} from "@/features/chat/lib/chatPreferences";
import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";
import { Select } from "@/shared/ui/Select";
import { cn } from "@/shared/lib/cn";

type ChatPreferencesPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (preferences: ChatPreferences) => void;
  preferences: ChatPreferences;
};

const answerToneOptions = [
  { label: "간단히", value: "brief" },
  { label: "보통", value: "normal" },
  { label: "자세히", value: "detailed" },
] as const;

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

  const toggleTopic = (topic: string) => {
    setDraft((current) => ({
      ...current,
      interestedTopics: current.interestedTopics.includes(topic)
        ? current.interestedTopics.filter((item) => item !== topic)
        : [...current.interestedTopics, topic],
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closePanel}
      size="lg"
      title="개인 맞춤 설정"
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
      <div className="space-y-6">
        <section>
          <div className="mb-3 flex items-center gap-2 text-sm font-extrabold">
            <MessageSquareText size={18} />
            답변 스타일
          </div>
          <Select
            aria-label="답변 스타일"
            options={answerToneOptions}
            value={draft.answerTone}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                answerTone: event.target.value as ChatAnswerTone,
              }))
            }
          />
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2 text-sm font-extrabold">
            <BadgeCheck size={18} />
            관심 분야
          </div>
          <div className="flex flex-wrap gap-2">
            {chatPreferenceTopics.map((topic) => {
              const isSelected = draft.interestedTopics.includes(topic);

              return (
                <button
                  key={topic}
                  type="button"
                  onClick={() => toggleTopic(topic)}
                  className={cn(
                    "rounded-full border px-3 py-2 text-sm font-bold transition",
                    isSelected
                      ? "border-brand bg-brand-soft text-brand"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/10",
                  )}
                  aria-pressed={isSelected}
                >
                  {topic}
                </button>
              );
            })}
          </div>
        </section>

        <label className="flex items-start gap-3 rounded-2xl border border-gray-200 p-4 dark:border-white/10">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 accent-[var(--color-brand)]"
            checked={draft.useLocationContext}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                useLocationContext: event.target.checked,
              }))
            }
          />
          <span>
            <span className="flex items-center gap-2 font-extrabold">
              <MapPin size={17} />
              위치 기반 추천 사용
            </span>
            <span className="mt-1 block text-sm font-medium text-gray-500 dark:text-gray-400">
              매장이나 제휴 혜택 질문에서 현재 위치를 활용합니다.
            </span>
          </span>
        </label>
      </div>
    </Modal>
  );
};
