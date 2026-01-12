/** @type {import('tailwindcss').Config} */
module.exports = {
    // NOTE: Configure the paths to all of your "files"
    content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {},
    },
    plugins: [],
}
