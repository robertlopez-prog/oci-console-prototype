/**
 * Single source of truth for app routes.
 *
 * Fields:
 *   path       - URL pattern (use :param for dynamic segments)
 *   component  - LWC component name (must be registered in app.js ROUTE_COMPONENTS)
 *   title      - Document title (string or (params) => string)
 *   navPage    - Id used for nav active state (omit to hide from nav)
 *   navLabel   - Label shown in nav bar / waffle
 *   navPath    - Optional override path for nav links (e.g. /users/42)
 *   navHighlight - Nav page id to highlight when this child route is active
 *   workspace  - Workspace item label this route belongs to (for sidebar nav)
 */

export const routes = [
  {
    path: '/',
    component: 'page-home',
    title: 'Home',
  },
  {
    path: '/icons',
    component: 'page-icon-test',
    title: 'Icons',
  },
  {
    path: '/users/:id',
    component: 'page-user',
    title: (params) => `User ${params.id}`,
  },
  {
    path: '/contacts',
    component: 'page-contacts',
    title: 'Contacts',
  },
  {
    path: '/contacts/:id',
    component: 'page-contact-detail',
    title: (params) => `Contact ${params.id}`,
  },
  {
    path: '/order-summaries',
    component: 'page-order-summaries',
    title: 'Order Summaries',
    navPage: 'order-summaries',
    workspace: 'Order Summaries',
  },
  {
    path: '/order-summaries/:id',
    component: 'page-order-summary-detail',
    title: (params) => `Order Summary ${params.id}`,
    navHighlight: 'order-summaries',
  },
  {
    path: '/fulfillment-orders',
    component: 'page-fulfillment-orders',
    title: 'Fulfillment Orders',
    navPage: 'fulfillment-orders',
    workspace: 'Fulfillment Orders',
  },
  {
    path: '/fulfillment-orders/:id',
    component: 'page-fulfillment-order-detail',
    title: (params) => `Fulfillment Order ${params.id}`,
    navHighlight: 'fulfillment-orders',
  },
  {
    path: '/rule-management',
    component: 'page-rule-management',
    title: 'Rule Management',
    navPage: 'rule-management',
    workspace: 'Order Orchestration Setup',
  },
  {
    path: '/rule-management/carrier-management',
    component: 'page-carrier-management',
    title: 'Carrier Management',
    navHighlight: 'rule-management',
    workspace: 'Order Orchestration Setup',
  },
  {
    path: '/rule-management/delivery-estimations',
    component: 'page-delivery-estimations',
    title: 'Delivery Estimations',
    navHighlight: 'rule-management',
    workspace: 'Order Orchestration Setup',
  },
  {
    path: '/om-analytics',
    component: 'page-analytics',
    title: 'OM Analytics',
    navPage: 'om-analytics',
    workspace: 'OM Analytics',
  },
  {
    path: '/omnichannel-inventory',
    component: 'page-omnichannel-inventory',
    title: 'Omnichannel Inventory',
    navPage: 'omnichannel-inventory',
    workspace: 'Home',
  },
  {
    path: '/deletion-history',
    component: 'page-deletion-history',
    title: 'Deletion History',
  },
  {
    path: '/omnichannel-overview',
    component: 'page-omnichannel-overview',
    title: 'Omnichannel Overview',
    navPage: 'omnichannel-overview',
    workspace: 'Omnichannel Overview',
  },
];
