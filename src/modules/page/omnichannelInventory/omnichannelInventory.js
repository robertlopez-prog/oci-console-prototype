import { LightningElement, track } from 'lwc';
import { INVENTORY_RECORDS } from 'data/deletionJobs';

// Inventory lookup result rows (location-level breakdown)
const LOCATION_ROWS = [
    { id: 1, location: 'Chicago Michigan', refId: '0043', atf: 10, ato: 12, qoh: 12, reservations: 2, safetyStock: 0, targetInventory: 2 },
    { id: 2, location: 'Uptown Chicago O...', refId: '0051', atf: 5,  ato: 5,  qoh: 5,  reservations: 0, safetyStock: 0, targetInventory: 0 },
    { id: 3, location: 'Marina SFO Wareh...', refId: '0070', atf: 2,  ato: 2,  qoh: 2,  reservations: 0, safetyStock: 0, targetInventory: 0 },
];

const LOCATION_GROUPS = [
    { id: 1, groupNumber: 'Location Group 1', externalRef: '',                    enabled: false, syncWithOci: false },
    { id: 2, groupNumber: '123',              externalRef: '',                    enabled: false, syncWithOci: false },
    { id: 3, groupNumber: 'Test Store',       externalRef: 'TestStore_LocationGroup', enabled: true, syncWithOci: true  },
    { id: 4, groupNumber: '100',              externalRef: '100',                 enabled: true,  syncWithOci: false },
];

const LOCATIONS = [
    { id: 1, name: 'Warehouse',            type: 'Warehouse', visitorAddress: '',           inventory: true,  syncWithOci: false },
    { id: 2, name: 'Reno NV Warehouse 0001', type: 'Warehouse', visitorAddress: 'A00000008', inventory: false, syncWithOci: true  },
    { id: 3, name: 'Alpine',               type: 'Virtual',   visitorAddress: '',           inventory: false, syncWithOci: false },
    { id: 4, name: 'Alpine828',            type: 'Virtual',   visitorAddress: '',           inventory: false, syncWithOci: false },
    { id: 5, name: 'Chicago Michigan',     type: 'Store',     visitorAddress: '540 N Michigan Ave', inventory: true, syncWithOci: true },
];

export default class OmnichannelInventory extends LightningElement {
    // Tab state
    @track activeTab = 'inventory-lookup'; // 'inventory-lookup' | 'location-mgmt'

    connectedCallback() {
        // Expose for Playwright test automation
        window.__ociPageInstance = this;
    }

    disconnectedCallback() {
        window.__ociPageInstance = null;
        if (this._toastTimer) clearTimeout(this._toastTimer);
    }

    // Lookup state
    @track searchSku = '';
    @track selectedLocationGroup = '';
    @track hasInventoryResults = false;
    @track inventoryResults = [];
    @track groupSummaryRows = [];

    // Modal state
    @track isDeleteModalOpen = false;

    // Toast state
    @track showToast = false;
    @track toastVariant = 'success';
    @track toastTitle = '';
    @track toastMessage = '';
    _toastTimer = null;

    // ── Tab computed ────────────────────────────────────────────────
    get isInventoryLookupActive()  { return this.activeTab === 'inventory-lookup'; }
    get isLocationMgmtActive()     { return this.activeTab === 'location-mgmt'; }

    get inventoryLookupTabClass() {
        return `oci-tabs__tab${this.isInventoryLookupActive ? ' oci-tabs__tab--active' : ''}`;
    }
    get locationMgmtTabClass() {
        return `oci-tabs__tab${this.isLocationMgmtActive ? ' oci-tabs__tab--active' : ''}`;
    }

    // ── Toast computed ──────────────────────────────────────────────
    get toastClass() {
        return `slds-notify slds-notify_toast slds-theme_${this.toastVariant}`;
    }
    get toastIcon() {
        const map = { success: 'utility:success', warning: 'utility:warning', error: 'utility:error', info: 'utility:info' };
        return map[this.toastVariant] || 'utility:info';
    }

    // ── Datatable columns ───────────────────────────────────────────
    get groupColumns() {
        return [
            { label: 'Location Group', fieldName: 'locationGroup', type: 'text' },
            { label: 'Reference ID',   fieldName: 'refId',          type: 'text' },
            { label: 'ATF',            fieldName: 'atf',            type: 'number' },
            { label: 'ATO',            fieldName: 'ato',            type: 'number' },
            { label: 'Quantity on Hand', fieldName: 'qoh',          type: 'number' },
            { label: 'Futures',        fieldName: 'futures',        type: 'number' },
            { label: 'Reservations',   fieldName: 'reservations',   type: 'number' },
            { label: 'Safety Stock',   fieldName: 'safetyStock',    type: 'number' },
        ];
    }

