/**
 * Mini router for LWC – declarative routes, dynamic params, History API.
 * No page refresh; back/forward supported.
 * Routes are defined in routes.config.js.
 *
 * Production `vite build` uses pathname + pushState. `vite build --mode gh-pages`
 * (npm run build:gh-pages) uses hash URLs (#/path) for static hosts like GitHub Pages.
 */

import { routes } from './routes.config.js';

const DEFAULT_TITLE = 'Salesforce';

const HASH_MODE = import.meta.env.VITE_ROUTER_MODE === 'hash';

const listeners = new Set();

function normalizeLogicalPath(path) {
  let normalized =
    !path || path === '/' ? '/' : path.startsWith('/') ? path : `/${path}`;
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
}

/** Logical path for route matching (always starts with /, no trailing slash except root). */
function getLogicalPath() {
  if (!HASH_MODE) {
    return normalizeLogicalPath(window.location.pathname);
  }
  const locationHash = window.location.hash;
  if (!locationHash || locationHash === '#' || locationHash === '#/') {
    return '/';
  }
  if (locationHash.startsWith('#/')) {
    const afterHashSlash = locationHash.slice(2);
    const fragmentBeforeQuery = afterHashSlash.split('?')[0];
    const rawLogical = fragmentBeforeQuery ? `/${fragmentBeforeQuery}` : '/';
    return normalizeLogicalPath(rawLogical);
  }
  return '/';
}

function hashUrlFromLogicalPath(logicalPath) {
  const fragmentBody = logicalPath === '/' ? '' : logicalPath.slice(1);
  return `#/${fragmentBody}`;
}

/**
 * `href` for anchors (nav, copy link). Logical paths stay in routes.config.js.
 * @param {string} logicalPath e.g. `/settings`
 */
export function linkHref(logicalPath) {
  const path = normalizeLogicalPath(logicalPath);
  if (!HASH_MODE) {
    return path;
  }
  return hashUrlFromLogicalPath(path);
}

function matchRoute(path) {
  for (const route of routes) {
    const keys = [];
    const pattern = route.path.replace(/:([^/]+)/g, (_match, paramName) => {
      keys.push(paramName);
      return '([^/]+)';
    });

    const regex = new RegExp(`^${pattern}$`);
    const match = path.match(regex);

    if (match) {
      const params = {};
      keys.forEach((paramKey, i) => (params[paramKey] = match[i + 1]));

      return { ...route, params };
    }
  }

  return null;
}

function getTitleForRoute(route) {
  if (!route?.title) return DEFAULT_TITLE;
  return typeof route.title === 'function'
    ? route.title(route.params || {})
    : route.title;
}

function notify() {
  const route = matchRoute(getLogicalPath());
  document.title = getTitleForRoute(route);
  listeners.forEach((listener) => listener(route));
}

export function navigate(path) {
  const logical = normalizeLogicalPath(path);
  if (logical === getLogicalPath()) {
    return;
  }
  if (!HASH_MODE) {
    history.pushState({}, '', logical);
  } else {
    history.pushState({}, '', hashUrlFromLogicalPath(logical));
  }
  notify();
}

export function getCurrentRoute() {
  return matchRoute(getLogicalPath());
}

export function subscribe(callback) {
  listeners.add(callback);
  const route = matchRoute(getLogicalPath());
  document.title = getTitleForRoute(route);
  callback(route);

  return () => listeners.delete(callback);
}

window.addEventListener('popstate', notify);
if (HASH_MODE) {
  window.addEventListener('hashchange', notify);
}
