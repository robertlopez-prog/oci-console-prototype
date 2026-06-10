import { LightningElement, track } from 'lwc';

// ── Static tenant data ────────────────────────────────────────────────────────
const LOCATION_GROUPS_TABLE = [
    { id: 1, name: 'All Fulfillment Network', locations: 698, memberships: 698 },
    { id: 2, name: 'BOPIS Eligible',          locations: 423, memberships: 423 },
    { id: 3, name: 'Ship from Store',         locations: 287, memberships: 287 },
    { id: 4, name: 'East Coast Stores',       locations: 178, memberships: 178 },
    { id: 5, name: 'West Coast Stores',       locations: 145, memberships: 145 },
    { id: 6, name: 'Premium Delivery',        locations: 89,  memberships: 89  },
];

const LOCATION_BREAKDOWN_RAW = [
    { id: 1, type: 'Stores',               count: 423, pct: 60 },
    { id: 2, type: 'Warehouses',           count: 187, pct: 27 },
    { id: 3, type: 'Distribution Centers', count: 78,  pct: 11 },
    { id: 4, type: 'Virtual / Other',      count: 13,  pct: 2  },
];

const LEGEND_DOT_COLORS = ['#0d9dda', '#0176d3', '#9050e9', '#b0adab'];

const HIGH_MEMBERSHIP_RAW = [
    { id: 1, name: 'NYC Flagship Store',     type: 'Store',     memberships: 38, records: 24_120, budgetPct: '0.38%' },
    { id: 2, name: 'LA Distribution Center', type: 'DC',        memberships: 32, records: 28_450, budgetPct: '0.32%' },
    { id: 3, name: 'Chicago Main Warehouse', type: 'Warehouse', memberships: 29, records: 28_320, budgetPct: '0.29%' },
    { id: 4, name: 'Dallas Fulfillment Hub', type: 'DC',        memberships: 24, records: 27_890, budgetPct: '0.24%' },
    { id: 5, name: 'Boston Store - Downtown',type: 'Store',     memberships: 22, records: 12_340, budgetPct: '0.22%' },
    { id: 6, name: 'Seattle Warehouse',      type: 'Warehouse', memberships: 18, records: 31_200, budgetPct: '0.18%' },
];

const TYPE_BADGE_CLASS = {
    Store:     'ov-type-badge ov-type-badge--store',
    Warehouse: 'ov-type-badge ov-type-badge--warehouse',
    DC:        'ov-type-badge ov-type-badge--dc',
};

// ─────────────────────────────────────────────────────────────────────────────
export default class OmnichannelOverview extends LightningElement {

    @track syncingRecords = false;
    @track syncingSkus    = false;
    @track recordsValue   = '14.2M';
    @track skusValue      = '28,450';
    @track recordsTs      = 'Updated today at 2:47 PM';
    @track skusTs         = 'Updated today at 2:47 PM';

    // ── Network metrics (3-col cards) ─────────────────────────────────────────
    get networkMetrics() {
        const rows = [
            { key: 'locations',   value: 701,    limit: 7_000,   valueFmt: '701',   limitFmt: '7,000',   colorClass: 'ov-card__icon ov-card__icon--blue',  label: 'Total Locations',   desc: 'Stores, warehouses, and distribution centers in your fulfillment network' },
            { key: 'groups',      value: 47,     limit: 100,     valueFmt: '47',    limitFmt: '100',      colorClass: 'ov-card__icon ov-card__icon--teal',  label: 'Location Groups',   desc: 'Active groups for inventory exposure and fulfillment routing' },
            { key: 'memberships', value: 3_847,  limit: 10_000,  valueFmt: '3,847', limitFmt: '10,000',   colorClass: 'ov-card__icon ov-card__icon--green', label: 'Group Membership',  desc: 'Location-to-group assignments (each assignment = 1 membership point)' },
        ];
        return rows.map(r => {
            const pct = Math.round((r.value / r.limit) * 100);
            const barColor = pct > 80 ? '#ea001e' : pct > 60 ? '#fe9339' : '#0176d3';
            return {
                ...r,
                pct,
                pctTitle: `${pct}% of limit used`,
                barStyle: `width:${pct}%; background:${barColor};`,
            };
        });
    }

    // ── Location breakdown ────────────────────────────────────────────────────
    get locationBreakdown() {
        return LOCATION_BREAKDOWN_RAW.map((lt, i) => ({
            ...lt,
            legendDotClass: 'ov-legend-dot',
            legendDotStyle: `background:${LEGEND_DOT_COLORS[i]};`,
        }));
    }

    // Donut chart via inline conic-gradient style
    get donutGradientStyle() {
        return 'background: conic-gradient(#0d9dda 0% 60%, #0176d3 60% 87%, #9050e9 87% 98%, #b0adab 98% 100%);';
    }

    // ── Location groups table ─────────────────────────────────────────────────
    get locationGroups() {
        return LOCATION_GROUPS_TABLE;
    }

    // ── High membership locations ─────────────────────────────────────────────
    get highMembershipLocations() {
        return HIGH_MEMBERSHIP_RAW.map(loc => ({
            ...loc,
            typeBadgeClass: TYPE_BADGE_CLASS[loc.type] || 'ov-type-badge',
            recordsFmt: loc.records.toLocaleString(),
        }));
    }

    // ── Sync handlers ─────────────────────────────────────────────────────────
    handleSyncRecords() {
        if (this.syncingRecords) return;
        this.syncingRecords = true;
        setTimeout(() => {
            this.recordsValue   = '14.3M';
            this.recordsTs      = `Updated today at ${this._nowTime()}`;
            this.syncingRecords = false;
        }, 2000);
    }

    handleSyncSkus() {
        if (this.syncingSkus) return;
        this.syncingSkus = true;
        setTimeout(() => {
            this.skusValue  = '28,512';
            this.skusTs     = `Updated today at ${this._nowTime()}`;
            this.syncingSkus = false;
        }, 2000);
    }

    get syncRecordsLabel() { return this.syncingRecords ? 'Syncing…' : 'Sync'; }
    get syncSkusLabel()    { return this.syncingSkus    ? 'Syncing…' : 'Sync'; }
    get syncRecordsClass() { return `ov-sync-btn${this.syncingRecords ? ' ov-sync-btn--spinning' : ''}`; }
    get syncSkusClass()    { return `ov-sync-btn${this.syncingSkus    ? ' ov-sync-btn--spinning' : ''}`; }

    // ── Private helpers ───────────────────────────────────────────────────────
    _nowTime() {
        const now = new Date();
        return now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
}
