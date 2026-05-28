<template>
    <div id="app">
        <!-- Sidebar Backdrop Overlay (on mobile) -->
        <div 
            v-if="isLoggedIn && isSidebarOpen" 
            class="sidebar-overlay" 
            @click="closeSidebar"
        ></div>

        <!-- Sidebar Navigation -->
        <nav 
            v-if="isLoggedIn" 
            :class="['sidebar', { 'active': isSidebarOpen }]"
        >
            <div class="sidebar-header">
                <h2>Easy Farming</h2>
                <p class="user-role">{{ user.role }}</p>
            </div>
            
            <ul class="nav-menu">
                <li @click="closeSidebarOnMobile"><router-link to="/dashboard">📊 {{ $t('nav.dashboard') }}</router-link></li>
                <li @click="closeSidebarOnMobile"><router-link to="/posts">📄 {{ $t('nav.posts') }}</router-link></li>
                <li @click="closeSidebarOnMobile"><router-link to="/forum">💬 {{ $t('nav.forum') }}</router-link></li>
                <li @click="closeSidebarOnMobile"><router-link to="/warnings">⚠️ {{ $t('nav.warnings') }}</router-link></li>
                <li v-if="canReport" @click="closeSidebarOnMobile"><router-link to="/reports">📝 {{ $t('nav.report_problem') }}</router-link></li>
                <li v-if="canInnovate" @click="closeSidebarOnMobile"><router-link to="/innovations">💡 {{ $t('nav.innovations') }}</router-link></li>
                <li v-if="isSuperAdmin" @click="closeSidebarOnMobile"><router-link to="/admin/branches">🏢 {{ $t('nav.branches') }}</router-link></li>
                <li v-if="isSuperAdmin || isBranchAdmin" @click="closeSidebarOnMobile"><router-link to="/admin/users">👥 {{ $t('nav.users') }}</router-link></li>
                <li @click="closeSidebarOnMobile"><router-link to="/profile">👤 {{ $t('nav.profile') }}</router-link></li>
                <li @click="closeSidebarOnMobile"><router-link to="/faq">❓ FAQ</router-link></li>
                <li><a href="#" @click.prevent="logout">🚪 {{ $t('nav.logout') }}</a></li>
            </ul>
        </nav>
        
        <main :class="{ 'with-sidebar': isLoggedIn }">
            <!-- Modern Top Action Header bar -->
            <header class="app-top-header" v-if="isLoggedIn">
                <div class="left-section">
                    <button class="mobile-toggle" @click="toggleSidebar" aria-label="Toggle Navigation">
                        <span class="bar"></span>
                        <span class="bar"></span>
                        <span class="bar"></span>
                    </button>
                    <span class="mobile-brand">🌾 Easy Farming</span>
                </div>
                
                <div class="right-section">
                    <!-- Notification Bell Toggler -->
                    <div class="notification-container">
                        <button class="theme-toggle-btn" @click.stop="toggleNotifications" title="Notifications">
                            <span class="toggle-icon">🔔</span>
                            <span v-if="unreadCount > 0" class="notification-badge-top">{{ unreadCount }}</span>
                        </button>
                        
                        <!-- Dropdown Menu -->
                        <div v-if="showNotifications" class="noti-dropdown-menu" @click.stop>
                            <div class="noti-dropdown-header">
                                <h3>Notifications</h3>
                                <button v-if="unreadCount > 0" @click="markAllAsRead" class="mark-all-btn">Mark all read</button>
                            </div>
                            <div class="noti-dropdown-list">
                                <div v-if="notifications.length === 0" class="noti-empty">
                                    No notifications
                                </div>
                                <div 
                                    v-for="noti in notifications" 
                                    :key="noti.id" 
                                    :class="['noti-item', { 'unread': !noti.is_read }]"
                                    @click="markAsRead(noti)"
                                >
                                    <p class="noti-msg">{{ noti.message }}</p>
                                    <span class="noti-time">{{ formatTime(noti.created_at) }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Dark/Light Theme Toggler -->
                    <button class="theme-toggle-btn" @click="toggleTheme" :title="theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'">
                        <span class="toggle-icon" v-if="theme === 'light'">🌙</span>
                        <span class="toggle-icon" v-else>☀️</span>
                    </button>

                    <!-- Language Selectors -->
                    <div class="lang-selector">
                        <button @click="switchLanguage('en')" :class="{'active': $i18n.locale === 'en'}" class="lang-btn">EN</button>
                        <button @click="switchLanguage('am')" :class="{'active': $i18n.locale === 'am'}" class="lang-btn">AM</button>
                    </div>
                </div>
            </header>

            <!-- Language selector for non-logged-in views (Login/Register) -->
            <div v-else class="anonymous-header">
                <button class="theme-toggle-btn" @click="toggleTheme" :title="theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'">
                    <span class="toggle-icon" v-if="theme === 'light'">🌙</span>
                    <span class="toggle-icon" v-else>☀️</span>
                </button>
            </div>
            
            <router-view />
        </main>
    </div>
</template>

<script>
import axios from 'axios'

export default {
    name: 'App',
    data() {
        return {
            theme: 'light',
            isSidebarOpen: false,
            user: {},
            isLoggedIn: false,
            notifications: [],
            unreadCount: 0,
            showNotifications: false,
            notiInterval: null
        }
    },
    computed: {
        isSuperAdmin() {
            return this.user && this.user.role === 'super_admin'
        },
        isBranchAdmin() {
            return this.user && this.user.role === 'branch_admin'
        },
        canReport() {
            return this.user && ['super_admin', 'branch_admin', 'da', 'sms', 'farmer'].includes(this.user.role)
        },
        canInnovate() {
            return this.user && ['da', 'sms', 'farmer'].includes(this.user.role)
        }
    },
    mounted() {
        // Initialize theme from storage or system preference
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.theme = savedTheme;
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        this.loadUser();

        // Fetch notifications periodically
        this.fetchNotifications();
        this.notiInterval = setInterval(() => {
            this.fetchNotifications();
        }, 15000);

        // Click outside listener for notifications dropdown
        window.addEventListener('click', this.closeNotiDropdown);
    },
    beforeUnmount() {
        if (this.notiInterval) clearInterval(this.notiInterval);
        window.removeEventListener('click', this.closeNotiDropdown);
    },
    watch: {
        $route() {
            this.loadUser();
            this.fetchNotifications();
            this.showNotifications = false;
        }
    },
    methods: {
        loadUser() {
            this.user = JSON.parse(localStorage.getItem('user') || '{}');
            this.isLoggedIn = !!localStorage.getItem('token');
        },
        switchLanguage(lang) {
            this.$i18n.locale = lang;
            localStorage.setItem('language', lang);
        },
        toggleTheme() {
            const nextTheme = this.theme === 'light' ? 'dark' : 'light';
            this.theme = nextTheme;
            localStorage.setItem('theme', nextTheme);
            document.documentElement.setAttribute('data-theme', nextTheme);
        },
        toggleSidebar() {
            this.isSidebarOpen = !this.isSidebarOpen;
        },
        closeSidebar() {
            this.isSidebarOpen = false;
        },
        closeSidebarOnMobile() {
            if (window.innerWidth <= 768) {
                this.isSidebarOpen = false;
            }
        },
        async fetchNotifications() {
            if (!this.isLoggedIn) return;
            try {
                const response = await axios.get('/users/notifications')
                this.notifications = response.data.data
                this.unreadCount = this.notifications.filter(n => !n.is_read).length
            } catch (error) {
                console.error('Failed to fetch notifications:', error)
            }
        },
        toggleNotifications() {
            this.showNotifications = !this.showNotifications;
            if (this.showNotifications) {
                this.fetchNotifications();
            }
        },
        closeNotiDropdown() {
            this.showNotifications = false;
        },
        async markAsRead(noti) {
            if (noti.is_read) return;
            try {
                await axios.put(`/users/notifications/${noti.id}/read`)
                noti.is_read = 1
                this.unreadCount = Math.max(0, this.unreadCount - 1)
            } catch (error) {
                console.error('Failed to mark notification as read:', error)
            }
        },
        async markAllAsRead() {
            const unreads = this.notifications.filter(n => !n.is_read);
            for (const noti of unreads) {
                await this.markAsRead(noti);
            }
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
        },
        logout() {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            this.isSidebarOpen = false
            this.loadUser();
            this.$router.push('/login')
        }
    }
}
</script>

<style>
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: var(--bg-light);
    color: var(--text-dark);
}

