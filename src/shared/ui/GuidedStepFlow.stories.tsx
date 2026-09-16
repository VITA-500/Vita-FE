import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { GuidedStepFlow } from "@/shared/ui/GuidedStepFlow";
import { TextField } from "@/shared/ui/TextField";
import { Button } from "@/shared/ui/Button";

const meta = {
  title: "Shared/GuidedStepFlow",
  component: GuidedStepFlow,
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof GuidedStepFlow>;

export default meta;

type Story = StoryObj;

const PhoneNumberStep = ({ onNext }: { onNext: () => void }) => {
  const [value, setValue] = useState("");

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (value.trim()) onNext();
      }}
    >
      <TextField
        label="이동할 전화번호"
        placeholder="010-0000-0000"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <Button type="submit" size="sm" disabled={!value.trim()}>
        다음
      </Button>
    </form>
  );
};

const VerificationStep = ({ onNext }: { onNext: () => void }) => {
  const [code, setCode] = useState("");

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (code.trim()) onNext();
      }}
    >
      <TextField
        label="인증번호"
        placeholder="6자리 입력"
        value={code}
        onChange={(event) => setCode(event.target.value)}
      />
      <Button type="submit" size="sm" disabled={!code.trim()}>
        인증하기
      </Button>
    </form>
  );
};

export const PortabilityFlow: Story = {
  name: "번호이동 - 입력이 필요한 단계",
  render: () => (
    <div className="border-border text-text-primary max-w-[420px] rounded-3xl border bg-white p-5 text-sm leading-6 shadow-sm dark:border-white/10 dark:bg-zinc-950">
      <p className="mb-4">
        번호이동을 도와드릴게요. 아래 순서대로 진행해 주세요.
      </p>

      <GuidedStepFlow
        steps={[
          {
            title: "이동할 번호 입력",
            description: "번호이동을 진행할 휴대폰 번호를 입력해 주세요.",
            content: ({ onNext }) => <PhoneNumberStep onNext={onNext} />,
          },
          {
            title: "본인 인증",
            description: "입력한 번호로 전송된 인증번호를 입력해 주세요.",
            content: ({ onNext }) => <VerificationStep onNext={onNext} />,
          },
          {
            title: "약관 동의",
            description: "번호이동 이용약관에 동의해 주세요.",
            nextLabel: "동의하고 계속",
          },
          {
            title: "개통 완료",
          },
        ]}
        completedMessage="번호이동 신청이 완료됐어요. 개통까지 최대 2시간이 걸려요."
      />
    </div>
  ),
};
