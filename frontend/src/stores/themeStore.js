// Store para controlar el aspecto de TODA la app: nav, lista lateral, chat, burbujas, inputs y botones.
// Cada tema es un objeto plano de clases Tailwind; los componentes solo leen "themeStore.current.X",
// nunca escriben colores a mano, así que añadir/editar un tema no requiere tocar ningún componente.
import { defineStore } from "pinia";

const btn_lg = "w-auto h-auto px-5 py-1 rounded-lg shadow-lg hover:scale-105 transition-all duration-300";

export const useThemeStore = defineStore("theme", {
  state: () => ({
    // clave del tema activo (coincide con una key de "themes", o "custom")
    theme: localStorage.getItem("theme") || "yellow",

    themes: {
      // ===== AMARILLO =====
      yellow: {
        swatch: "bg-gradient-to-br from-amber-100 from-50% to-amber-600 to-50%", // vista previa en Settings
        navBg: "bg-amber-400", navText: "text-white",          // barra superior (NavUser)
        headerBg: "bg-amber-300", headerText: "text-amber-900", // cabecera del chat + botón emojis (un tono más suave que el nav)
        sidebarBg: "bg-amber-100",                               // fondo de la columna de salas
        sidebarHover: "hover:bg-amber-200",                      // hover al pasar por una sala de la lista
        sidebarActive: "bg-amber-200",                           // sala actualmente seleccionada
        sidebarText: "text-gray-800",                            // texto de la lista de salas
        chatBg: "bg-amber-50",                                   // fondo detrás de los mensajes
        bubbleMe: "bg-orange-400 text-white",                    // burbuja de mis propios mensajes
        bubbleOther: "bg-white text-gray-800",                   // burbuja de mensajes de otros
        inputBg: "bg-white border-amber-300", inputText: "text-gray-800", // campo de texto para escribir
        btn: "bg-orange-400 hover:bg-orange-500 text-white " + btn_lg,    // botón de enviar
      },
      "yellow-dark": {
        swatch: "bg-gradient-to-br from-zinc-900 from-50% to-amber-900 to-50%",
        navBg: "bg-amber-900", navText: "text-amber-100",
        headerBg: "bg-amber-800", headerText: "text-amber-100",
        sidebarBg: "bg-zinc-800",
        sidebarHover: "hover:bg-zinc-700",
        sidebarActive: "bg-zinc-700",
        sidebarText: "text-amber-100",
        chatBg: "bg-zinc-900",
        bubbleMe: "bg-amber-600 text-white",
        bubbleOther: "bg-zinc-700 text-amber-50",
        inputBg: "bg-zinc-800 border-zinc-600", inputText: "text-amber-50",
        btn: "bg-amber-600 hover:bg-amber-500 text-white " + btn_lg,
      },
      // ===== ROJO =====
      red: {
        swatch: "bg-gradient-to-br from-red-100 from-50% to-red-600 to-50%",
        navBg: "bg-red-400", navText: "text-white",
        headerBg: "bg-red-300", headerText: "text-red-900",
        sidebarBg: "bg-red-100",
        sidebarHover: "hover:bg-red-200",
        sidebarActive: "bg-red-200",
        sidebarText: "text-gray-800",
        chatBg: "bg-red-50",
        bubbleMe: "bg-red-500 text-white",
        bubbleOther: "bg-white text-gray-800",
        inputBg: "bg-white border-red-300", inputText: "text-gray-800",
        btn: "bg-red-500 hover:bg-red-600 text-white " + btn_lg,
      },
      "red-dark": {
        swatch: "bg-gradient-to-br from-zinc-900 from-50% to-red-900 to-50%",
        navBg: "bg-red-950", navText: "text-red-100",
        headerBg: "bg-red-900", headerText: "text-red-100",
        sidebarBg: "bg-zinc-800",
        sidebarHover: "hover:bg-zinc-700",
        sidebarActive: "bg-zinc-700",
        sidebarText: "text-red-100",
        chatBg: "bg-zinc-900",
        bubbleMe: "bg-red-700 text-white",
        bubbleOther: "bg-zinc-700 text-red-50",
        inputBg: "bg-zinc-800 border-zinc-600", inputText: "text-red-50",
        btn: "bg-red-700 hover:bg-red-600 text-white " + btn_lg,
      },
      // ===== AZUL =====
      blue: {
        swatch: "bg-gradient-to-br from-blue-100 from-50% to-blue-600 to-50%",
        navBg: "bg-blue-500", navText: "text-white",
        headerBg: "bg-blue-400", headerText: "text-white",
        sidebarBg: "bg-blue-100",
        sidebarHover: "hover:bg-blue-200",
        sidebarActive: "bg-blue-200",
        sidebarText: "text-gray-800",
        chatBg: "bg-blue-50",
        bubbleMe: "bg-blue-500 text-white",
        bubbleOther: "bg-white text-gray-800",
        inputBg: "bg-white border-blue-300", inputText: "text-gray-800",
        btn: "bg-blue-500 hover:bg-blue-600 text-white " + btn_lg,
      },
      "blue-dark": {
        swatch: "bg-gradient-to-br from-zinc-900 from-50% to-blue-900 to-50%",
        navBg: "bg-blue-950", navText: "text-blue-100",
        headerBg: "bg-blue-900", headerText: "text-blue-100",
        sidebarBg: "bg-zinc-800",
        sidebarHover: "hover:bg-zinc-700",
        sidebarActive: "bg-zinc-700",
        sidebarText: "text-blue-100",
        chatBg: "bg-zinc-900",
        bubbleMe: "bg-blue-700 text-white",
        bubbleOther: "bg-zinc-700 text-blue-50",
        inputBg: "bg-zinc-800 border-zinc-600", inputText: "text-blue-50",
        btn: "bg-blue-700 hover:bg-blue-600 text-white " + btn_lg,
      },
      // ===== MORADO =====
      purple: {
        swatch: "bg-gradient-to-br from-purple-100 from-50% to-purple-600 to-50%",
        navBg: "bg-purple-500", navText: "text-white",
        headerBg: "bg-purple-400", headerText: "text-white",
        sidebarBg: "bg-purple-100",
        sidebarHover: "hover:bg-purple-200",
        sidebarActive: "bg-purple-200",
        sidebarText: "text-gray-800",
        chatBg: "bg-purple-50",
        bubbleMe: "bg-purple-500 text-white",
        bubbleOther: "bg-white text-gray-800",
        inputBg: "bg-white border-purple-300", inputText: "text-gray-800",
        btn: "bg-purple-500 hover:bg-purple-600 text-white " + btn_lg,
      },
      "purple-dark": {
        swatch: "bg-gradient-to-br from-zinc-900 from-50% to-purple-900 to-50%",
        navBg: "bg-purple-950", navText: "text-purple-100",
        headerBg: "bg-purple-900", headerText: "text-purple-100",
        sidebarBg: "bg-zinc-800",
        sidebarHover: "hover:bg-zinc-700",
        sidebarActive: "bg-zinc-700",
        sidebarText: "text-purple-100",
        chatBg: "bg-zinc-900",
        bubbleMe: "bg-purple-700 text-white",
        bubbleOther: "bg-zinc-700 text-purple-50",
        inputBg: "bg-zinc-800 border-zinc-600", inputText: "text-purple-50",
        btn: "bg-purple-700 hover:bg-purple-600 text-white " + btn_lg,
      },
    },

    // tema hecho a medida por el usuario (fase siguiente: color picker en Settings).
    // Tiene la MISMA forma que cualquier objeto de "themes", solo que se guarda aparte.
    customTheme: JSON.parse(localStorage.getItem("customTheme")) || null,
  }),

  getters: {
    // objeto de clases del tema activo: si es "custom" usamos lo guardado por el usuario,
    // si no, buscamos la key correspondiente dentro de "themes"
    current: (state) =>
      state.theme === "custom" && state.customTheme
        ? state.customTheme
        : state.themes[state.theme],
  },

  actions: {
    // cambia a un tema fijo (una de las keys de "themes")
    setTheme(key) {
      this.theme = key;
      localStorage.setItem("theme", key);
    },
    // guarda y activa un tema personalizado (objeto de clases elegido por el usuario)
    setCustomTheme(colores) {
      this.customTheme = colores;
      this.theme = "custom";
      localStorage.setItem("customTheme", JSON.stringify(colores));
      localStorage.setItem("theme", "custom");
    },
  },
});