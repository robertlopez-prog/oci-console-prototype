import { LightningElement, api, track } from 'lwc';
import { LOCATION_GROUPS, LOCATIONS, SEGMENTATION_RULES } from 'data/segmentationRules';

const RULE_LIMIT = 500;

export default class SegmentationRuleBuilder extends LightningElement {
    /** If provided, the builder is in edit mode for an existing rule */
    @api editRule = null;
    @api totalRuleCount = 0;

    // Step 1: Scope
    @track selectedLocationIds = [];   // array of location value strings
    @track skuScope = 'all';
    @track specificSku = '';

    // Step 2: Rule type (shared across all group rows)
    @track ruleType = 'percentage';

    // Step 3: Group allocation rows — each: { id, groupId, value, priority }
    @track groupRows = [{ id: 'row-0', groupId: '', value: '', priority: 1 }];

    // Location picker dropdown open state
    @track isLocationPickerOpen = false;

    connectedCallback() {
        if (this.editRule) {
            this.selectedLocationIds = this.editRule.locationId === 'all'
                ? ['all']
                : [this.editRule.locationId].filter(Boolean);
            this.skuScope    = this.editRule.skuScope  || 'all';
            this.specificSku = this.editRule.skuScope === 'specific' ? (this.editRule.skuLabel || '') : '';
            this.ruleType    = this.editRule.ruleType  || 'percentage';
            this.groupRows   = [{
                id:       'row-0',
                groupId:  this.editRule.groupId  || '',
                value:    String(this.editRule.value || ''),
                priority: this.editRule.priority || 1,
            }];
        }
    }

    // ── Options ──────────────────────────────────────────────────────
    get allLocationOptions() { return LOCATIONS; }
    get groupOptions()       { return LOCATION_GROUPS; }

    get priorityOptions() {
        return [1,2,3,4,5,6,7,8,9,10].map(n => ({ label: String(n), value: String(n) }));
    }

    // ── Location multi-select ─────────────────────────────────────────
    get locationCheckboxItems() {
        return LOCATIONS.map(loc => ({
            ...loc,
            checked: this.selectedLocationIds.includes(loc.value),
            checkboxId: `loc-cb-${loc.value}`,
        }));
    }

    get selectedLocationPills() {
        return this.selectedLocationIds.map(id => {
            const opt = LOCATIONS.find(l => l.value === id);
            return { id, label: opt ? opt.label : id };
        });
    }

    get locationSummaryLabel() {
        const n = this.selectedLocationIds.length;
        if (n === 0) return 'Select location(s)...';
        if (n === 1) {
            const opt = LOCATIONS.find(l => l.value === this.selectedLocationIds[0]);
            return opt ? opt.label : this.selectedLocationIds[0];
        }
        return `${n} locations selected`;
    }

    get hasLocations() { return this.selectedLocationIds.length > 0; }

    // ── Group rows ────────────────────────────────────────────────────
    get canAddGroupRow() {
        return this.groupRows.length < 10;
    }

    get canRemoveGroupRow() {
        return this.groupRows.length > 1;
    }

    get groupRowsWithMeta() {
        const usedGroupIds = this.groupRows.map(r => r.groupId).filter(Boolean);
        return this.groupRows.map(row => {
            const groupOpt = LOCATION_GROUPS.find(g => g.value === row.groupId);
            const availableGroups = LOCATION_GROUPS.map(g => ({
                ...g,
                disabled: usedGroupIds.includes(g.value) && g.value !== row.groupId,
            }));
            return {
                ...row,
                groupLabel: groupOpt ? groupOpt.label : '',
                priorityString: String(row.priority),
                availableGroups,
                canRemove: this.canRemoveGroupRow,
                valueLabel: this.isPercentage ? 'Percentage (%)' : 'Max Units',
                valuePlaceholder: this.isPercentage ? '0–100' : 'e.g. 500',
            };
        });
    }

    // ── Allocation type ───────────────────────────────────────────────
    get isPercentage() { return this.ruleType === 'percentage'; }
    get isMaxQty()     { return this.ruleType === 'maxQty'; }

    get percentageTabClass() {
        return `rb-type-btn${this.isPercentage ? ' rb-type-btn--active' : ''}`;
    }
    get maxQtyTabClass() {
        return `rb-type-btn${this.isMaxQty ? ' rb-type-btn--active' : ''}`;
    }

    // ── Preview data ─────────────────────────────────────────────────
    // Use the first selected location for preview (representative)
    get previewLocationId() {
        return this.selectedLocationIds[0] || '';
    }

