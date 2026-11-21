import type { Config } from "tailwindcss";

const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Brand primitives (fixed)
        navy: { 900: "#0B1E4F", 700: "#1A3170", 50: "#EAF0FB" },
        orange: { 500: "#FF7A00", 600: "#E56A00", 100: "#FFF0E0" },
        amber: { 400: "#FFA940" },
        sky: { 300: "#B9DDF7" },
        success: "#16A34A",
        warning: "#F2B705",
        danger: "#DC2626",
        info: "#2563EB",
        // Semantic (switch with .dark)
        bg: v("bg"),
        surface: v("surface"),
        "surface-2": v("surface-2"),
        line: v("border"),
        fg: v("fg"),
        fg2: v("fg2"),
        muted: v("muted"),
        tint: v("tint"),
        "orange-tint": v("orange-tint"),
        "on-accent": v("on-accent"),
        "btn2": v("btn2"),
        "on-btn2": v("on-btn2"),
      },
      fontFamily: {
        heading: ["Poppins", "Noto Sans Sinhala", "Noto Sans Tamil", "sans-serif"],
        sans: ["Inter", "Noto Sans Sinhala", "Noto Sans Tamil", "system-ui", "sans-serif"],
      },
      fontSize: {
        cap: ["12px", "16px"],
        sm: ["14px", "20px"],
        base: ["16px", "24px"],
        lg: ["20px", "28px"],
        xl: ["24px", "32px"],
        "2xl": ["32px", "40px"],
        total: ["40px", "48px"],
      },
      borderRadius: { card: "12px", ctl: "10px", modal: "20px" },
      boxShadow: {
        soft: "0 4px 16px rgba(11,30,79,0.06)",
        lift: "0 12px 32px rgba(11,30,79,0.12)",
      },
      keyframes: {
        shake: { "0%,100%": { transform: "translateX(0)" }, "20%,60%": { transform: "translateX(-10px)" }, "40%,80%": { transform: "translateX(10px)" } },
        fly: { "0%": { opacity: "1", transform: "translate(0,0) scale(1)" }, "100%": { opacity: "0", transform: "translate(var(--fx),var(--fy)) scale(.6)" } },
        pop: { "0%": { transform: "scale(.6)", opacity: "0" }, "60%": { transform: "scale(1.08)", opacity: "1" }, "100%": { transform: "scale(1)" } },
        draw: { "0%": { strokeDashoffset: "48" }, "100%": { strokeDashoffset: "0" } },
        ripple: { "0%": { transform: "scale(0)", opacity: ".35" }, "100%": { transform: "scale(4)", opacity: "0" } },
        slidein: { "0%": { transform: "translateX(100%)" }, "100%": { transform: "translateX(0)" } },
        rise: { "0%": { transform: "translateY(12px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
      },
      animation: {
        shake: "shake .4s ease-in-out",
        fly: "fly .6s cubic-bezier(.4,0,.2,1) forwards",
        pop: "pop .45s cubic-bezier(.2,.8,.2,1.2) both",
        draw: "draw .5s .25s ease-out forwards",
        ripple: "ripple .55s ease-out forwards",
        slidein: "slidein .25s cubic-bezier(.2,.8,.2,1)",
        rise: "rise .2s ease-out",
      },
    },
  },
  plugins: [],
} satisfies Config;
