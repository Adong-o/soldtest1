import { db, auth } from './firebase.js';
import { 
    collection, 
    query, 
    where, 
    orderBy, 
    getDocs,
    addDoc,
    doc,
    getDoc,
    updateDoc,
    onSnapshot,
    serverTimestamp 
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    let currentChat = null;
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendMessage');
    const messagesList = document.getElementById('messagesList');
    const conversationsList = document.getElementById('conversationsList');
    const chatContent = document.getElementById('chatContent');
    const emptyState = document.getElementById('emptyState');
    
    // Load user's conversations
    async function loadConversations() {
        const userId = auth.currentUser?.uid;
        if (!userId) return;

        const q = query(
            collection(db, 'inquiries'),
            where('participants', 'array-contains', userId),
            orderBy('lastMessageAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const conversations = [];

        for (const doc of querySnapshot.docs) {
            const data = doc.data();
            const otherUserId = data.participants.find(id => id !== userId);
            const userDoc = await getDoc(db.doc(`users/${otherUserId}`));
            const userData = userDoc.data();

            conversations.push({
                id: doc.id,
                ...data,
                otherUser: {
                    id: otherUserId,
                    email: userData.email
                }
            });
        }

        renderConversations(conversations);
    }

    function renderConversations(conversations) {
        conversationsList.innerHTML = conversations.map(conv => `
            <div class="conversation-item ${conv.id === currentChat?.id ? 'active' : ''}" 
                 onclick="selectConversation('${conv.id}')">
                <h4>${conv.listingName}</h4>
                <p>${conv.otherUser.email}</p>
                <div class="conversation-meta">
                    <span class="conversation-time">
                        ${formatDate(conv.lastMessageAt?.toDate())}
                    </span>
                    ${conv.unreadCount ? `
                        <span class="unread-badge">${conv.unreadCount}</span>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    window.selectConversation = async (conversationId) => {
        const conversation = await getDoc(doc(db, 'inquiries', conversationId));
        currentChat = {
            id: conversationId,
            ...conversation.data()
        };

        // Update UI
        chatContent.style.display = 'flex';
        emptyState.style.display = 'none';
        
        // Load messages
        loadMessages(conversationId);
    };

    async function loadMessages(conversationId) {
        const q = query(
            collection(db, `inquiries/${conversationId}/messages`),
            orderBy('createdAt', 'asc')
        );

        onSnapshot(q, (snapshot) => {
            const messages = [];
            snapshot.forEach(doc => {
                messages.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            renderMessages(messages);
        });
    }

    function renderMessages(messages) {
        const userId = auth.currentUser?.uid;
        messagesList.innerHTML = messages.map(msg => `
            <div class="message ${msg.senderId === userId ? 'sent' : 'received'}">
                <div class="message-content">${msg.content}</div>
                <div class="message-time">${formatDate(msg.createdAt?.toDate())}</div>
            </div>
        `).join('');
        messagesList.scrollTop = messagesList.scrollHeight;
    }

    // Send message
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    async function sendMessage() {
        if (!currentChat || !messageInput.value.trim()) return;

        try {
            const message = {
                content: messageInput.value.trim(),
                senderId: auth.currentUser.uid,
                createdAt: serverTimestamp()
            };

            // Add message to subcollection
            await addDoc(collection(db, `inquiries/${currentChat.id}/messages`), message);

            // Update conversation
            await updateDoc(doc(db, 'inquiries', currentChat.id), {
                lastMessageAt: serverTimestamp(),
                lastMessage: message.content
            });

            messageInput.value = '';
        } catch (error) {
            console.error('Error sending message:', error);
        }
    }

    function formatDate(date) {
        if (!date) return '';
        return new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            minute: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(date);
    }

    // Initialize
    auth.onAuthStateChanged(user => {
        if (user) {
            loadConversations();
        }
    });
}); 