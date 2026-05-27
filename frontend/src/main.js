// Main Vue application entry point
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import axios from 'axios'
import i18n from './i18n'
import './assets/main.css'

// Configure axios defaults
axios.defaults.baseURL = 'http://localhost:5000/api'
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