/**
 * Canned data for Dynamic Segmentation Rules prototype.
 * Reflects the OCI group-centric model: rules target groups,
 * locations are the common pool with 100% access by default.
 */

export const LOCATION_GROUPS = [
    { value: 'b2c-storefront',   label: 'B2C Storefront' },
    { value: 'vip-channel',      label: 'VIP Channel' },
    { value: 'b2b-wholesale',    label: 'B2B Wholesale' },
    { value: 'marketplace',      label: 'Marketplace' },
    { value: 'bopis',            label: 'BOPIS' },
];

export const LOCATIONS = [
    { value: 'all',              label: 'All Locations' },
    { value: 'wh-chicago',       label: 'Chicago Warehouse (WH-001)' },
    { value: 'wh-reno',          label: 'Reno NV Warehouse (WH-002)' },
    { value: 'store-michigan',   label: 'Chicago Michigan (Store)' },
    { value: 'store-uptown',     label: 'Uptown Chicago (Store)' },
    { value: 'store-sfo',        label: 'Marina SFO Warehouse' },
];

// Represents on-hand totals per location for the live preview calculation
export const LOCATION_ON_HAND = {
    'all':             124000,
    'wh-chicago':       87500,
    'wh-reno':          36500,
    'store-michigan':    4200,
    'store-uptown':      2100,
    'store-sfo':         1800,
};

export const SEGMENTATION_RULES = [
    {
        id: 'rule-001',
        groupId: 'b2c-storefront',
        groupLabel: 'B2C Storefront',
        locationId: 'wh-chicago',
        locationLabel: 'Chicago Warehouse (WH-001)',
        skuScope: 'all',
        skuLabel: 'All SKUs',
        ruleType: 'percentage',
        value: 50,
        priority: 1,
        status: 'active',
        lastRebalanced: 'Jun 9, 2026, 2:34 PM',
    },
    {
        id: 'rule-002',
        groupId: 'b2c-storefront',
        groupLabel: 'B2C Storefront',
        locationId: 'wh-chicago',
        locationLabel: 'Chicago Warehouse (WH-001)',
        skuScope: 'specific',
        skuLabel: 'SKU: RED-SHIRT-XL',
        ruleType: 'maxQty',
        value: 200,
        priority: 2,
        status: 'active',
        lastRebalanced: 'Jun 9, 2026, 2:34 PM',
    },
    {
        id: 'rule-003',
        groupId: 'vip-channel',
        groupLabel: 'VIP Channel',
        locationId: 'wh-chicago',
        locationLabel: 'Chicago Warehouse (WH-001)',
        skuScope: 'all',
        skuLabel: 'All SKUs',
        ruleType: 'percentage',
        value: 15,
        priority: 1,
        status: 'active',
        lastRebalanced: 'Jun 9, 2026, 2:34 PM',
    },
    {
        id: 'rule-004',
        groupId: 'b2b-wholesale',
        groupLabel: 'B2B Wholesale',
        locationId: 'all',
        locationLabel: 'All Locations',
        skuScope: 'all',
        skuLabel: 'All SKUs',
        ruleType: 'percentage',
        value: 30,
        priority: 1,
        status: 'pending',
        lastRebalanced: null,
    },
    {
        id: 'rule-005',
        groupId: 'marketplace',
        groupLabel: 'Marketplace',
        locationId: 'wh-reno',
        locationLabel: 'Reno NV Warehouse (WH-002)',
        skuScope: 'all',
        skuLabel: 'All SKUs',
        ruleType: 'maxQty',
        value: 5000,
        priority: 1,
        status: 'active',
        lastRebalanced: 'Jun 8, 2026, 9:00 AM',
    },
    {
        id: 'rule-006',
        groupId: 'vip-channel',
        groupLabel: 'VIP Channel',
        locationId: 'wh-reno',
        locationLabel: 'Reno NV Warehouse (WH-002)',
        skuScope: 'specific',
        skuLabel: 'SKU: LUXURY-BAG-001',
        ruleType: 'maxQty',
        value: 50,
        priority: 1,
        status: 'active',
        lastRebalanced: 'Jun 8, 2026, 9:00 AM',
    },
];
