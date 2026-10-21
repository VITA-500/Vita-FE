import type { MapSearchPoint } from "@/features/store/search/lib/storePanelStores";
import { loadKakaoMapScript } from "@/shared/lib/kakaoMapScript";

/** 현재 로드된 매장 풀에 없는 지역·주소 검색을 nearby 조회 좌표로 변환한다. */
export const resolveStoreSearchPlace = async (
  query: string,
): Promise<MapSearchPoint | null> => {
  const isLoaded = await loadKakaoMapScript();
  const Geocoder = window.kakao?.maps?.services?.Geocoder;

  if (!isLoaded || !Geocoder) {
    return null;
  }

  return new Promise((resolve) => {
    new Geocoder().addressSearch(query.trim(), (results, status) => {
      if (status !== "OK" || !results[0]) {
        resolve(null);
        return;
      }

      const lat = Number(results[0].y);
      const lng = Number(results[0].x);

      resolve(
        Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null,
      );
    });
  });
};
