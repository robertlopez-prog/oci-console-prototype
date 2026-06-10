import { LightningElement } from 'lwc';
import { subscribe, navigate, linkHref } from '../../../router';
import { routes } from '../../../routes.config';
import { toggleSLDS, activeSLDSVersion, STORAGE_KEY_SLDS_VERSION } from '../../../build/slds-loader';
import Home from 'page/home';
import OmnichannelInventory from 'page/omnichannelInventory';
import DeletionHistory from 'page/deletionHistory';
import OmnichannelOverview from 'page/omnichannelOverview';
import NotFound from 'page/notFound';

const ROUTE_COMPONENTS = {
    'page-home': Home,
    'page-omnichannel-inventory': OmnichannelInventory,
    'page-deletion-history': DeletionHistory,
    'page-omnichannel-overview': OmnichannelOverview,
};

/** component name → nav page id */
const ROUTE_TO_NAV_PAGE = Object.fromEntries(
    routes.filter((r) => r.navPage || r.navHighlight).map((r) => [r.component, r.navPage ?? r.navHighlight])
);

/** nav page id → path */
const NAV_PAGE_TO_PATH = Object.fromEntries(
    routes.filter((r) => r.navPage).map((r) => [r.navPage, r.navPath ?? r.path])
);

/** workspace label → path (for workspace nav) */
const WORKSPACE_TO_PATH = Object.fromEntries(
    routes.filter((r) => r.workspace).map((r) => [r.workspace, r.navPath ?? r.path])
);

const STORAGE_KEY_DARK_MODE = 'slds-ui-dark-mode';

export default class App extends LightningElement {
    route;
    _sldsVersion = 2;
    _darkMode = false;
    selectedPanel = 'agentforce_panel';
    isPanelOpen = false;

    get componentCtor() {
        if (!this.route) return NotFound;
        return ROUTE_COMPONENTS[this.route.component] ?? NotFound;
    }

    get currentNavPage() {
        const name = this.route?.component;
        return name ? (ROUTE_TO_NAV_PAGE[name] ?? null) : null;
    }

    get workspacePaths() {
        return WORKSPACE_TO_PATH;
    }

    connectedCallback() {
        this._restorePreferences();
        this._sldsVersion = activeSLDSVersion();
        this.unsubscribe = subscribe((route) => {
            this.route = route;
        });
    }

    _restorePreferences() {
        const savedVersion = localStorage.getItem(STORAGE_KEY_SLDS_VERSION);
        const savedDarkMode = localStorage.getItem(STORAGE_KEY_DARK_MODE);
        const version = savedVersion === '1' ? 1 : 2;
        if (savedDarkMode === 'true' && version === 2) {
            this._darkMode = true;
            document.body.classList.add('slds-color-scheme_dark');
        } else if (savedDarkMode === 'false') {
            this._darkMode = false;
            document.body.classList.remove('slds-color-scheme_dark');
        }
    }

    disconnectedCallback() {
        this.unsubscribe?.();
    }

    async handleToggleSLDS() {
        await toggleSLDS();
        this._sldsVersion = activeSLDSVersion();
        localStorage.setItem(STORAGE_KEY_SLDS_VERSION, String(this._sldsVersion));
        if (this._sldsVersion !== 2 && this._darkMode) {
            this._darkMode = false;
            document.body.classList.remove('slds-color-scheme_dark');
            localStorage.setItem(STORAGE_KEY_DARK_MODE, 'false');
        }
    }

    handleToggleDarkMode() {
        this._darkMode = !this._darkMode;
        document.body.classList.toggle('slds-color-scheme_dark', this._darkMode);
        localStorage.setItem(STORAGE_KEY_DARK_MODE, String(this._darkMode));
    }

    handleNavNavigate(event) {
        const path = event.detail?.path;
        if (path) navigate(path);
    }

    handlePanelSelect(event) {
        this.selectedPanel = event.detail?.name ?? this.selectedPanel;
        this.isPanelOpen = true;
    }

    handlePanelClose() {
        this.isPanelOpen = false;
    }

    get panelClasses() {
        return `slds-panel slds-size_medium slds-panel_docked slds-panel_docked-right ${this.isPanelOpen ? 'slds-is-open' : ''}`;
    }

    handleNavigateBack() {
        history.back();
    }
}
