<template>
    <nav class="navbar">
        <div class="navbar-header">
            <div class="navbar-brand">
                <span class="brand-icon">🌾</span>
                <span class="brand-text">Easy Farming</span>
            </div>
            <button class="navbar-toggler" @click="toggleSidebar">
                <span></span>
                <span></span>
                <span></span>
            </button>
        </div>

        <div class="navbar-actions">
            <!-- Notifications Dropdown -->
            <div class="notification-dropdown" @click="toggleNotifications">
                <span class="notification-icon">🔔</span>
                <span v-if="unreadCount > 0" class="notification-badge">{{ unreadCount }}</span>
                
                <div v-if="showNotifications" class="dropdown-menu">
                    <div class="dropdown-header">
                        <h4>Notifications</h4>
                    </div>
                    <div v-if="notifications.length === 0" class="dropdown-empty">
                        No notifications
                    </div>
                    <div v-for="notification in notifications.slice(0, 10)" 
                         :key="notification.id"
                         :class="['dropdown-item', { unread: !notification.is_read }]"
                         @click.stop="markAsRead(notification)">
                        <p class="notification-message">{{ notification.message }}</p>
                        <small class="notification-time">{{ formatTime(notification.created_at) }}</small>
                    </div>
                </div>
            </div>

            <!-- User Menu -->
            <div class="user-menu" @click="toggleUserMenu">
                <div class="user-avatar">
                    {{ userInitials }}
                </div>
                <span class="user-name">{{ userName }}</span>
                
                <div v-if="showUserMenu" class="dropdown-menu">
                    <router-link to="/profile" class="dropdown-item" @click="showUserMenu = false">
                        👤 Profile
                    </router-link>
                    <router-link to="/dashboard" class="dropdown-item" @click="showUserMenu = false">
                        📊 Dashboard
                    </router-link>
                    <div class="dropdown-divider"></div>
                    <a href="#" class="dropdown-item" @click.prevent="handleLogout">
                        🚪 Logout
                    </a>
                </div>
            </div>
        </div>
    </nav>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import axios from 'axios'

export default {
    name: 'Navbar',
    data() {
        return {
            showNotifications: false,
            showUserMenu: false
        }
    },
    computed: {
        ...mapGetters(['user', 'notifications', 'unreadCount']),
        userName() {
            return this.user ? `${this.user.first_name} ${this.user.last_name}` : ''
        },
        userInitials() {
            if (!this.user) return '?'
            return (this.user.first_name[0] + this.user.last_name[0]).toUpperCase()
        }
    },
    methods: {
        ...mapActions(['fetchNotifications', 'logout']),
        
        toggleSidebar() {
            this.$emit('toggle-sidebar')
        },
        
        toggleNotifications() {
            this.showNotifications = !this.showNotifications
            this.showUserMenu = false
            if (this.showNotifications) {
                this.fetchNotifications()
            }
        },
        
        toggleUserMenu() {
            this.showUserMenu = !this.showUserMenu
            this.showNotifications = false
        },
        
        async markAsRead(notification) {
            if (!notification.is_read) {
                try {
                    await axios.put(`/users/notifications/${notification.id}/read`)
                    this.$store.commit('MARK_NOTIFICATION_READ', notification.id)
                } catch (error) {
                    console.error('Failed to mark notification as read:', error)
                }
            }
        },
        
        handleLogout() {
            this.logout()
            this.$router.push('/login')
        },
        
        formatTime(dateString) {
            const date = new Date(dateString)
            const now = new Date()
            const diff = now - date
            const minutes = Math.floor(diff / 60000)
            const hours = Math.floor(diff / 3600000)
            const days = Math.floor(diff / 86400000)
            
            if (minutes < 1) return 'Just now'
            if (minutes < 60) return `${minutes}m ago`
            if (hours < 24) return `${hours}h ago`
            if (days < 7) return `${days}d ago`
            return date.toLocaleDateString()
        }
    },
    mounted() {
        this.fetchNotifications()
    }
}
</script>

<style scoped>
.navbar {
    background: white;
    padding: 0 20px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    position: sticky;
    top: 0;
    z-index: 100;
}

.navbar-header {
    display: flex;
    align-items: center;
    gap: 15px;
}

.navbar-brand {
    display: flex;
    align-items: center;
    gap: 10px;
}

.brand-icon {
    font-size: 24px;
}

.brand-text {
    font-size: 20px;
    font-weight: 700;
    color: #2d6a4f;
}

.navbar-toggler {
    display: none;
    flex-direction: column;
    gap: 5px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 5px;
}

.navbar-toggler span {
    display: block;
    width: 25px;
    height: 3px;
    background: #2d6a4f;
    border-radius: 3px;
}

.navbar-actions {
    display: flex;
    align-items: center;
    gap: 20px;
    position: relative;
}

.notification-dropdown,
.user-menu {
    position: relative;
    cursor: pointer;
}

.notification-icon {
    font-size: 20px;
    position: relative;
}

.notification-badge {
    position: absolute;
    top: -8px;
    right: -8px;
    background: #d62828;
    color: white;
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 10px;
    min-width: 20px;
    text-align: center;
}

.user-menu {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 5px 10px;
    border-radius: 5px;
    transition: background 0.3s;
}

.user-menu:hover {
    background: #f0f2f5;
}

.user-avatar {
    width: 35px;
    height: 35px;
    background: #2d6a4f;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 14px;
}

.user-name {
    font-weight: 500;
}

.dropdown-menu {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 10px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 5px 20px rgba(0,0,0,0.15);
    min-width: 250px;
    z-index: 200;
    animation: fadeIn 0.2s ease;
}

.dropdown-header {
    padding: 15px;
    border-bottom: 1px solid #eee;
}

.dropdown-header h4 {
    margin: 0;
    font-size: 16px;
}

.dropdown-item {
    padding: 12px 15px;
    display: block;
    color: #333;
    text-decoration: none;
    transition: background 0.2s;
}

.dropdown-item:hover {
    background: #f8f9fa;
}

.dropdown-item.unread {
    background: #e8f5e9;
    font-weight: 500;
}

.notification-message {
    margin: 0;
    font-size: 14px;
}

.notification-time {
    color: #999;
    font-size: 12px;
}

.dropdown-empty {
    padding: 20px;
    text-align: center;
    color: #999;
}

.dropdown-divider {
    height: 1px;
    background: #eee;
    margin: 5px 0;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 768px) {
    .navbar-toggler {
        display: flex;
    }
    
    .user-name {
        display: none;
    }
}
</style>