#app {
    display: flex;
    min-height: 100vh;
}

/* Sidebar Styling */
.sidebar {
    width: 260px;
    background: linear-gradient(180deg, #2d6a4f, #1b4332);
    color: white;
    padding: 24px 20px;
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    overflow-y: auto;
    z-index: 999; /* Higher than .sidebar-overlay (998) to keep sidebar sharp & clickable! */
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 4px 0 15px rgba(0, 0, 0, 0.05);
}

.sidebar-header {
    text-align: center;
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(255,255,255,0.15);
    margin-bottom: 24px;
}

.sidebar-header h2 {
    font-size: 22px;
    font-weight: 700;
    margin-bottom: 8px;
    letter-spacing: -0.5px;
    color: white;
}

.user-role {
    background: rgba(255,255,255,0.18);
    display: inline-block;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.nav-menu {
    list-style: none;
}

.nav-menu li {
    margin-bottom: 8px;
}

.nav-menu a {
    color: rgba(255, 255, 255, 0.85);
    text-decoration: none;
    display: block;
    padding: 12px 16px;
    border-radius: 8px;
    font-weight: 500;
    transition: all 0.2s ease;
}

.nav-menu a:hover,
.nav-menu a.router-link-active {
    color: white;
    background: rgba(255,255,255,0.15);
    transform: translateX(4px);
}

/* Sidebar Backdrop Overlay */
.sidebar-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.25); /* Subtle dark overlay */
    backdrop-filter: blur(2px);       /* Very clean and elegant 2px blur */
    -webkit-backdrop-filter: blur(2px);
    z-index: 998;
    animation: fadeIn 0.2s ease-out;
}

