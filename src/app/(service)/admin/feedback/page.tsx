import { AnswerFeedbackManagement } from "@/features/admin";
import { Suspense } from "react";

const AdminFeedbackPage = () => (
  <Suspense fallback={<p role="status">답변 피드백을 불러오는 중입니다.</p>}>
    <AnswerFeedbackManagement />
  </Suspense>
);

export default AdminFeedbackPage;
