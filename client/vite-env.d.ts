/// <reference types="vite/client" />

// Disable React Refresh for this project
declare global {
  interface Window {
    $RefreshReg$?: (type: any, id: string) => void;
    $RefreshSig$?: () => (type: any) => any;
    __vite_plugin_react_preamble_installed__?: boolean;
  }
}

export {};