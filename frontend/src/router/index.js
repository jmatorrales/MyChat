import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/authStore";

const routes = [
  // --- ZONA PÚBLICA (layout con NavPublic) ---
  {
    path: "/",
    component: () => import("../views/basic/Home.vue"), // layout público
    children: [
      {
        path: "",
        name: "index",
        component: () => import("../views/basic/Index.vue"),
      },
      {
        path: "login",
        name: "login",
        component: () => import("../views/basic/Login.vue"),
      },
      {
        path: "register",
        name: "register",
        component: () => import("../views/basic/Register.vue"),
      },
    ],
  },

  // --- ZONA USER ---
  {
    path: "/app",
    component: () => import("../views/complete/users/UserLogedLayout.vue"),
    meta: { requiresAuth: true, role: "user" },
    children: [
      {
        path: "",
        name: "salas",
        component: () => import("../views/complete/users/Salas.vue"),
      },
    ],
  },

  // --- ZONA ADMIN ---
  {
    path: "/admin",
    component: () => import("../views/complete/admin/AdminLayout.vue"),
    meta: { requiresAuth: true, role: "admin" },
    children: [
      {
        path: "",
        name: "admin-panel",
        component: () => import("../views/complete/admin/AdminPanel.vue"),
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.usuario) {
    return "/login";
  }

  if (to.meta.role && authStore.usuario?.role !== to.meta.role) {
    return "/";
  }
});

export default router;
