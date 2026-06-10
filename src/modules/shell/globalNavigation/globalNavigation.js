import { LightningElement, api, track } from 'lwc';
import { subscribe, navigate } from '../../../router';
import { getOrderById } from 'data/orderSummaries';
import { getFulfillmentOrderById } from 'data/fulfillmentOrders';

// Reference images from public directory using Vite's base URL
const getImagePath = (filename) => {
    const base = import.meta.env.BASE_URL || '/';
    return `${base}images/${filename}`;
};

const serviceIcon = getImagePath('ServiceCloud.png');
const marketingIcon = getImagePath('MarketingCloud.png');
const chatterIcon = getImagePath('feed.png');
const lightningIcon = getImagePath('LightningInstrumentation.png');
const cmsIcon = getImagePath('SalesforceCMS.png');
const inventoryIcon = getImagePath('InventoryConsole.png');
const omIcon = getImagePath('OMConsole.png');

const ORDER_MANAGEMENT_WORKSPACE_ITEMS = [
    { label: 'Order Summaries',           iconName: 'standard:orders',          iconClass: 'slds-icon-standard-orders' },
    { label: 'Order Payment Summaries',   iconName: 'standard:payment_gateway', iconClass: 'slds-icon-standard-payment-gateway' },
    { label: 'Fulfillment Orders',        iconName: 'standard:fulfillment_order', iconClass: 'slds-icon-standard-fulfillment-order' },
    { label: 'Return Orders',             iconName: 'standard:return_order',     iconClass: 'slds-icon-standard-return-order' },
    { label: 'Locations',                 iconName: 'standard:location',         iconClass: 'slds-icon-standard-location' },
    { label: 'Order Fulfillment Setup',   iconName: 'standard:settings',         iconClass: 'slds-icon-standard-settings' },
    { label: 'Order Orchestration Setup', iconName: 'standard:settings',         iconClass: 'slds-icon-standard-settings' },
    { label: 'OM Analytics',              iconName: 'standard:metrics',          iconClass: 'slds-icon-standard-metrics' },
];

const OMNICHANNEL_INVENTORY_WORKSPACE_ITEMS = [
    { label: 'Home',                 iconName: 'standard:home',     iconClass: 'slds-icon-standard-home' },
    { label: 'Locations',            iconName: 'standard:location', iconClass: 'slds-icon-standard-location' },
    { label: 'Location Groups',      iconName: 'standard:groups',   iconClass: 'slds-icon-standard-groups' },
    { label: 'Omnichannel Overview', iconName: 'standard:settings', iconClass: 'slds-icon-standard-settings' },
];

const DEFAULT_WORKSPACE_OM = 'Order Summaries';
const DEFAULT_WORKSPACE_OCI = 'Home';
const APP_LAUNCHER_ITEMS = [
    { id: 'service', label: 'Service', iconName: 'standard:service_crew', customIcon: serviceIcon, path: null },
    { id: 'marketing-crm-classic', label: 'Marketing CRM Classic', iconName: 'standard:marketing_actions', customIcon: marketingIcon, path: null },
    { id: 'salesforce-chatter', label: 'Salesforce Chatter', iconName: 'standard:feed', customIcon: chatterIcon, path: null },
    { id: 'lightning-usage-app', label: 'Lightning Usage App', iconName: 'standard:forecasts', customIcon: lightningIcon, path: null },
    { id: 'digital-experiences', label: 'Digital Experiences', iconName: 'standard:portal', customIcon: cmsIcon, path: null },
    { id: 'omnichannel-inventory', label: 'Omnichannel Inventory', iconName: 'standard:product', customIcon: inventoryIcon, path: '/omnichannel-inventory' },
    { id: 'order-management', label: 'Order Management', iconName: 'standard:orders', customIcon: omIcon, path: '/order-summaries' },
];

export default class GlobalNavigation extends LightningElement {
    @api currentPage = null;
    @api workspacePaths = {};

    @track _subtabs = [];
    @track _activeTabId = null;

    isWaffleMenuOpen = false;
    isWorkspaceMenuOpen = false;
    _activeWorkspaceLabel = null;
    appSearchQuery = '';

    get isOmnichannelInventory() {
        return this.currentPage === 'omnichannel-inventory'
            || this.currentPage === 'omnichannel-overview';
    }

    get workspaceItems() {
        const items = this.isOmnichannelInventory ? OMNICHANNEL_INVENTORY_WORKSPACE_ITEMS : ORDER_MANAGEMENT_WORKSPACE_ITEMS;
        const active = this.activeWorkspaceLabel;
        return items.map((ws) => {
            const isSelected = ws.label === active;
            return {
                label: ws.label,
                iconName: ws.iconName,
                optionClass: 'oms-nav__option',
                isSelected: String(isSelected),
                tabindex: isSelected ? '0' : '-1',
            };
        });
    }