    get existingRulesForLocation() {
        if (!this.previewLocationId) return [];
        return SEGMENTATION_RULES.filter(r => {
            const locMatch = r.locationId === this.previewLocationId
                || r.locationId === 'all'
                || this.previewLocationId === 'all';
            const notSelf = !this.editRule || r.id !== this.editRule.id;
            return locMatch && notSelf;
        });
    }

    // All draft rows as preview entries
    get draftRules() {
        return this.groupRows
            .filter(row => row.groupId && row.value)
            .map(row => {
                const val = parseFloat(row.value);
                if (isNaN(val) || val <= 0) return null;
                const groupOpt = LOCATION_GROUPS.find(g => g.value === row.groupId);
                return {
                    id: `draft-${row.id}`,
                    groupId:    row.groupId,
                    groupLabel: groupOpt ? groupOpt.label : row.groupId,
                    ruleType:   this.ruleType,
                    value:      val,
                    isDraft:    true,
                };
            })
            .filter(Boolean);
    }

    // ── Validation ───────────────────────────────────────────────────
    get totalAllocatedPct() {
        if (!this.isPercentage) return 0;
        return this.groupRows.reduce((sum, row) => {
            const v = parseFloat(row.value);
            return sum + (isNaN(v) ? 0 : v);
        }, 0);
    }

    get isOverAllocated() {
        return this.isPercentage && this.totalAllocatedPct > 100;
    }

    get overAllocatedMessage() {
        return this.isOverAllocated
            ? `Group allocations total ${this.totalAllocatedPct}% — must be ≤ 100%.`
            : '';
    }

    get isSaveDisabled() {
        if (!this.hasLocations) return true;
        const hasValidGroupRow = this.groupRows.some(row => {
            if (!row.groupId || !row.value) return false;
            const val = parseFloat(row.value);
            if (isNaN(val) || val <= 0) return false;
            if (this.isPercentage && val > 100) return false;
            return true;
        });
        if (!hasValidGroupRow) return true;
        if (this.isOverAllocated) return true;
        if (this.skuScope === 'specific' && !this.specificSku.trim()) return true;
        return false;
    }

    // ── Modal meta ────────────────────────────────────────────────────
    get groupRowValueHeader() {
        return this.isPercentage ? 'Percentage (%)' : 'Max Units';
    }

    get isEdit()    { return !!this.editRule; }
    get modalTitle(){ return this.isEdit ? 'Edit Segment' : 'Create Segment'; }
    get saveLabel() {
        const locCount   = this.selectedLocationIds.length;
        const groupCount = this.groupRows.filter(r => r.groupId && r.value).length;
        if (!this.isEdit && (locCount > 1 || groupCount > 1)) {
            const total = locCount * groupCount;
            return `Save ${total} Segment${total !== 1 ? 's' : ''}`;
        }
        return this.isEdit ? 'Save Changes' : 'Save Segment';
    }

    get willCreateMultiple() {
        const locCount   = this.selectedLocationIds.length;
        const groupCount = this.groupRows.filter(r => r.groupId && r.value).length;
        return !this.isEdit && locCount > 0 && groupCount > 0 && (locCount > 1 || groupCount > 1);
    }

    get multipleRulesHint() {
        if (!this.willCreateMultiple) return '';
        const locCount   = this.selectedLocationIds.length;
        const groupCount = this.groupRows.filter(r => r.groupId && r.value).length;
        return `This will create ${locCount * groupCount} segment${locCount * groupCount !== 1 ? 's' : ''} (${locCount} location${locCount !== 1 ? 's' : ''} × ${groupCount} group${groupCount !== 1 ? 's' : ''}).`;
    }

    // ── Handlers: Location multi-select ──────────────────────────────
    handleLocationTriggerClick() {
        this.isLocationPickerOpen = !this.isLocationPickerOpen;
    }

    handleLocationCheckboxChange(event) {
        const locValue = event.currentTarget.dataset.value;
        const checked  = event.target.checked;
        if (checked) {
            if (!this.selectedLocationIds.includes(locValue)) {
                this.selectedLocationIds = [...this.selectedLocationIds, locValue];
            }
        } else {
            this.selectedLocationIds = this.selectedLocationIds.filter(id => id !== locValue);
        }
    }

    handleLocationPickerBlur(event) {
        // Close picker when focus leaves the container
        if (!this.template.querySelector('.rb-location-picker')?.contains(event.relatedTarget)) {
            this.isLocationPickerOpen = false;
        }
    }

