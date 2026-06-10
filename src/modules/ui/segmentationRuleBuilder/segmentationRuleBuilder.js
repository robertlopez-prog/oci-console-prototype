import { LightningElement, api, track } from 'lwc';
import { LOCATION_GROUPS, LOCATIONS, SEGMENTATION_RULES } from 'data/segmentationRules';

const RULE_LIMIT = 500;

export default class SegmentationRuleBuilder extends LightningElement {
    /** If provided, the builder is in edit mode for an existing rule */
    @api editRule = null;
    @api totalRuleCount = 0;

    @track locationId = '';
    @track skuScope = 'all';
    @track specificSku = '';
    @track ruleType = 'percentage';
    @track ruleValue = '';
    @track groupId = '';
    @track priority = 1;

    connectedCallback() {
        if (this.editRule) {
            this.locationId  = this.editRule.locationId  || '';
            this.skuScope    = this.editRule.skuScope    || 'all';
            this.specificSku = this.editRule.skuScope === 'specific' ? (this.editRule.skuLabel || '') : '';
            this.ruleType    = this.editRule.ruleType    || 'percentage';
            this.ruleValue   = String(this.editRule.value || '');
            this.groupId     = this.editRule.groupId     || '';
            this.priority    = this.editRule.priority    || 1;
        }
    }

    // ── Options ──────────────────────────────────────────────────────
    get locationOptions() { return LOCATIONS; }
    get groupOptions()    { return LOCATION_GROUPS; }

    get priorityOptions() {
        return [1,2,3,4,5,6,7,8,9,10].map(n => ({ label: String(n), value: String(n) }));
    }

    // ── Computed state ────────────────────────────────────────────────
    get isEdit()           { return !!this.editRule; }
    get isSpecificSku()    { return this.skuScope === 'specific'; }
    get isPercentage()     { return this.ruleType === 'percentage'; }
    get isMaxQty()         { return this.ruleType === 'maxQty'; }
    get modalTitle()       { return this.isEdit ? 'Edit Segmentation Rule' : 'Create Segmentation Rule'; }
    get saveLabel()        { return this.isEdit ? 'Save Changes' : 'Save Rule'; }

    get valueLabel() {
        return this.isPercentage
            ? 'Percentage of On-Hand (%)'
            : 'Maximum Units (fixed cap)';
    }

    get valuePlaceholder() {
        return this.isPercentage ? '0–100' : 'e.g. 500';
    }

    get selectedLocationLabel() {
        const opt = LOCATIONS.find(l => l.value === this.locationId);
        return opt ? opt.label : '';
    }

    get selectedGroupLabel() {
        const opt = LOCATION_GROUPS.find(g => g.value === this.groupId);
        return opt ? opt.label : '';
    }

    // Rules already saved for the selected location (for the preview)
    get existingRulesForLocation() {
        if (!this.locationId) return [];
        const rules = SEGMENTATION_RULES.filter(r => {
            const locMatch = r.locationId === this.locationId || r.locationId === 'all' || this.locationId === 'all';
            const notSelf  = !this.editRule || r.id !== this.editRule.id;
            return locMatch && notSelf;
        });
        return rules;
    }

    // Draft rule object passed to the preview component
    get draftRule() {
        const val = parseFloat(this.ruleValue);
        if (!this.groupId || isNaN(val) || val <= 0) return null;
        return {
            groupId:    this.groupId,
            groupLabel: this.selectedGroupLabel,
            ruleType:   this.ruleType,
            value:      val,
        };
    }

    // Validation
    get hasValidationError() {
        const val = parseFloat(this.ruleValue);
        if (!this.locationId || !this.groupId) return false;
        if (this.isPercentage && (val < 1 || val > 100)) return true;
        if (this.isMaxQty && val < 1) return true;
        return false;
    }

    get validationMessage() {
        if (!this.hasValidationError) return '';
        const val = parseFloat(this.ruleValue);
        if (this.isPercentage && (val < 1 || val > 100)) return 'Percentage must be between 1 and 100.';
        if (this.isMaxQty && val < 1) return 'Maximum quantity must be at least 1.';
        return '';
    }

    get percentageTabClass() {
        return `rb-type-btn${this.isPercentage ? ' rb-type-btn--active' : ''}`;
    }

    get maxQtyTabClass() {
        return `rb-type-btn${this.isMaxQty ? ' rb-type-btn--active' : ''}`;
    }

    get priorityString() {
        return String(this.priority);
    }

    get isSaveDisabled() {
        if (!this.locationId || !this.groupId || !this.ruleValue) return true;
        if (this.hasValidationError) return true;
        if (this.isSpecificSku && !this.specificSku.trim()) return true;
        return false;
    }

    get atRuleLimit() {
        return this.totalRuleCount >= RULE_LIMIT;
    }

    // ── Handlers ──────────────────────────────────────────────────────
    handleLocationChange(event) {
        this.locationId = event.detail.value;
    }

    handleSkuScopeAll() {
        this.skuScope = 'all';
    }

    handleSkuScopeSpecific() {
        this.skuScope = 'specific';
    }

    handleSkuInputChange(event) {
        this.specificSku = event.detail.value;
    }

    handleRuleTypePercentage() {
        this.ruleType = 'percentage';
        this.ruleValue = '';
    }

    handleRuleTypeMaxQty() {
        this.ruleType = 'maxQty';
        this.ruleValue = '';
    }

    handleValueChange(event) {
        this.ruleValue = event.detail.value;
    }

    handleGroupChange(event) {
        this.groupId = event.detail.value;
    }

    handlePriorityChange(event) {
        this.priority = parseInt(event.detail.value, 10);
    }

    handleClose() {
        this.dispatchEvent(new CustomEvent('close'));
    }

    handleSave() {
        if (this.isSaveDisabled) return;

        const skuLabel = this.skuScope === 'all'
            ? 'All SKUs'
            : `SKU: ${this.specificSku.trim()}`;

        const rule = {
            id:            this.editRule ? this.editRule.id : `rule-${Date.now()}`,
            groupId:       this.groupId,
            groupLabel:    this.selectedGroupLabel,
            locationId:    this.locationId,
            locationLabel: this.selectedLocationLabel,
            skuScope:      this.skuScope,
            skuLabel,
            ruleType:      this.ruleType,
            value:         parseFloat(this.ruleValue),
            priority:      this.priority,
            status:        'pending',
            lastRebalanced: null,
        };

        this.dispatchEvent(new CustomEvent('save', { detail: { rule } }));
    }
}
