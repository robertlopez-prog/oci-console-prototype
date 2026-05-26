export default {
    stories: [
        '../src/**/*.stories.@(js|mjs|ts|mdx)',
    ],
    addons: [
        '@storybook/addon-docs',
        '@storybook/addon-a11y',
    ],
    framework: {
        name: '@storybook/html-vite',
        options: {},
    },
    docs: {
        autodocs: 'tag',
    },
    staticDirs: [
        '../public',
        { from: '../assets', to: '/assets' },
        { from: '../node_modules/@salesforce-ux/icons/dist', to: '/node_modules/@salesforce-ux/icons/dist' },
    ],

    async viteFinal(config) {
        const { mergeConfig } = await import('vite');
        const { default: path } = await import('path');
        const ROOT = path.resolve(decodeURIComponent(new URL('..', import.meta.url).pathname));

        return mergeConfig(config, {
            server: {
                fs: {
                    allow: [ROOT],
                },
            },
            esbuild: {
                tsconfigRaw: {
                    compilerOptions: {
                        target: 'ESNext',
                        module: 'ESNext',
                        moduleResolution: 'node',
                        strict: false,
                        skipLibCheck: true,
                        resolveJsonModule: true,
                        isolatedModules: true,
                        noEmit: true,
                    },
                },
            },
            optimizeDeps: {
                include: ['@lwc/synthetic-shadow'],
                exclude: ['lightning-base-components'],
                esbuildOptions: {
                    plugins: [{
                        name: 'lwc-virtual-modules-external',
                        setup(build) {
                            build.onResolve(
                                { filter: /^(lightning\/|@salesforce\/|utilities\/)/ },
                                (args) => ({ path: args.path, external: true })
                            );
                        },
                    }],
                },
            },
        });
    },
};
