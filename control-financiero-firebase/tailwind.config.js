var config = {
    content: ['./index.html', './src/**/*.{ts,tsx}'],
    theme: {
        extend: {
            colors: {
                surface: '#0b111c',
                accent: '#35d9a5',
                accentSoft: '#1b9c78',
                ink: '#eef3fb',
                muted: '#94a3b8',
                danger: '#fb7185',
            },
            boxShadow: {
                glow: '0 18px 60px rgba(12, 18, 30, 0.55)',
            },
            backgroundImage: {
                noise: 'radial-gradient(circle at top left, rgba(53, 217, 165, 0.16), transparent 28%), radial-gradient(circle at top right, rgba(76, 103, 255, 0.12), transparent 22%), linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0))',
            },
        },
    },
    plugins: [],
};
export default config;
