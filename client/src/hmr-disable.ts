// GLOBAL HMR DISABLE - Import this first in all components
declare global {
  interface Window {
    $RefreshReg$: any;
    $RefreshSig$: any;
    __vite_plugin_react_preamble_installed__: boolean;
  }
}

// Override HMR functions safely
if (typeof window !== 'undefined') {
  // Set initial safe functions
  window.$RefreshReg$ = () => () => {};
  window.$RefreshSig$ = () => (type: any) => type;
  window.__vite_plugin_react_preamble_installed__ = true;
  
  console.log('[HMR-DISABLE] Safe HMR functions installed globally');
}

export {};