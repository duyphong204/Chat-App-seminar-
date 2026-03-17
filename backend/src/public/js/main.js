// Cấu hình chung cho ứng dụng Chat
console.log('Chat App loaded successfully');

// Hàm tiện ích
const utils = {
    // Lấy cookie
    getCookie: function(name) {
        let nameEQ = name + "=";
        let cookies = document.cookie.split(';');
        for(let i = 0; i < cookies.length; i++) {
            let cookie = cookies[i].trim();
            if (cookie.indexOf(nameEQ) === 0) 
                return cookie.substring(nameEQ.length, cookie.length);
        }
        return null;
    },
    
    // Gọi API
    api: async function(url, options = {}) {
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        return response.json();
    }
};

// Export utilities
window.utils = utils;
