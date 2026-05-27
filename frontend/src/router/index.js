// Vue Router configuration
import { createRouter, createWebHistory } from 'vue-router'
import store from '../store'

const routes = [
    {
        path: '/',
        redirect: '/login'
    },
    {
        path: '/login',
        name: 'Login',
        component: () => import('../views/Login.vue'),
        meta: { guest: true }
    },
    {
        path: '/register',
        name: 'Register',
        component: () => import('../views/Register.vue'),
        meta: { guest: true }
    },
    {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('../views/Dashboard.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/posts',
        name: 'Posts',
        component: () => import('../views/Posts.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/forum',
        name: 'Forum',
        component: () => import('../views/Forum.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/warnings',
    name: 'Warnings',
    component: () => import('../views/Warnings.vue'),
    meta: { requiresAuth: true }
    },
    {
        path: '/profile',
        name: 'Profile',
        component: () => import('../views/Profile.vue'),
        meta: { requiresAuth: true }
    },
    // Admin routes
    {
        path: '/admin/users',
        name: 'UserManagement',
        component: () => import('../views/admin/UserManagement.vue'),
        meta: { requiresAuth: true, roles: ['super_admin', 'branch_admin'] }
    },
    {
        path: '/admin/branches',
        name: 'BranchManagement',
        component: () => import('../views/admin/BranchManagement.vue'),
        meta: { requiresAuth: true, roles: ['super_admin'] }
    },
    {
        path: '/reports',
        name: 'Reports',
        component: () => import('../views/Reports.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/innovations',
        name: 'Innovations',
        component: () => import('../views/Innovations.vue'),
        meta: { requiresAuth: true }
    },
    {
        path: '/faq',
        name: 'Faq',
        component: () => import('../views/Faq.vue'),
        meta: { requiresAuth: true }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// Navigation guards
router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('token')
    const user = JSON.parse(localStorage.getItem('user') || '{}')

    if (to.meta.requiresAuth && !token) {
        next('/login')
    } else if (to.meta.guest && token) {
        next('/dashboard')
    } else if (to.meta.roles && !to.meta.roles.includes(user.role)) {
        next('/dashboard')
    } else {
        next()
    }
})

export default router