/* Main Area Layout */
main {
    flex: 1;
    margin-left: 260px;
    padding: 24px;
    min-width: 0;
    transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

main.with-sidebar {
    margin-left: 260px;
}

/* App Top Header Bar */
.app-top-header {
    background: var(--bg-white);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    margin-bottom: 24px;
    box-shadow: var(--shadow-sm);
    transition: background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
}

.anonymous-header {
    display: flex;
    justify-content: flex-end;
    padding: 12px;
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 100;
}

.left-section {
    display: flex;
    align-items: center;
    gap: 12px;
}

.mobile-brand {
    font-size: 18px;
    font-weight: 700;
    color: var(--primary-color);
    display: none;
}

.mobile-toggle {
    display: none;
    flex-direction: column;
    justify-content: space-between;
    width: 22px;
    height: 16px;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0;
}

.mobile-toggle .bar {
    width: 100%;
    height: 2px;
    background: var(--primary-color);
    border-radius: 2px;
    transition: all 0.2s ease;
}

.right-section {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-left: auto;
}

/* Theme Toggler Button */
.theme-toggle-btn {
    background: var(--bg-light);
    border: 1px solid var(--border-color);
    color: var(--text-dark);
    width: 40px;
    height: 40px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    font-size: 18px;
    box-shadow: var(--shadow-sm);
}

.theme-toggle-btn:hover {
    background: var(--border-color);
    transform: scale(1.05);
}

/* Language Selection Header */
.lang-selector {
    display: flex;
    background: var(--bg-light);
    border: 1px solid var(--border-color);
    padding: 4px;
    border-radius: var(--radius-sm);
}

.lang-btn {
    border: none;
    background: transparent;
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    color: var(--text-light);
    transition: all 0.2s ease;
}

.lang-btn.active {
    background: var(--primary-color);
    color: white;
    box-shadow: var(--shadow-sm);
}

/* Global button, input, text stylings */
.alert-danger {
    background: #f8d7da;
    color: #721c24;
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 16px;
}

.btn {
    padding: 10px 20px;
    border-radius: 8px;
    border: none;
    font-size: 15px;
    cursor: pointer;
    font-weight: 600;
}

.btn-primary {
    background: var(--primary-color);
    color: white;
}

.btn-primary:hover {
    background: var(--primary-dark);
}

/* Mobile Screens Adaptation */
@media (max-width: 768px) {
    .sidebar {
        transform: translateX(-100%);
    }
    
    .sidebar.active {
        transform: translateX(0);
    }
    
    main {
        margin-left: 0 !important;
        padding: 16px;
    }
    
    .mobile-toggle {
        display: flex;
    }
    
    .mobile-brand {
        display: inline-block;
    }
    
    .app-top-header {
        padding: 12px 16px;
        margin-bottom: 16px;
    }
}

/* Dark mode overrides for sidebar */
[data-theme="dark"] .sidebar {
    background: linear-gradient(180deg, #183a2b, #0d1f17);
    border-right: 1px solid var(--border-color);
}

[data-theme="dark"] .nav-menu a:hover,
[data-theme="dark"] .nav-menu a.router-link-active {
    background: rgba(255, 255, 255, 0.1);
}

/* Notification Bell and Dropdown Styles */
.notification-container {
    position: relative;
    display: inline-block;
}

.notification-badge-top {
    position: absolute;
    top: -5px;
    right: -5px;
    background: var(--danger-color);
    color: white;
    font-size: 10px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 10px;
    min-width: 18px;
    text-align: center;
    border: 2px solid var(--bg-white);
}

.noti-dropdown-menu {
    position: absolute;
    top: calc(100% + 10px);
    right: 0;
    width: 320px;
    background: var(--bg-white);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    z-index: 1000;
    animation: fadeIn 0.2s ease-out;
    overflow: hidden;
}

.noti-dropdown-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-color);
    background: var(--bg-white);
}

.noti-dropdown-header h3 {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    color: var(--text-dark);
}

.mark-all-btn {
    background: transparent;
    border: none;
    color: var(--primary-color);
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
}

.mark-all-btn:hover {
    color: var(--primary-light);
    text-decoration: underline;
}

.noti-dropdown-list {
    max-height: 350px;
    overflow-y: auto;
}

.noti-item {
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-color);
    cursor: pointer;
    transition: background-color 0.2s ease;
    display: flex;
    flex-direction: column;
    gap: 4px;
    text-align: left;
}

.noti-item:hover {
    background: var(--bg-light);
}

.noti-item.unread {
    background: rgba(45, 106, 79, 0.05);
}

[data-theme="dark"] .noti-item.unread {
    background: rgba(45, 106, 79, 0.15);
}

.noti-msg {
    margin: 0;
    font-size: 13px;
    color: var(--text-dark);
    line-height: 1.4;
}

.noti-item.unread .noti-msg {
    font-weight: 600;
}

.noti-time {
    font-size: 10px;
    color: var(--text-light);
    align-self: flex-end;
}

.noti-empty {
    padding: 25px;
    text-align: center;
    color: var(--text-light);
    font-size: 14px;
}
</style>