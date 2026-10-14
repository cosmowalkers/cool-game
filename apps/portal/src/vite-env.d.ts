/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NOWORK_URL?: string;
  readonly VITE_GOMOKU_URL?: string;
  readonly VITE_JUNQI_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
