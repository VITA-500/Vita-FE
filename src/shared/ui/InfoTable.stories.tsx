import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { InfoTable } from "@/shared/ui/InfoTable";

const meta = {
  title: "Shared/InfoTable",
  component: InfoTable,
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof InfoTable>;

export default meta;

type Story = StoryObj;

export const PortabilityConditions: Story = {
  name: "번호이동 조건",
  render: () => (
    <div className="max-w-[360px]">
      <InfoTable
        title="번호이동 처리 조건"
        rows={[
          { label: "가능 시간", value: "평일 09:00~18:00" },
          { label: "준비 서류", value: "신분증" },
          { label: "위약금", value: "약정 확인 필요" },
        ]}
      />
    </div>
  ),
};
