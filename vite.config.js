import { defineConfig } from 'vite';
import path from 'path';
import fs from 'fs';
import lwc from 'vite-plugin-lwc';
import {
  resolveIconTemplatesPlugin,
  iconTemplateExcludeDirs,
  iconTemplateAliases,
} from './vite-plugins/icon-templates.js';

/** LBC ships templates that trip many LWC diagnostics; app code cannot fix those. */
const LBC_UNDER_NODE_MODULES = /node_modules[/\\]lightning-base-components[/\\]/;

function isLightningBaseComponentsLwcRollupWarning(warning) {
  const locFile = warning.loc?.file ?? '';
  const id = warning.id ?? '';
  const message = warning.message ?? '';
  return (
    LBC_UNDER_NODE_MODULES.test(String(locFile)) ||
    LBC_UNDER_NODE_MODULES.test(String(id)) ||
    LBC_UNDER_NODE_MODULES.test(String(message))
  );
}

function suppressLbcLwcLoggerNoisePlugin() {
  return {
    name: 'suppress-lbc-lwc-logger-noise',
    configResolved(config) {
      const { logger } = config;
      const origWarn = logger.warn.bind(logger);
      logger.warn = (msg, options) => {
        if (LBC_UNDER_NODE_MODULES.test(String(msg))) return;
        origWarn(msg, options);
      };
      const origWarnOnce = logger.warnOnce.bind(logger);
      logger.warnOnce = (msg, options) => {
        if (LBC_UNDER_NODE_MODULES.test(String(msg))) return;
        origWarnOnce(msg, options);
      };
    },
  };
}

export default defineConfig(({ command }) => ({
  base: './',
  plugins: [
    suppressLbcLwcLoggerNoisePlugin(),
    resolveIconTemplatesPlugin(),
    lwc({
      modules: [
        {
          dir: path.resolve('./src/modules'),
        },
        // sds-components LWC source: prefer local monorepo clone in dev only.
        // Production builds always use shims — the monorepo's LWC config
        // references lightning-base-components via npm which can't be resolved
        // outside its own node_modules context at build time.
        ...(command === 'serve' && fs.existsSync(path.resolve('../salesforce-design-system/packages/sds-components/src'))
          ? [{ dir: path.resolve('../salesforce-design-system/packages/sds-components/src') }]
          : [{ dir: path.resolve('./src/build/shim') }]),
        {
          name: '@salesforce/gate/bc.260.enableComboboxElementInternals',
          path: path.resolve('./src/build/shim/gateComboboxElementInternalsClosed.js'),
        },
        // lightning/mobileCapabilities is a Salesforce platform virtual module not
        // available locally; stub it so barcodeScanner.js resolves without crashing.
        {
          name: 'lightning/mobileCapabilities',
          path: path.resolve('./src/build/shim/mobileCapabilities.js'),
        },
        // Components not exposed via isExposed:true in their js-meta.xml —
        // @lwc/module-resolver skips them, so we wire them up explicitly.
        { name: 'lightning/calendar',         path: path.resolve('./node_modules/lightning-base-components/src/lightning/calendar/calendar.js') },
        { name: 'lightning/datepicker',       path: path.resolve('./node_modules/lightning-base-components/src/lightning/datepicker/datepicker.js') },
        { name: 'lightning/datetimepicker',   path: path.resolve('./node_modules/lightning-base-components/src/lightning/datetimepicker/datetimepicker.js') },
        { name: 'lightning/timepicker',       path: path.resolve('./node_modules/lightning-base-components/src/lightning/timepicker/timepicker.js') },
        { name: 'lightning/colorPickerCustom',path: path.resolve('./node_modules/lightning-base-components/src/lightning/colorPickerCustom/colorPickerCustom.js') },
        { name: 'lightning/colorPickerPanel', path: path.resolve('./node_modules/lightning-base-components/src/lightning/colorPickerPanel/colorPickerPanel.js') },
        { name: 'lightning/colorSwatch',      path: path.resolve('./node_modules/lightning-base-components/src/lightning/colorSwatch/colorSwatch.js') },
        { name: 'lightning/staticMap',        path: path.resolve('./node_modules/lightning-base-components/src/lightning/staticMap/staticMap.js') },
        {
          npm: 'lightning-base-components',
        },
      ],
      disableSyntheticShadowSupport: false,
      enableDynamicComponents: true,
      exclude: [
        path.resolve('./index.html'),
        path.resolve('./src/build/generated'),
        // Global SLDS from node_modules (new URL in slds-loader.js) must not pass through LWC:
        // LWC rejects :root in this pipeline when synthetic shadow is enabled.
        /(salesforce-lightning-design-system\.min\.css|slds2\.cosmos\.css)(\?.*)?$/,
        // Global styles loaded via new URL() pattern must also bypass LWC plugin
        /\/styles\/global\.css(\?.*)?$/,
        // Storybook internals use dynamic imports that LWC strict mode rejects
        /node_modules[/\\]storybook[/\\]/,
        /node_modules[/\\]@storybook[/\\]/,
        ...iconTemplateExcludeDirs,
      ],
    }),
  ],
  build: {
    rollupOptions: {
      onwarn(warning, defaultHandler) {
        if (isLightningBaseComponentsLwcRollupWarning(warning)) return;
        defaultHandler(warning);
      },
    },
  },
  appType: 'spa',
  server: {
    port: 3000,
    open: false,
  },
  optimizeDeps: {
    exclude: ['lightning/modal', 'lightning/toast', 'lightning/toastContainer', 'lightning/showToastEvent', 'lightning/primitiveOverlay', 'lightning/overlayUtils', 'lightning/modalBase', 'lightning/utilsPrivate'],
  },
  resolve: {
    alias: {
      '@salesforce-ux/design-system': path.resolve('./node_modules/@salesforce-ux/design-system'),
      '@salesforce-ux/design-system-2': path.resolve('./node_modules/@salesforce-ux/design-system-2'),
      ...iconTemplateAliases,
    },
  },
}));
