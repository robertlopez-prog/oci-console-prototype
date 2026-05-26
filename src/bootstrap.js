import { createElement } from 'lwc';
import App from 'shell/app';
import { initSldsFromStorage } from './build/slds-loader.js';

async function bootstrapApp() {
    await initSldsFromStorage();

    // Inject global stylesheet after SLDS using new URL() to bypass LWC plugin.
    // This allows the CSS to be processed by Vite without LWC's synthetic shadow restrictions.
    const globalCssUrl = new URL('./styles/global.css', import.meta.url).href;
    const globalLink = document.createElement('link');
    globalLink.rel = 'stylesheet';
    globalLink.href = globalCssUrl;
    document.head.appendChild(globalLink);

    // Create and mount the app component
    try {
        const app = createElement('shell-app', {
            is: App
        });
        document.querySelector('#app').appendChild(app);
    } catch (err) {
        console.error('[LWC bootstrap] Failed to mount app:', err);
    } finally {
        document.getElementById('app')?.classList.add('is-ready');
    }

    // Preload icon template modules so they're likely ready when the first icons render.
    Promise.all([
        import('lightning/iconSvgTemplatesUtility'),
        import('lightning/iconSvgTemplatesStandard'),
        import('lightning/iconSvgTemplatesDoctype'),
        import('lightning/iconSvgTemplatesAction'),
    ]).catch(() => {});
}

bootstrapApp().catch((err) => {
    console.error('[LWC bootstrap] Initialization failed:', err);
    document.getElementById('app')?.classList.add('is-ready');
});
