import { LightningElement, api } from 'lwc';
import { LOCATION_ON_HAND } from 'data/segmentationRules';

/**
 * Allocation Preview — shows how existing rules + draft rules
 * carve up on-hand inventory at a given location.
 *
 * @api locationId      — selected location (first if multiple)
 * @api existingRules   — saved rules for this location
 * @api draftRules      — array of rules being built (not yet saved)
 */
export default class AllocationPreview extends LightningElement {
    @api locationId = '';
    @api existingRules = [];
    @api draftRules = [];   // replaces single draftRule

    get onHand() {
        return LOCATION_ON_HAND[this.locationId] || 0;
    }

    get allRules() {
        const existing = [...(this.existingRules || [])];
        const drafts   = (this.draftRules || [])
            .filter(d => d && d.groupLabel && d.value > 0)
            .map(d => ({ ...d, isDraft: true }));
        return [...existing, ...drafts];
    }

    get rows() {
        const oh = this.onHand;
        let totalAllocated = 0;
        const rows = this.allRules.map((rule) => {
            let units = 0;
            let displayValue = '';
            if (rule.ruleType === 'percentage') {
                units = Math.round(oh * (rule.value / 100));
                displayValue = `${rule.value}%`;
            } else {
                units = Math.min(rule.value, oh);
                displayValue = `Max ${rule.value.toLocaleString()} units`;
            }
            totalAllocated += units;
            const pct = oh > 0 ? Math.min(100, Math.round((units / oh) * 100)) : 0;
            return {
                id: rule.id || `r-${rule.groupId}`,
                groupLabel: rule.groupLabel || '—',
                displayValue,
                units,
                pct,
                isDraft: !!rule.isDraft,
                rowClass: `alloc-preview__row${rule.isDraft ? ' alloc-preview__row--draft' : ''}`,
                barStyle: `width: ${pct}%`,
            };
        });

        // Unallocated remainder
        const unallocated    = Math.max(0, oh - totalAllocated);
        const unallocatedPct = oh > 0 ? Math.round((unallocated / oh) * 100) : 100;
        rows.push({
            id: 'unallocated',
            groupLabel: 'Unallocated (location pool)',
            displayValue: `${unallocatedPct}%`,
            units: unallocated,
            pct: unallocatedPct,
            isDraft: false,
            rowClass: 'alloc-preview__row alloc-preview__row--unallocated',
            barStyle: `width: ${unallocatedPct}%`,
        });

        return rows;
    }

    get totalAllocatedPct() {
        return this.rows
            .filter(r => r.id !== 'unallocated')
            .reduce((sum, r) => sum + r.pct, 0);
    }

    get isOverAllocated() { return this.totalAllocatedPct > 100; }
    get hasLocation()     { return !!this.locationId; }
    get formattedOnHand() { return this.onHand.toLocaleString(); }
}
