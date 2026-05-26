/**
 * Helpers for rendering LWC components as Storybook stories.
 *
 * Usage:
 *   import { renderFn } from '../../.storybook/renderLwcStory.js';
 *   import Component from 'ui/myComponent';
 *
 *   export default { title: 'UI/My Component' };
 *   export const Default = {
 *     args: { title: 'Hello' },
 *     render: renderFn('ui/myComponent', Component),
 *   };
 */

export function normalizeTagName(componentPath) {
    const normalized = componentPath
        .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
        .replace(/[^a-zA-Z0-9-]+/g, '-')
        .replace(/-{2,}/g, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase();
    return normalized.startsWith('sb-') ? normalized : `sb-${normalized}`;
}

export function defineElement(componentPath, component) {
    const tag = normalizeTagName(componentPath);
    if (!customElements.get(tag)) {
        customElements.define(tag, component.CustomElementConstructor);
    }
    return tag;
}

export function createElement(componentPath, component, args = {}) {
    const tag = defineElement(componentPath, component);
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(args)) {
        if (value !== undefined) {
            try {
                el[key] = value;
            } catch {
                console.warn(`[renderLwcStory] Cannot set "${key}" on <${tag}>:`, value);
            }
        }
    }
    return el;
}

export function renderFn(componentPath, component) {
    return (args) => createElement(componentPath, component, args);
}
