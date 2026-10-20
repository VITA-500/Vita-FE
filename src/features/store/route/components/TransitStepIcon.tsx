import { Bus, SportShoe, TrainFront } from "lucide-react";
import type { TransitRouteStep } from "@/features/store/route/lib/storeRoutePreview";

/**
 * 대중교통 구간 종류별 아이콘(버스·지하철·그 외 도보).
 * 렌더 중에 아이콘 컴포넌트를 골라 쓰면(react-hooks/static-components) 매번 새 컴포넌트로 취급되므로,
 * 고정된 컴포넌트 안에서 종류에 맞는 아이콘을 그린다.
 */
export const TransitStepIcon = ({
  kind,
  size,
}: {
  kind: TransitRouteStep["kind"];
  size: number;
}) => {
  if (kind === "bus") return <Bus size={size} />;
  if (kind === "subway") return <TrainFront size={size} />;

  return <SportShoe size={size} />;
};
