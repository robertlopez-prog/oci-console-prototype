// Synthetic shadow MUST be imported before any LWC component imports.
import '@lwc/synthetic-shadow';

// Preload icon SVG template bundles so lightning-icon / lightning-button-icon
// work reliably on first render — mirrors what bootstrap.js does in the app.
Promise.all([
    import('lightning/iconSvgTemplatesUtility'),
    import('lightning/iconSvgTemplatesStandard'),
    import('lightning/iconSvgTemplatesDoctype'),
    import('lightning/iconSvgTemplatesAction'),
]).catch(() => {});

export default {
    parameters: {
        options: {
            storySort: {
                order: ['SDS', 'Shell', 'UI', 'Page', 'Components', '*'],
            },
        },
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/,
            },
        },
    },
    tags: ['autodocs'],
};
