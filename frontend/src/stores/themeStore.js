// Store para controlar el aspecto del proyecto
import { defineStore } from "pinia";

const btn_lg =
  "w-auto h-auto px-5 py-1 rounded-lg shadow-lg hover:scale-105 transition-all duration-500";

export const useThemeStore = defineStore("theme", {
  state: () => ({
    theme: localStorage.getItem("theme") || "yelow",
    themes: {
      yelow: {
        nav: "bg-amber-300",
        nav_home: "text-amber-800",
        bg: "bg-amber-200",
        card: "bg-green-300 border border-amber-400",
        border: "border-amber-400",
        from: "from-amber-200",
        to: "to-green-300",
        text: "text-gray-800",
        hover: "hover:bg-amber-300",
        accent: "text-orange-500",
        btn: "bg-orange-400 " + btn_lg,
      },
      red: {
        nav: "bg-red-300",
        nav_home: "text-red-900",
        bg: "bg-red-200",
        card: "bg-orange-300",
        border: "border-red-400",
        from: "from-red-200",
        to: "to-orange-300",
        text: "text-gray-800",
        hover: "hover:bg-red-300",
        accent: "text-red-600",
        btn: "bg-red-500 " + btn_lg,
      },
      blue: {
        nav: "bg-blue-500",
        nav_home: "text-blue-700",
        bg: "bg-blue-200",
        card: "bg-blue-400",
        border: "border-emerald-400",
        from: "from-blue-200",
        to: "to-emerald-300",
        text: "text-white",
        hover: "hover:bg-blue-300",
        accent: "text-emerald-500",
        btn: "bg-blue-500 " + btn_lg,
      },
      purple: {
        nav: "bg-purple-500",
        nav_home: "text-purple-700",
        bg: "bg-purple-200",
        card: "bg-purple-400",
        btn: "bg-purple-500 " + btn_lg,
      },
      //* Colores y forma para el bocadillo de los chats (futuro)
      chatBubble: {
        me: "ml-auto bg-green-500 rounded-br-none",
        other: "mr-auto bg-blue-500 rounded-bl-none",
      },
    },
  }),
  getters: {
    current: (state) => state.themes[state.theme],
  },
  actions: {
    setTheme(key) {
      this.theme = key;
      localStorage.setItem("theme", key); // así se guarda al recargar
    },
  },
});
