import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { WarningNotice } from "@/shared/ui/WarningNotice";

const meta = {
  title: "Shared/WarningNotice",
  component: WarningNotice,
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof WarningNotice>;

export default meta;

type Story = StoryObj;

export const PenaltyFee: Story = {
  name: "위약금 안내",
  render: () => (
    <div className="max-w-[420px]">
      <WarningNotice title="위약금이 발생할 수 있어요">
        약정 기간이 남아있는 경우 번호이동 시 위약금이 청구될 수 있어요. 정확한
        금액은 매장에서 확인해 주세요.
      </WarningNotice>
    </div>
  ),
};

export const NoTitle: Story = {
  name: "제목 없이",
  render: () => (
    <div className="max-w-[420px]">
      <WarningNotice>
        대리인이 방문할 경우 위임장과 대리인 신분증이 추가로 필요해요.
      </WarningNotice>
    </div>
  ),
};
