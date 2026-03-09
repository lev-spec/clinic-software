document.addEventListener("DOMContentLoaded", function () {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    if (!currentUser) return; // Wait for dashboard.js redirect

    const usersListContainer = document.getElementById("users-list");
    const userSearch = document.getElementById("user-search");
    const chatHeader = document.getElementById("chat-header");
    const messagesContainer = document.getElementById("messages-container");
    const messageInput = document.getElementById("message-input");
    const sendBtn = document.getElementById("send-btn");

    let activeChatUserId = null;
    
    // Seed initial admin user if no doctors exist just in case
    let doctors = JSON.parse(localStorage.getItem("doctors")) || [];
    if (doctors.length === 0 && currentUser.username === 'admin1234') {
        // We are admin, but not in doctors list. We should add ourselves so others can message us?
        // Actually doctors list is managed in doctros.html.
        // We will just show all users from 'doctors' plus a generic 'admin' if not present.
    }
    
    function getAllUsers() {
        let docs = JSON.parse(localStorage.getItem("doctors")) || [];
        // Make sure current user is not in the list, or is marked properly
        docs = docs.filter(d => d.id !== currentUser.id);
        
        // If current user is a doctor, they can chat with admin. Let's create an admin pseudo-user if it doesn't exist
        const adminExists = docs.some(d => d.username === 'admin1234');
        if (!adminExists && currentUser.username !== 'admin1234') {
            docs.push({
                id: "admin-id",
                firstName: "ადმინისტრატორი",
                lastName: "",
                role: "ადმინისტრაცია",
                username: "admin1234"
            });
        }
        return docs;
    }

    function renderUsersList(searchTerm = "") {
        const users = getAllUsers();
        usersListContainer.innerHTML = "";
        
        let allMessages = JSON.parse(localStorage.getItem("messages")) || [];

        const filtered = users.filter(u => 
            u.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
            (u.lastName && u.lastName.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        filtered.forEach(u => {
            // Check unread messages from this user to current user
            const unreadCount = allMessages.filter(m => m.fromId === u.id && m.toId === currentUser.id && !m.read).length;

            const div = document.createElement("div");
            div.className = `user-item ${activeChatUserId === u.id ? 'active' : ''}`;
            div.innerHTML = `
                <div style="font-weight: bold; display: flex; align-items: center;">
                    ${u.firstName} ${u.lastName || ''}
                    ${unreadCount > 0 ? '<span class="unread-indicator"></span>' : ''}
                </div>
                <div style="font-size: 0.8em; color: #666;">${u.role || 'ექიმი'}</div>
            `;
            
            div.addEventListener("click", () => {
                activeChatUserId = u.id;
                chatHeader.textContent = `${u.firstName} ${u.lastName || ''} (${u.role || 'ექიმი'})`;
                messageInput.disabled = false;
                sendBtn.disabled = false;
                
                // Mark messages as read
                let msgs = JSON.parse(localStorage.getItem("messages")) || [];
                msgs.forEach(m => {
                    if (m.fromId === activeChatUserId && m.toId === currentUser.id) {
                        m.read = true;
                    }
                });
                localStorage.setItem("messages", JSON.stringify(msgs));
                
                // Re-render to clear red dot
                renderUsersList(userSearch.value);
                
                // Force a reload of the sidebar to remove the global red dot if all read
                const navContainer = document.querySelector(".bottom_left_container");
                if (navContainer) {
                    const ul = navContainer.querySelector("ul");
                    if (ul) {
                        const allMsgs = JSON.parse(localStorage.getItem("messages")) || [];
                        const hasUnreadGlobal = allMsgs.some(m => m.toId === currentUser.id && !m.read);
                        const chatLink = Array.from(ul.querySelectorAll("a")).find(a => a.href.includes("messages.html"));
                        if (chatLink) {
                            const dot = chatLink.querySelector(".unread-indicator") || chatLink.querySelector("span span");
                            if (!hasUnreadGlobal && dot) {
                                dot.remove();
                            }
                        }
                    }
                }

                loadMessages();
            });
            
            usersListContainer.appendChild(div);
        });
    }

    function loadMessages() {
        if (!activeChatUserId) return;
        let allMessages = JSON.parse(localStorage.getItem("messages")) || [];
        
        // Filter messages between currentUser and activeChatUserId
        const chatMessages = allMessages.filter(m => 
            (m.fromId === currentUser.id && m.toId === activeChatUserId) ||
            (m.fromId === activeChatUserId && m.toId === currentUser.id)
        );

        messagesContainer.innerHTML = "";
        
        if (chatMessages.length === 0) {
            messagesContainer.innerHTML = '<div style="text-align: center; color: #999; margin-top: 50px;">შეტყობინებები არ არის</div>';
            return;
        }
        
        chatMessages.forEach(m => {
            const isSent = m.fromId === currentUser.id;
            const div = document.createElement("div");
            div.className = `message-row ${isSent ? 'sent' : 'received'}`;
            
            const timeStr = new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            div.innerHTML = `
                <div class="message-bubble">${m.text}</div>
                <div style="font-size: 0.7em; color: #999; margin-top: 5px;">${timeStr}</div>
            `;
            messagesContainer.appendChild(div);
        });
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function sendMessage() {
        const text = messageInput.value.trim();
        if (!text || !activeChatUserId) return;
        
        const newMessage = {
            id: Date.now(),
            fromId: currentUser.id || 'admin-id',
            toId: activeChatUserId,
            text: text,
            timestamp: new Date().toISOString(),
            read: false
        };
        
        let allMessages = JSON.parse(localStorage.getItem("messages")) || [];
        allMessages.push(newMessage);
        localStorage.setItem("messages", JSON.stringify(allMessages));
        
        messageInput.value = "";
        loadMessages();
    }

    sendBtn.addEventListener("click", sendMessage);
    messageInput.addEventListener("keyup", (e) => {
        if (e.key === "Enter") sendMessage();
    });

    userSearch.addEventListener("input", (e) => {
        renderUsersList(e.target.value);
    });

    // Refresh every few seconds to simulate real-time
    setInterval(() => {
        if (activeChatUserId) {
            loadMessages();
        }
        renderUsersList(userSearch.value);
    }, 5000);

    renderUsersList();
});