import { renderFn } from '../../../../.storybook/renderLwcStory.js';
import Home from 'page/home';

export default {
    title: 'Page/Home',
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
    },
};

export const Default = {
    render: renderFn('page/home', Home),
};