    get defaultWorkspace() {
        return this.isOmnichannelInventory ? DEFAULT_WORKSPACE_OCI : DEFAULT_WORKSPACE_OM;
    }

    get appName() {
        return this.isOmnichannelInventory ? 'Omnichannel Inventory' : 'Order Management';
    }

    get activeWorkspaceLabel() {
        // Initialize workspace label if not set
        if (!this._activeWorkspaceLabel) {
            this._activeWorkspaceLabel = this.defaultWorkspace;
        }

        // Sync active workspace label with current route if it maps to a workspace
        const items = this.isOmnichannelInventory ? OMNICHANNEL_INVENTORY_WORKSPACE_ITEMS : ORDER_MANAGEMENT_WORKSPACE_ITEMS;
        const match = items.find((ws) => {
            const path = this.workspacePaths[ws.label];
            if (!path) return false;
            // Match by navPage derived from the path
            const navPage = path.replace(/^\//, '').replace(/-/g, '-');
            return navPage === this.currentPage;
        });
        return match ? match.label : this._activeWorkspaceLabel;
    }

    get waffleAriaExpanded() {
        return String(this.isWaffleMenuOpen);
    }

    get workspaceAriaExpanded() {
        return String(this.isWorkspaceMenuOpen);
    }

    get waffleTriggerClass() {
        const base = 'slds-context-bar__item slds-context-bar__dropdown-trigger slds-dropdown-trigger slds-dropdown-trigger_click slds-no-hover';
        return this.isWaffleMenuOpen ? `${base} slds-is-open` : base;
    }

    get workspaceTabClass() {
        const base = 'slds-context-bar__item slds-context-bar__object-switcher slds-context-bar__dropdown-trigger slds-dropdown-trigger slds-dropdown-trigger_click slds-is-active';
        return this.isWorkspaceMenuOpen ? `${base} slds-is-open` : base;
    }

    get subtabs() {
        return this._subtabs.map((tab) => ({
            ...tab,
            isActive: tab.id === this._activeTabId,
            itemClass: `slds-context-bar__item slds-context-bar__item_tab${tab.id === this._activeTabId ? ' slds-is-active' : ''}`,
        }));
    }

    get hasSubtabs() {
        return this._subtabs.length > 0;
    }

    get appLauncherItems() {
        const query = this.appSearchQuery.trim().toLowerCase();
        if (!query) return APP_LAUNCHER_ITEMS;
        return APP_LAUNCHER_ITEMS.filter((item) => item.label.toLowerCase().includes(query));
    }

    handleWaffleOpen() {
        this.isWorkspaceMenuOpen = false;
        this.isWaffleMenuOpen = !this.isWaffleMenuOpen;
    }

    handleAppLauncherItemClick(event) {
        event.preventDefault();
        const appId = event.currentTarget.dataset.appId;
        const app = APP_LAUNCHER_ITEMS.find((item) => item.id === appId);

        this.isWaffleMenuOpen = false;

        if (app?.path) {
            this.dispatchEvent(new CustomEvent('navigate', { detail: { path: app.path }, bubbles: true, composed: true }));
        }
    }

    handleAppSearchChange(event) {
        event.preventDefault();
        this.appSearchQuery = event.target?.value ?? '';
    }

    handleWorkspaceTabClick(event) {
        event.preventDefault();
        const path = this.workspacePaths[this.activeWorkspaceLabel];
        if (path) {
            this.dispatchEvent(new CustomEvent('navigate', { detail: { path }, bubbles: true, composed: true }));
        }
    }

    handleWorkspaceTriggerClick(event) {
        event.preventDefault();
        event.stopPropagation();
        this.isWaffleMenuOpen = false;
        this.isWorkspaceMenuOpen = !this.isWorkspaceMenuOpen;
        if (this.isWorkspaceMenuOpen) {
            this._focusSelectedOnNextRender = true;
        }
    }

    handleWorkspaceSelect(event) {
        event.preventDefault();
        const label = event.currentTarget.dataset.workspaceLabel;
        if (!label) return;
        this._activeWorkspaceLabel = label;
        this.isWorkspaceMenuOpen = false;
        const path = this.workspacePaths[label];
        if (path) {
            this.dispatchEvent(new CustomEvent('navigate', { detail: { path }, bubbles: true, composed: true }));
        }
    }

    handleWorkspaceMenuKeydown(event) {
        if (event.key === 'Escape') {
            event.preventDefault();
            this.isWorkspaceMenuOpen = false;
            this.template.querySelector('[aria-controls="oms-workspace-menu"]')?.focus();
            return;
        }
        if (event.key === 'Tab') {
            this.isWorkspaceMenuOpen = false;
            return;
        }
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            const options = Array.from(this.template.querySelectorAll('[role="option"]'));
            const idx = options.indexOf(document.activeElement);
            const next = event.key === 'ArrowDown'
                ? (idx + 1) % options.length
                : (idx - 1 + options.length) % options.length;
            options[next]?.focus();
        }
    }

