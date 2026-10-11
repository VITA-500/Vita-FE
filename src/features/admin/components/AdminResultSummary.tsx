type AdminResultSummaryProps = {
  keyword?: string;
  rangeEnd: number;
  rangeStart: number;
  totalCount: number;
};

export const AdminResultSummary = ({
  keyword = "",
  rangeEnd,
  rangeStart,
  totalCount,
}: AdminResultSummaryProps) => {
  const normalizedKeyword = keyword.trim();

  return (
    <p className="text-text-secondary mt-4 text-sm font-bold">
      {normalizedKeyword && `"${normalizedKeyword}" 검색 결과 `}
      {rangeStart.toLocaleString("ko-KR")}-{rangeEnd.toLocaleString("ko-KR")} /{" "}
      총 {totalCount.toLocaleString("ko-KR")}개
    </p>
  );
};
