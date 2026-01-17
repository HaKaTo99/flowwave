/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                flow: {
                    primary: '#1A73E8',
                    secondary: '#00BCD4',
                    accent: '#4CAF50',
                    dark: '#2D3748',
                    light: '#F5F7FA'
                }
            }
        },
    },
    plugins: [],
}
