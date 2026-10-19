import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// 계층 경계 규칙(docs/Architecture.md "Import Rules").
// 리팩토링 기간에는 warn으로 두고, 마무리 단계에서 error로 올린다.
const BOUNDARY_LEVEL = "warn";
const rootDir = path.dirname(fileURLToPath(import.meta.url));
const sourceFiles = "**/*.{ts,tsx}";

/** src/{layer} 아래 slice(폴더) 이름 목록. 폴더가 없으면 빈 배열. */
const listSlices = (layer) => {
  const layerDir = path.join(rootDir, "src", layer);

  if (!existsSync(layerDir)) return [];

  return readdirSync(layerDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
};
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const upperLayerImport = (layers, message) => ({
  regex: `^@/(${layers.join("|")})(/|$)`,
  message,
});
const entityDeepImport = {
  // @/entities/store 는 허용, @/entities/store/model/... 같은 내부 경로는 금지
  regex: "^@/entities/[^/]+/",
  message: "entity는 공개 API(@/entities/{entity})로만 import한다.",
};

const boundaryRules = (patterns) => ({
  "no-restricted-imports": [BOUNDARY_LEVEL, { patterns }],
});

const sharedBoundary = {
  files: [`src/shared/${sourceFiles}`],
  rules: boundaryRules([
    upperLayerImport(
      ["app", "features", "entities"],
      "shared는 app·features·entities를 import하지 않는다.",
    ),
  ]),
};

const entityBoundaries = listSlices("entities").map((slice) => {
  const name = escapeRegex(slice);

  return {
    files: [`src/entities/${slice}/${sourceFiles}`],
    rules: boundaryRules([
      upperLayerImport(
        ["app", "features"],
        "entities는 app·features를 import하지 않는다.",
      ),
      {
        // 다른 entity는 @/entities/{other}/@x/{이 entity} 로만 import할 수 있다.
        regex: `^@/entities/(?!${name}(/|$))[^/]+(?:$|/(?!@x/${name}$))`,
        message: `다른 entity는 @/entities/{entity}/@x/${slice} 공개 API로만 import한다.`,
      },
    ]),
  };
});

const featureBoundaries = listSlices("features").map((slice) => {
  const name = escapeRegex(slice);

  return {
    files: [`src/features/${slice}/${sourceFiles}`],
    rules: boundaryRules([
      upperLayerImport(["app"], "features는 app을 import하지 않는다."),
      {
        regex: `^@/features/(?!${name}(/|$))`,
        message:
          "feature끼리 직접 import하지 않는다. app에서 조립하거나 entities로 내린다.",
      },
      entityDeepImport,
    ]),
  };
});

const appBoundary = {
  files: [`src/app/${sourceFiles}`],
  rules: boundaryRules([entityDeepImport]),
};

// Phase 5 transitional bridges: the legacy store slice still owns the panel
// composition while feature slices are being extracted incrementally.
const storeMigrationBridges = {
  files: [
    `src/features/store/${sourceFiles}`,
    `src/features/store-search/hooks/storeSearchActionsParams.ts`,
    `src/features/store-search/hooks/useStoreSearchState.ts`,
  ],
  rules: {
    "no-restricted-imports": "off",
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  sharedBoundary,
  ...entityBoundaries,
  ...featureBoundaries,
  appBoundary,
  storeMigrationBridges,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "storybook-static/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
