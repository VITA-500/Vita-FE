import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ChatMessageList } from "@/features/chat/components/ChatMessageList";
import type { ChatMessage } from "@/features/chat/types";

const baseMessages = [
  {
    id: "user-1",
    role: "user",
    content: "휴대폰을 잃어버렸어요.",
    createdAt: "2026-09-14T12:00:00.000Z",
  },
  {
    id: "assistant-1",
    role: "assistant",
    content:
      "분실 상황이라면 회선 일시정지, 단말 위치 확인, 유심 재발급 가능 여부를 순서대로 확인하면 돼요. 본인 확인이 필요할 수 있으니 신분증을 챙겨주세요.",
    createdAt: "2026-09-14T12:00:03.000Z",
    sources: [
      {
        id: "lost-phone",
        title: "휴대폰 분실 시 회선 보호 및 신고 방법",
        category: "분실/보호",
      },
      {
        id: "usim",
        title: "유심 재발급과 본인확인 준비 서류",
        category: "유심",
      },
    ],
  },
] satisfies ChatMessage[];

const storeMessages = [
  {
    id: "user-1",
    role: "user",
    content: "가까운 매장 어디야?",
    createdAt: "2026-09-14T12:00:00.000Z",
  },
  {
    id: "assistant-1",
    role: "assistant",
    content:
      "현재 위치 기준으로 가까운 매장을 확인했어요. 방문 전 운영 시간과 준비 서류를 함께 확인해보면 좋아요.",
    createdAt: "2026-09-14T12:00:03.000Z",
    actions: [
      {
        label: "매장 지도 보기",
        href: "/chat?mode=store",
      },
    ],
  },
] satisfies ChatMessage[];

const StoryFrame = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-background dark:bg-background-dark w-[860px] max-w-full p-6">
    {children}
  </div>
);

const meta = {
  title: "Chat/ChatMessageList",
  component: ChatMessageList,
  parameters: {
    layout: "padded",
  },
} satisfies Meta<typeof ChatMessageList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Conversation: Story = {
  args: {
    isLoading: false,
    messages: baseMessages,
  },
  render: (args) => (
    <StoryFrame>
      <ChatMessageList {...args} />
    </StoryFrame>
  ),
};

export const Thinking: Story = {
  args: {
    isLoading: true,
    messages: baseMessages.slice(0, 1),
  },
  render: (args) => (
    <StoryFrame>
      <ChatMessageList {...args} />
    </StoryFrame>
  ),
};

export const WithStoreAction: Story = {
  args: {
    isLoading: false,
    messages: storeMessages,
  },
  render: (args) => (
    <StoryFrame>
      <ChatMessageList {...args} />
    </StoryFrame>
  ),
};
