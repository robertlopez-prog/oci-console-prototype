import { renderFn } from '../../../../.storybook/renderLwcStory.js';
import GlobalNavigation from 'shell/globalNavigation';

// Maps workspace labels to their route paths (mirrors routes.config.js workspace entries)
const WORKSPACE_PATHS = {
    'Order Summaries':          '/order-summaries',
    'Order Orchestration Setup': '/rule-management',
};

export default {
    title: 'Shell/Global Navigation',
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: [
                    'Context-bar navigation with workspace object switcher.',
                    'Chevron uses `lightning-icon utility:chevrondown` (x-small, brand blue).',
                    'Active underline is scoped to the label only — not the chevron divider.',
                ].join(' '),
            },
        },
    },
    argTypes: {
        currentPage: {
            control: 'select',
            options: ['order-summaries', 'rule-management'],
            description: 'Active route navPage — determines which workspace tab is highlighted',
        },
    },
};

function render(args) {
    const tag = 'sb-shell-global-navigation';
    if (!customElements.get(tag)) {
        customElements.define(tag, GlobalNavigation.CustomElementConstructor);
    }
    const el = document.createElement(tag);
    el.currentPage = args.currentPage;
    el.workspacePaths = WORKSPACE_PATHS;
    return el;
}

export const Default = {
    name: 'Order Orchestration Setup active',
    args: {
        currentPage: 'rule-management',
    },
    render,
};

export const OrderSummariesActive = {
    name: 'Order Summaries active',
    args: {
        currentPage: 'order-summaries',
    },
    render,
};
