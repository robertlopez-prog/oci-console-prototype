import { LightningElement, track } from 'lwc';
import { INVENTORY_RECORDS } from 'data/deletionJobs';
import {
    SEGMENTATION_RULES,
    LOCATION_GROUPS as SEG_LOCATION_GROUPS,
    LOCATIONS as SEG_LOCATIONS,
} from 'data/segmentationRules';

const RULE_LIMIT = 500;

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
    @track activeTab = 'inventory-lookup'; // 'inventory-lookup' | 'location-mgmt' | 'segmentation-rules'

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

    // Segmentation rules state
    @track segRules = [...SEGMENTATION_RULES];
    @track segSearch = '';
    @track segFilterGroup = '';
    @track segFilterType = '';
    @track segCurrentPage = 1;
    @track isRuleBuilderOpen = false;
    @track editingRule = null;
    @track isRebalancing = false;
    @track lastRebalanced = 'Jun 9, 2026, 2:34 PM';
    @track hasPendingChanges = true; // start with pending to demo the state

    // Toast state
    @track showToast = false;
    @track toastVariant = 'success';
    @track toastTitle = '';
    @track toastMessage = '';
    _toastTimer = null;

    // ── Tab computed ────────────────────────────────────────────────
    get isInventoryLookupActive()  { return this.activeTab === 'inventory-lookup'; }
    get isLocationMgmtActive()     { return this.activeTab === 'location-mgmt'; }
    get isSegmentationRulesActive(){ return this.activeTab === 'segmentation-rules'; }

    get inventoryLookupTabClass() {
        return `oci-tabs__tab${this.isInventoryLookupActive ? ' oci-tabs__tab--active' : ''}`;
    }
    get locationMgmtTabClass() {
        return `oci-tabs__tab${this.isLocationMgmtActive ? ' oci-tabs__tab--active' : ''}`;
    }
    get segmentationTabClass() {
        return `oci-tabs__tab${this.isSegmentationRulesActive ? ' oci-tabs__tab--active' : ''}`;
    }

    // ── Segmentation computed ───────────────────────────────────────
    get segGroupFilterOptions() {
        return [
            { label: 'All Groups', value: '' },
            ...SEG_LOCATION_GROUPS,
        ];
    }

    get segTypeFilterOptions() {
        return [
            { label: 'All Types', value: '' },
            { label: 'Percentage (%)', value: 'percentage' },
            { label: 'Max Fixed Quantity', value: 'maxQty' },
        ];
    }

    get filteredSegRules() {
        const q = this.segSearch.toLowerCase();
        return this.segRules.filter(r => {
            const matchSearch = !q || [r.groupLabel, r.locationLabel, r.skuLabel, r.ruleType]
                .some(f => f && f.toLowerCase().includes(q));
            const matchGroup = !this.segFilterGroup || r.groupId === this.segFilterGroup;
            const matchType  = !this.segFilterType  || r.ruleType === this.segFilterType;
            return matchSearch && matchGroup && matchType;
        });
    }

    get segPageSize() { return 10; }

    get segTotalPages() {
        return Math.max(1, Math.ceil(this.filteredSegRules.length / this.segPageSize));
    }

    get segPagedRules() {
        const start = (this.segCurrentPage - 1) * this.segPageSize;
        return this.filteredSegRules.slice(start, start + this.segPageSize);
    }

    get segRuleRows() {
        return this.segPagedRules.map(r => ({
            ...r,
            displayValue: r.ruleType === 'percentage' ? `${r.value}%` : `Max ${r.value.toLocaleString()}`,
            ruleTypeLabel: r.ruleType === 'percentage' ? 'Percentage' : 'Max Qty',
            statusBadgeClass: r.status === 'pending'
                ? 'seg-status-badge seg-status-badge--pending'
                : 'seg-status-badge seg-status-badge--active',
        }));
    }

    get segShowPaging() { return this.filteredSegRules.length > this.segPageSize; }
    get segPrevDisabled() { return this.segCurrentPage <= 1; }
    get segNextDisabled() { return this.segCurrentPage >= this.segTotalPages; }

    get segTotalRuleCount() { return this.segRules.length; }
    get segAtLimit() { return this.segRules.length >= RULE_LIMIT; }
    get segRuleCountLabel() { return `${this.segRules.length} rule${this.segRules.length !== 1 ? 's' : ''}`; }
    get segFilteredCountLabel() {
        const f = this.filteredSegRules.length;
        const t = this.segRules.length;
        return f === t ? `${t} rule${t !== 1 ? 's' : ''}` : `${f} of ${t} rules`;
    }

    get rebalanceLabel() { return this.isRebalancing ? 'Rebalancing…' : 'Trigger Rebalance'; }
    get segNewRuleDisabled() { return this.segAtLimit; }
    get segNewRuleTitle() {
        return this.segAtLimit
            ? 'Rule limit reached. Use Import to add more rules.'
            : 'Create a new segmentation rule';
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
    handleTabInventory()    { this.activeTab = 'inventory-lookup'; }
    handleTabLocations()    { this.activeTab = 'location-mgmt'; }
    handleTabSegmentation() { this.activeTab = 'segmentation-rules'; }

    // ── Segmentation Rules handlers ─────────────────────────────────
    handleSegSearch(event)      { this.segSearch = event.detail.value; this.segCurrentPage = 1; }
    handleSegFilterGroup(event) { this.segFilterGroup = event.detail.value; this.segCurrentPage = 1; }
    handleSegFilterType(event)  { this.segFilterType = event.detail.value; this.segCurrentPage = 1; }

    handleSegNewRule() {
        if (this.segAtLimit) return;
        this.editingRule = null;
        this.isRuleBuilderOpen = true;
    }

    handleSegEditRule(event) {
        const ruleId = event.currentTarget.dataset.id;
        this.editingRule = this.segRules.find(r => r.id === ruleId) || null;
        this.isRuleBuilderOpen = true;
    }

    handleSegDeleteRule(event) {
        const ruleId = event.currentTarget.dataset.id;
        this.segRules = this.segRules.filter(r => r.id !== ruleId);
        this.hasPendingChanges = true;
        this._showToast('success', 'Rule Deleted', 'The segmentation rule has been removed. Trigger a rebalance to apply changes.');
    }

    handleRuleBuilderClose() {
        this.isRuleBuilderOpen = false;
        this.editingRule = null;
    }

    handleRuleBuilderSave(event) {
        const rule = event.detail.rule;
        const idx = this.segRules.findIndex(r => r.id === rule.id);
        if (idx >= 0) {
            // Edit existing
            const updated = [...this.segRules];
            updated[idx] = rule;
            this.segRules = updated;
            this._showToast('success', 'Rule Updated', 'Rule saved with "Pending Rebalance" status — trigger a rebalance to apply.');
        } else {
            // New rule
            this.segRules = [rule, ...this.segRules];
            this._showToast('success', 'Rule Created', 'Rule saved with "Pending Rebalance" status — trigger a rebalance to apply.');
        }
        this.hasPendingChanges = true;
        this.isRuleBuilderOpen = false;
        this.editingRule = null;
    }

    handleTriggerRebalance() {
        this.isRebalancing = true;
        setTimeout(() => {
            // Simulate rebalance completing
            this.segRules = this.segRules.map(r => ({
                ...r,
                status: 'active',
                lastRebalanced: 'Jun 9, 2026 (just now)',
            }));
            this.lastRebalanced = 'Jun 9, 2026 (just now)';
            this.hasPendingChanges = false;
            this.isRebalancing = false;
            this._showToast('success', 'Rebalance Complete', 'All segmentation rules are now active and applied to live inventory.');
        }, 2000);
    }

    handleSegImport() {
        this._showToast('info', 'Import Segmentation Rules', 'Import modal — not implemented in this prototype.');
    }

    handleSegExport() {
        this._showToast('info', 'Export Rules', 'Downloading rules export — not implemented in this prototype.');
    }

    handleSegPrevPage() {
        if (this.segCurrentPage > 1) this.segCurrentPage -= 1;
    }

    handleSegNextPage() {
        if (this.segCurrentPage < this.segTotalPages) this.segCurrentPage += 1;
    }

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
