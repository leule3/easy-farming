// Main Vue application entry point
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import axios from 'axios'
import i18n from './i18n'
import './assets/main.css'

// Configure axios defaults
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || 
  (isLocalhost ? 'http://localhost:5000/api' : 'https://easy-farming-production-0be4.up.railway.app/api');
axios.interceptors.request.use(config => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

const app = createApp(App)
app.use(router)
app.use(store)
app.use(i18n)
app.mount('#app')