    handleRemoveLocation(event) {
        const locId = event.currentTarget.dataset.id;
        this.selectedLocationIds = this.selectedLocationIds.filter(id => id !== locId);
    }

    // ── Handlers: SKU scope ───────────────────────────────────────────
    handleSkuScopeAll()      { this.skuScope = 'all'; }
    handleSkuScopeSpecific() { this.skuScope = 'specific'; }
    handleSkuInputChange(event) { this.specificSku = event.detail.value; }
    get isSpecificSku() { return this.skuScope === 'specific'; }

    // ── Handlers: Rule type ───────────────────────────────────────────
    handleRuleTypePercentage() {
        this.ruleType = 'percentage';
        this.groupRows = this.groupRows.map(r => ({ ...r, value: '' }));
    }
    handleRuleTypeMaxQty() {
        this.ruleType = 'maxQty';
        this.groupRows = this.groupRows.map(r => ({ ...r, value: '' }));
    }

    // ── Handlers: Group rows ──────────────────────────────────────────
    handleGroupChange(event) {
        const rowId = event.currentTarget.dataset.rowid;
        const val   = event.detail.value;
        this.groupRows = this.groupRows.map(r => r.id === rowId ? { ...r, groupId: val } : r);
    }

    handleGroupValueChange(event) {
        const rowId = event.currentTarget.dataset.rowid;
        const val   = event.detail.value;
        this.groupRows = this.groupRows.map(r => r.id === rowId ? { ...r, value: val } : r);
    }

    handleGroupPriorityChange(event) {
        const rowId = event.currentTarget.dataset.rowid;
        const val   = parseInt(event.detail.value, 10);
        this.groupRows = this.groupRows.map(r => r.id === rowId ? { ...r, priority: val } : r);
    }

    handleAddGroupRow() {
        if (!this.canAddGroupRow) return;
        const newId = `row-${Date.now()}`;
        this.groupRows = [...this.groupRows, { id: newId, groupId: '', value: '', priority: this.groupRows.length + 1 }];
    }

    handleRemoveGroupRow(event) {
        const rowId = event.currentTarget.dataset.rowid;
        if (!this.canRemoveGroupRow) return;
        this.groupRows = this.groupRows.filter(r => r.id !== rowId);
    }

    // ── Handlers: Modal ───────────────────────────────────────────────
    handleClose() {
        this.dispatchEvent(new CustomEvent('close'));
    }

    handleSave() {
        if (this.isSaveDisabled) return;

        const skuLabel = this.skuScope === 'all'
            ? 'All SKUs'
            : `SKU: ${this.specificSku.trim()}`;

        const validGroupRows = this.groupRows.filter(row => {
            if (!row.groupId || !row.value) return false;
            const val = parseFloat(row.value);
            return !isNaN(val) && val > 0;
        });

        const rules = [];

        if (this.isEdit) {
            // Edit: update the one rule (first group row, first location)
            const row     = validGroupRows[0];
            const locId   = this.selectedLocationIds[0] || '';
            const locOpt  = LOCATIONS.find(l => l.value === locId);
            const grpOpt  = LOCATION_GROUPS.find(g => g.value === row.groupId);
            rules.push({
                id:            this.editRule.id,
                groupId:       row.groupId,
                groupLabel:    grpOpt ? grpOpt.label : row.groupId,
                locationId:    locId,
                locationLabel: locOpt ? locOpt.label : locId,
                skuScope:      this.skuScope,
                skuLabel,
                ruleType:      this.ruleType,
                value:         parseFloat(row.value),
                priority:      row.priority,
                status:        'pending',
                lastRebalanced: null,
            });
        } else {
            // Create: fan out location × group combinations
            const ts = Date.now();
            this.selectedLocationIds.forEach((locId, li) => {
                const locOpt = LOCATIONS.find(l => l.value === locId);
                validGroupRows.forEach((row, gi) => {
                    const grpOpt = LOCATION_GROUPS.find(g => g.value === row.groupId);
                    rules.push({
                        id:            `rule-${ts}-${li}-${gi}`,
                        groupId:       row.groupId,
                        groupLabel:    grpOpt ? grpOpt.label : row.groupId,
                        locationId:    locId,
                        locationLabel: locOpt ? locOpt.label : locId,
                        skuScope:      this.skuScope,
                        skuLabel,
                        ruleType:      this.ruleType,
                        value:         parseFloat(row.value),
                        priority:      row.priority,
                        status:        'pending',
                        lastRebalanced: null,
                    });
                });
            });
        }

        this.dispatchEvent(new CustomEvent('save', { detail: { rules } }));
    }
}
