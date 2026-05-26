import { renderFn } from '../../../../.storybook/renderLwcStory.js';
import GlobalShell from 'shell/globalShell';

const WORKSPACE_PATHS = {
    'Order Summaries':            '/order-summaries',
    'Order Orchestration Setup':  '/rule-management',
};

export default {
    title: 'Shell/Global Shell',
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
    },
    argTypes: {
        currentPage: {
            control: 'select',
            options: ['order-summaries', 'rule-management'],
            description: 'Active route — determines which workspace tab is highlighted in the nav',
        },
    },
};

function render(args) {
    const el = renderFn('shell/globalShell', GlobalShell)(args);
    el.workspacePaths = WORKSPACE_PATHS;
    return el;
}

export const OrderOrchestrationSetup = {
    name: 'Order Orchestration Setup active',
    args: { currentPage: 'rule-management' },
    render,
};

export const OrderSummaries = {
    name: 'Order Summaries active',
    args: { currentPage: 'order-summaries' },
    render,
};
