// MUST import synthetic shadow BEFORE any LWC imports.
import '@lwc/synthetic-shadow';

// Load app bootstrap only after synthetic shadow patches runtime globals.
import('./bootstrap.js').catch((err) => {
    console.error('[LWC entry] Failed to load bootstrap:', err);
});