    handleSubtabClick(event) {
        event.preventDefault();
        const id = event.currentTarget.dataset.id;
        const tab = this._subtabs.find((t) => t.id === id);
        if (tab) {
            this._activeTabId = id;
            navigate(tab.path);
        }
    }

    handleSubtabClose(event) {
        event.preventDefault();
        event.stopPropagation();
        const id = event.currentTarget.dataset.id;
        const idx = this._subtabs.findIndex((t) => t.id === id);
        this._subtabs = this._subtabs.filter((t) => t.id !== id);
        if (this._activeTabId === id) {
            const next = this._subtabs[idx] ?? this._subtabs[idx - 1];
            if (next) {
                this._activeTabId = next.id;
                navigate(next.path);
            } else {
                this._activeTabId = null;
                const fallback = id.startsWith('fo-') ? '/fulfillment-orders' : '/order-summaries';
                navigate(fallback);
            }
        }
    }

    _openSubtabForRoute(route) {
        const path = route?.path;
        if (!path) return;

        let tabId, label, tabPath;

        let iconName;

        if (path.startsWith('/order-summaries/')) {
            const id = route.params?.id;
            if (!id) return;
            const order = getOrderById(id);
            tabId = `os-${id}`;
            label = order ? `${order.orderNumber} | Order Summary` : `Order ${id}`;
            tabPath = `/order-summaries/${id}`;
            iconName = 'standard:orders';
        } else if (path.startsWith('/fulfillment-orders/')) {
            const id = route.params?.id;
            if (!id) return;
            const fo = getFulfillmentOrderById(id);
            tabId = `fo-${id}`;
            label = fo ? `${fo.orderNumber} | Fulfillment Order` : `FO ${id}`;
            tabPath = `/fulfillment-orders/${id}`;
            iconName = 'standard:fulfillment_order';
        } else {
            return;
        }

        if (!this._subtabs.find((t) => t.id === tabId)) {
            this._subtabs = [...this._subtabs, { id: tabId, label, path: tabPath, iconName }];
        }
        this._activeTabId = tabId;
    }

    connectedCallback() {
        this._unsubscribeRouter = subscribe((route) => {
            this._openSubtabForRoute(route);
            const p = route?.path ?? '';
            // Sync active tab when navigating to deletion-history directly
            if (p === '/deletion-history') {
                const existing = this._subtabs.find((t) => t.id === 'deletion-history');
                if (existing) this._activeTabId = 'deletion-history';
            }
            if (!p.startsWith('/order-summaries/') && !p.startsWith('/fulfillment-orders/') && p !== '/deletion-history') {
                this._activeTabId = null;
            }
        });

        // Listen for OCI page requesting Deletion History subtab
        this._handleOpenDeletionHistory = () => {
            const TAB_ID = 'deletion-history';
            if (!this._subtabs.find((t) => t.id === TAB_ID)) {
                this._subtabs = [
                    ...this._subtabs,
                    { id: TAB_ID, label: 'Deletion History', path: '/deletion-history', iconName: 'utility:delete' },
                ];
            }
            this._activeTabId = TAB_ID;
            navigate('/deletion-history');
        };
        window.addEventListener('oci-open-deletion-history', this._handleOpenDeletionHistory);

        this._handleDocumentClick = (e) => {
            if (!this.isWaffleMenuOpen && !this.isWorkspaceMenuOpen) return;
            const path = e.composedPath ? e.composedPath() : [];
            if (!path.includes(this.template.host)) {
                this.isWaffleMenuOpen = false;
                this.isWorkspaceMenuOpen = false;
            }
        };
        document.addEventListener('click', this._handleDocumentClick);
    }

    disconnectedCallback() {
        this._unsubscribeRouter?.();
        window.removeEventListener('oci-open-deletion-history', this._handleOpenDeletionHistory);
        document.removeEventListener('click', this._handleDocumentClick);
    }

    renderedCallback() {
        if (this._focusSelectedOnNextRender) {
            this._focusSelectedOnNextRender = false;
            const selected = this.template.querySelector('[aria-selected="true"]');
            if (selected) setTimeout(() => selected.focus(), 0);
        }
    }
}
