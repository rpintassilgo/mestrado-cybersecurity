import { ref, inject } from 'vue'
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', () => {
    const axios = inject('axios')

    const user = ref(null)

    async function login(credentials) {
        try {
            const response = await axios.post('auth/authenticate', credentials)

            user.value = {
                name: response.data.name,
                email: response.data.email,
            }
            sessionStorage.setItem('user',JSON.stringify(user.value))
            
            return { success: true };         
        } 
        catch(error) {
            clearUser()
            if (error.response && error.response.data && error.response.data.info) {
                 return { success: false, message: error.response.data.info.message };
             } else {
                 return { success: false, message: 'Authentication failed' };
             }
        }
    }

    async function register(credentials) {
        try {
            const response = await axios.post('auth/register', credentials)
            return true       
        } 
        catch(error) {
            return false
        }
    }
    
    async function logout () {
        try {
            await axios.post('auth/logout')
            clearUser()
            return true
        } catch (error) {
            return false
        }
    }

    async function restoreUser () {
        let storedUser = JSON.parse(sessionStorage.getItem('user'))
        if (storedUser) {
            user.value = storedUser
        }
    }

    function clearUser () {
        sessionStorage.removeItem('user')
        user.value = null
    }  
    
    
    return { user, login, register, logout, restoreUser, clearUser }
})
