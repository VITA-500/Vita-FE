import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FeedbackTraceInline } from "@/features/admin/feedback/components/AnswerFeedbackTrace";
import { mockAdminTrace } from "@/features/admin/common/lib/adminData";

const meta = {
  title: "Admin/Feedback/AnswerFeedbackTrace",
  component: FeedbackTraceInline,
  parameters: { layout: "padded" },
} satisfies Meta<typeof FeedbackTraceInline>;

export default meta;
type Story = StoryObj<typeof meta>;

const readyTrace = {
  error: null,
  isLoading: false,
  trace: mockAdminTrace,
};

export const Ready: Story = {
  args: { trace: readyTrace },
};

export const Loading: Story = {
  args: {
    trace: { error: null, isLoading: true, trace: null },
  },
};

export const Error: Story = {
  args: {
    trace: {
      error: "처리 과정을 불러오지 못했어요.",
      isLoading: false,
      trace: null,
    },
  },
};

export const Empty: Story = {
  args: { trace: { error: null, isLoading: false, trace: null } },
};
