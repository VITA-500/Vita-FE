import {
  getExtraServicesLabel,
  type ExtraService,
} from "@/features/store/lib/mapOverlayElements";
import type { MarkerColorInfo } from "@/features/store/lib/markerColors";
import { getFallbackMarkerStyle } from "@/features/store/lib/storeMapFallbackLayout";
import { getStoreMarkerLabel } from "@/features/store/lib/storeMarkerOverlays";
import {
  getMarkerGradientId,
  getStorePinSvgMarkup,
  STORE_PIN_SHAPE_CLASS_NAME,
} from "@/features/store/lib/storePinSvg";
import type { StoreLocation } from "@/features/store/types";
import { cn } from "@/shared/lib/cn";

const ExtraServiceBadge = ({ services }: { services: ExtraService[] }) => (
  <span
    className="group/extra absolute -top-1 left-0 z-[2] flex h-4 min-w-4 items-center justify-center rounded-full bg-slate-950/90 px-1 text-[9px] leading-none font-black text-white shadow-sm"
    aria-label={`추가 필터 조건: ${getExtraServicesLabel(services)}`}
  >
    +{services.length}
    <span className="pointer-events-none absolute top-[calc(100%+6px)] left-0 z-[4] flex min-w-max translate-y-1 flex-col gap-1 rounded-sm bg-slate-950/95 px-2.5 py-1.5 text-[10px] leading-snug font-extrabold whitespace-nowrap text-white opacity-0 shadow-lg transition group-hover/extra:translate-y-0 group-hover/extra:opacity-100">
      {services.map((service) => (
        <span key={service.label} className="flex items-center gap-1.5">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: service.color }}
          />
          {service.label}
        </span>
      ))}
    </span>
  </span>
);

type StoreMapFallbackMarkersProps = {
  markerColorInfoById?: Record<string, MarkerColorInfo>;
  markerLabelById?: Record<string, string>;
  onSelectStore: (storeId: string) => void;
  selectedStoreId: string;
  stores: StoreLocation[];
};

/** 카카오맵 SDK를 쓸 수 없을 때(대체 지도) 보여주는 매장 핀. 매장 좌표 범위에 비례해 배치한다. */
export const StoreMapFallbackMarkers = ({
  markerColorInfoById,
  markerLabelById,
  onSelectStore,
  selectedStoreId,
  stores,
}: StoreMapFallbackMarkersProps) => (
  <>
    {stores.map((store, index) => {
      const isSelected = selectedStoreId === store.id;
      const markerColorInfo = markerColorInfoById?.[store.id];
      const markerColors = markerColorInfo?.colors ?? [];
      const gradientId = getMarkerGradientId({
        colors: markerColors,
        coordinateKey: `${store.lat.toFixed(5)}:${store.lng.toFixed(5)}`,
        storeIds: [store.id],
      });

      return (
        <button
          key={store.id}
          type="button"
          onClick={() => onSelectStore(store.id)}
          aria-pressed={isSelected}
          className={cn(
            "group pointer-events-auto absolute block h-[46px] w-[38px] -translate-x-1/2 -translate-y-[calc(50%+8px)] border-0 bg-transparent p-0 text-xs leading-none font-black text-white transition duration-150 hover:-translate-y-[calc(50%+10px)] hover:scale-[1.04]",
            isSelected && "-translate-y-[calc(50%+10px)] scale-[1.04]",
          )}
          style={getFallbackMarkerStyle(store, stores, index)}
        >
          <span
            className={STORE_PIN_SHAPE_CLASS_NAME}
            dangerouslySetInnerHTML={{
              __html: getStorePinSvgMarkup({
                colors: markerColors,
                gradientId,
              }),
            }}
          />
          {markerColorInfo && markerColorInfo.extraServices.length > 0 && (
            <ExtraServiceBadge services={markerColorInfo.extraServices} />
          )}
          <span className="absolute top-[9px] left-1/2 z-[1] -translate-x-1/2 text-xs font-black text-white [text-shadow:_0_1px_2px_rgb(15_23_42_/_0.45)]">
            {markerLabelById?.[store.id] ?? getStoreMarkerLabel(index)}
          </span>
          <span
            className={cn(
              "pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-[2] max-w-[180px] -translate-x-1/2 translate-y-1 rounded-sm bg-slate-950/90 px-2.5 py-1.5 text-xs leading-tight font-extrabold whitespace-nowrap text-white opacity-0 shadow-lg transition group-hover:translate-y-0 group-hover:opacity-100",
              isSelected && "translate-y-0 opacity-100",
            )}
          >
            {store.name}
          </span>
        </button>
      );
    })}
  </>
);
