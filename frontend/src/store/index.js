import { createStore } from 'vuex'

const store = createStore({
    state() {
        return {
            user: JSON.parse(localStorage.getItem('user') || 'null'),
            token: localStorage.getItem('token') || null,
            isAuthenticated: !!localStorage.getItem('token'),
            notifications: [],
            unreadNotifications: 0
        }
    },

    mutations: {
        SET_USER(state, user) {
            state.user = user
            state.isAuthenticated = true
            localStorage.setItem('user', JSON.stringify(user))
        },

        SET_TOKEN(state, token) {
            state.token = token
            state.isAuthenticated = true
            localStorage.setItem('token', token)
        },

        CLEAR_AUTH(state) {
            state.user = null
            state.token = null
            state.isAuthenticated = false
            state.notifications = []
            state.unreadNotifications = 0
            localStorage.removeItem('user')
            localStorage.removeItem('token')
        },

        SET_NOTIFICATIONS(state, notifications) {
            state.notifications = notifications
            state.unreadNotifications = notifications.filter(n => !n.is_read).length
        },

        ADD_NOTIFICATION(state, notification) {
            state.notifications.unshift(notification)
            state.unreadNotifications++
        },

        MARK_NOTIFICATION_READ(state, notificationId) {
            const notification = state.notifications.find(n => n.id === notificationId)
            if (notification && !notification.is_read) {
                notification.is_read = true
                state.unreadNotifications--
            }
        }
    },

    actions: {
        login({ commit }, { user, token }) {
            commit('SET_USER', user)
            commit('SET_TOKEN', token)
        },

        logout({ commit }) {
            commit('CLEAR_AUTH')
        },

        updateUser({ commit }, user) {
            commit('SET_USER', user)
        },

        async fetchNotifications({ commit, state }) {
            if (!state.isAuthenticated) return
            
            try {
                const axios = require('axios')
                const response = await axios.get('/users/notifications', {
                    headers: { Authorization: `Bearer ${state.token}` }
                })
                commit('SET_NOTIFICATIONS', response.data.data)
            } catch (error) {
                console.error('Failed to fetch notifications:', error)
            }
        }
    },

    getters: {
        user: (state) => state.user,
        isAuthenticated: (state) => state.isAuthenticated,
        userRole: (state) => state.user?.role || null,
        isSuperAdmin: (state) => state.user?.role === 'super_admin',
        isBranchAdmin: (state) => state.user?.role === 'branch_admin',
        isDA: (state) => state.user?.role === 'da',
        isSMS: (state) => state.user?.role === 'sms',
        isFarmer: (state) => state.user?.role === 'farmer',
        notifications: (state) => state.notifications,
        unreadCount: (state) => state.unreadNotifications
    }
})

export default store