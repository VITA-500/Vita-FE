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
    storeMap: {
      activeServices: ["요금제변경", "휴대폰상담"],
      origin: { lat: 37.498095, lng: 127.02761 },
      stores: [
        {
          id: "story-gangnam-001",
          name: "VITA 강남역점",
          address: "서울 강남구 강남대로 396",
          phone: "02-0000-0001",
          lat: 37.498095,
          lng: 127.02761,
          distanceText: "약 320m",
          consultServices: ["요금제변경", "휴대폰상담", "로밍상담"],
          providedServices: ["방문예약 가능"],
        },
        {
          id: "story-seocho-001",
          name: "VITA 서초점",
          address: "서울 서초구 서초대로74길 45",
          phone: "02-0000-0002",
          lat: 37.494667,
          lng: 127.028002,
          distanceText: "약 640m",
          consultServices: ["휴대폰상담", "분실·정지 신고"],
          providedServices: ["주차 가능"],
        },
        {
          id: "story-yeoksam-001",
          name: "VITA 역삼센터",
          address: "서울 강남구 테헤란로 152",
          phone: "02-0000-0003",
          lat: 37.500701,
          lng: 127.03654,
          distanceText: "약 880m",
          consultServices: ["인터넷상담", "요금수납"],
          providedServices: ["방문예약 가능"],
        },
        {
          id: "story-sinnonhyeon-001",
          name: "VITA 신논현점",
          address: "서울 서초구 강남대로 465",
          phone: "02-0000-0004",
          lat: 37.50481,
          lng: 127.02573,
          distanceText: "약 1.1km",
          consultServices: ["요금제변경", "로밍상담"],
          providedServices: ["주차 가능"],
        },
        {
          id: "story-samseong-001",
          name: "VITA 삼성로점",
          address: "서울 강남구 삼성로 512",
          phone: "02-0000-0005",
          lat: 37.50861,
          lng: 127.06302,
          distanceText: "약 2.4km",
          consultServices: ["휴대폰상담", "인터넷상담"],
          providedServices: ["방문예약 가능"],
        },
      ],
    },
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

/* ------------------------------------------------------------------ */
/* 응답 상태별 답변 블록 (성공 · 응답 중 · 실패 · 중단 · 기록 열람 시 생성 중) */
/* ------------------------------------------------------------------ */

const statusQuestion = {
  id: "user-status",
  role: "user",
  content: "5G 요금제 중에 데이터 무제한인 거 추천해줘",
  createdAt: "2026-10-07T01:00:00.000Z",
} satisfies ChatMessage;

const statusAnswer = (
  status: NonNullable<ChatMessage["status"]>,
  content: string,
): ChatMessage => ({
  id: `assistant-${status}`,
  role: "assistant",
  content,
  status,
  createdAt: "2026-10-07T01:00:03.000Z",
});

const noop = () => undefined;

export const StatusSuccess: Story = {
  name: "상태 · 성공",
  args: {
    isLoading: false,
    messages: [
      statusQuestion,
      statusAnswer(
        "success",
        "데이터 무제한 5G 요금제로는 **5G 프리미엄**(월 89,000원)과 **5G 스탠다드**(월 75,000원)가 있어요. 영상 시청이 많다면 프리미엄을 추천해요.",
      ),
    ],
  },
  render: (args) => (
    <StoryFrame>
      <ChatMessageList {...args} />
    </StoryFrame>
  ),
};

export const StatusStreaming: Story = {
  name: "상태 · 응답 중",
  args: {
    isLoading: true,
    messages: [statusQuestion],
    streamingReply: {
      stage: "generating",
      content: "데이터 무제한 5G 요금제로는 **5G 프리미엄**",
    },
  },
  render: (args) => (
    <StoryFrame>
      <ChatMessageList {...args} />
    </StoryFrame>
  ),
};

export const StatusError: Story = {
  name: "상태 · 실패 (다시 시도)",
  args: {
    isLoading: false,
    messages: [
      statusQuestion,
      statusAnswer(
        "error",
        "답변을 생성하지 못했어요. 잠시 후 다시 시도해 주세요.",
      ),
    ],
    onRetryAnswer: noop,
  },
  render: (args) => (
    <StoryFrame>
      <ChatMessageList {...args} />
    </StoryFrame>
  ),
};

export const StatusStopped: Story = {
  name: "상태 · 중단 (받은 글 있음, 툴팁 표시)",
  args: {
    editHintMessageId: statusQuestion.id,
    isLoading: false,
    messages: [
      statusQuestion,
      statusAnswer("stopped", "데이터 무제한 5G 요금제로는 **5G 프리미엄**"),
    ],
    onEditPrompt: noop,
  },
  render: (args) => (
    <StoryFrame>
      <ChatMessageList {...args} />
    </StoryFrame>
  ),
};

export const StatusStoppedEmpty: Story = {
  name: "상태 · 중단 (받은 글 없음)",
  args: {
    isLoading: false,
    messages: [statusQuestion, statusAnswer("stopped", "")],
    onEditPrompt: noop,
  },
  render: (args) => (
    <StoryFrame>
      <ChatMessageList {...args} />
    </StoryFrame>
  ),
};

export const StatusPending: Story = {
  name: "상태 · 기록 열람 시 생성 중",
  args: {
    isLoading: false,
    messages: [
      statusQuestion,
      statusAnswer(
        "pending",
        "아직 답변을 만들고 있어요. 잠시 후 상담 내역을 다시 열어 주세요.",
      ),
    ],
  },
  render: (args) => (
    <StoryFrame>
      <ChatMessageList {...args} />
    </StoryFrame>
  ),
};
