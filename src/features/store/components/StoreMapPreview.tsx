import { MapPin, Navigation } from "lucide-react";
import { useKakaoMapReady } from "@/features/store/hooks/useKakaoMapReady";
import { getKakaoDirectionUrl } from "@/features/store/lib/mapLinks";
import type { StoreLocation } from "@/features/store/types";
import { cn } from "@/shared/lib/cn";
import { ButtonLink } from "@/shared/ui/Button";

const markerPositions = [
  "left-[47%] top-[39%]",
  "left-[34%] top-[58%]",
  "left-[63%] top-[29%]",
] as const;

type StoreMapPreviewProps = {
  selectedStore?: StoreLocation;
  selectedStoreId: string;
  stores: StoreLocation[];
  onSelectStore: (storeId: string) => void;
};

export const StoreMapPreview = ({
  onSelectStore,
  selectedStore,
  selectedStoreId,
  stores,
}: StoreMapPreviewProps) => {
  const isKakaoMapReady = useKakaoMapReady();

  return (
    <section
      data-kakao-map-ready={isKakaoMapReady}
      className="border-border relative overflow-hidden rounded-3xl border bg-white shadow-sm dark:border-white/10 dark:bg-zinc-950"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_46%_42%,rgba(255,179,25,0.22),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.94),rgba(246,248,251,0.96))] dark:bg-[radial-gradient(circle_at_46%_42%,rgba(255,179,25,0.2),transparent_28%),linear-gradient(135deg,rgba(24,24,27,0.98),rgba(9,9,11,0.98))]" />
      <div className="absolute inset-0 [background-image:linear-gradient(rgba(100,116,139,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(100,116,139,0.14)_1px,transparent_1px)] [background-size:42px_42px] opacity-[0.38]" />

      <div className="relative h-full min-h-[420px] p-5 sm:p-7">
        <div className="bg-brand/15 absolute top-[17%] left-[14%] h-24 w-24 rounded-full blur-2xl" />
        <div className="absolute right-[16%] bottom-[18%] h-32 w-32 rounded-full bg-orange-300/20 blur-3xl" />

        {stores.map((store, index) => {
          const isSelected = selectedStoreId === store.id;

          return (
            <button
              key={store.id}
              type="button"
              onClick={() => onSelectStore(store.id)}
              aria-pressed={isSelected}
              className={cn(
                "absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border px-3 py-2 text-xs font-extrabold shadow-sm transition",
                markerPositions[index % markerPositions.length],
                isSelected
                  ? "border-brand bg-brand text-white"
                  : "text-text-secondary hover:border-brand/50 hover:text-text-primary border-white bg-white dark:border-white/15 dark:bg-zinc-900 dark:text-gray-200",
              )}
            >
              <MapPin size={15} />
              {store.name.replace("VITA ", "")}
            </button>
          );
        })}

        {selectedStore && (
          <div className="border-border absolute right-6 bottom-6 left-6 rounded-3xl border bg-white/90 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-zinc-950/86">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-brand text-xs font-bold">추천 매장</p>
                <p className="text-text-primary mt-1 text-base font-extrabold dark:text-white">
                  {selectedStore.name}
                </p>
                <p className="text-text-secondary mt-1 text-xs leading-5 dark:text-gray-400">
                  {selectedStore.address}
                </p>
              </div>

              <ButtonLink
                href={getKakaoDirectionUrl(selectedStore)}
                target="_blank"
                rel="noreferrer"
                variant="primary"
                size="sm"
                className="rounded-full"
              >
                <Navigation size={16} />
                길찾기
              </ButtonLink>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
