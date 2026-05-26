import { renderFn } from '../../../../.storybook/renderLwcStory.js';
import GlobalHeader from 'shell/globalHeader';

export default {
    title: 'Shell/Global Header',
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component: [
                    'Full-width global header bar.',
                    'Logo mark: 2.5rem (40px). Action icons: `size="medium"` (32px container).',
                    'No border-bottom — the nav bar below owns the single hairline separator.',
                ].join(' '),
            },
        },
    },
};

export const Default = {
    name: 'Default',
    render: renderFn('shell/globalHeader', GlobalHeader),
};
