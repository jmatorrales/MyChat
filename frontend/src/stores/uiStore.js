// Store para controlar si los ajustes estan activos o no
import { defineStore } from "pinia";

export const useUiStore = defineStore("ui", {
    state: () => ({
        showSettings: false,
    }),
    actions: {
        toggleSettings() {
            this.showSettings = !this.showSettings;
        },
    },
});