    get locationColumns() {
        return [
            { label: 'Location',        fieldName: 'location',       type: 'text' },
            { label: 'Reference ID',    fieldName: 'refId',          type: 'text' },
            { label: 'ATF',             fieldName: 'atf',            type: 'number' },
            { label: 'ATO',             fieldName: 'ato',            type: 'number' },
            { label: 'Quantity on Hand', fieldName: 'qoh',           type: 'number' },
            { label: 'Reservations',    fieldName: 'reservations',   type: 'number' },
            { label: 'Safety Stock',    fieldName: 'safetyStock',    type: 'number' },
            { label: 'Target Inventory', fieldName: 'targetInventory', type: 'number' },
        ];
    }

    get locationGroupColumns() {
        return [
            { label: 'Location Group Number', fieldName: 'groupNumber', type: 'text' },
            { label: 'External Reference',    fieldName: 'externalRef', type: 'text' },
            { label: 'Enabled',               fieldName: 'enabled',     type: 'boolean' },
            { label: 'Sync with OCI',         fieldName: 'syncWithOci', type: 'boolean' },
        ];
    }

    get locationColumns2() {
        return [
            { label: 'Location Name',    fieldName: 'name',           type: 'text' },
            { label: 'Location Type',    fieldName: 'type',           type: 'text' },
            { label: 'Visitor Address',  fieldName: 'visitorAddress', type: 'text' },
            { label: 'Inventory',        fieldName: 'inventory',      type: 'boolean' },
            { label: 'Sync with OCI',    fieldName: 'syncWithOci',    type: 'boolean' },
        ];
    }

    // ── Combobox options ────────────────────────────────────────────
    get locationGroupOptions() {
        return [
            { label: 'Alpine Storefront',  value: 'alpine-storefront' },
            { label: 'North Region',       value: 'north-region' },
            { label: 'South Region',       value: 'south-region' },
            { label: 'Test Store',         value: 'test-store' },
        ];
    }

    // ── Static data references ──────────────────────────────────────
    get locationGroups() { return LOCATION_GROUPS; }
    get locations()      { return LOCATIONS; }

    // ── Tab handlers ────────────────────────────────────────────────
    handleTabInventory() { this.activeTab = 'inventory-lookup'; }
    handleTabLocations() { this.activeTab = 'location-mgmt'; }

    // ── Inventory Lookup handlers ───────────────────────────────────
    handleSkuChange(event) {
        this.searchSku = event.detail.value;
    }

    handleLocationGroupChange(event) {
        this.selectedLocationGroup = event.detail.value;
    }

    handleGetInventoryData() {
        if (!this.searchSku) return;
        // Simulate a result with canned data
        this.inventoryResults = LOCATION_ROWS;
        this.groupSummaryRows = [{
            id: 1,
            locationGroup: 'Alpine Storefront',
            refId: 'nto-web',
            atf: 17, ato: 19, qoh: 19, futures: 2, reservations: 2, safetyStock: 0,
        }];
        this.hasInventoryResults = true;
    }

    // ── Action bar handlers ─────────────────────────────────────────
    handleAddInventory() {
        this._showToast('info', 'Add Inventory', 'Add Inventory modal — not implemented in this prototype.');
    }

    handleImport() {
        this._showToast('info', 'Import Inventory', 'Import Inventory modal — not implemented in this prototype.');
    }

    handleDeleteInventory() {
        this.isDeleteModalOpen = true;
    }

    handleJobHistorySelect(event) {
        const value = event.detail.value;
        if (value === 'deletion-history') {
            window.dispatchEvent(new CustomEvent('oci-open-deletion-history'));
        } else {
            this._showToast('info', 'Import History', 'Import History — not implemented in this prototype.');
        }
    }

    // ── Modal event handlers ────────────────────────────────────────
    handleModalClose() {
        this.isDeleteModalOpen = false;
    }

    handleModalSubmit(event) {
        this.isDeleteModalOpen = false;
        const batchId = event.detail?.batchId || 'DEL-0043';
        // Signal globalNavigation to open a Deletion History subtab in the context bar
        window.dispatchEvent(new CustomEvent('oci-open-deletion-history'));
        this._showToast(
            'success',
            'Deletion Job Submitted',
            `Job ${batchId} is processing. Monitor progress in Deletion History.`
        );
    }

    // ── Toast helpers ───────────────────────────────────────────────
    _showToast(variant, title, message) {
        if (this._toastTimer) clearTimeout(this._toastTimer);
        this.toastVariant = variant;
        this.toastTitle  = title;
        this.toastMessage = message;
        this.showToast   = true;
        this._toastTimer = setTimeout(() => { this.showToast = false; }, 5000);
    }

    handleToastClose() {
        this.showToast = false;
        if (this._toastTimer) clearTimeout(this._toastTimer);
    }

}
