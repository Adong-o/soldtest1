import { db, auth } from './firebase.js';
import { collection, addDoc, query, where, orderBy, limit, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

export class ActivityTracker {
    constructor() {
        this.activitiesContainer = document.getElementById('recentActivityList');
    }

    async logActivity(action, details) {
        try {
            const user = auth.currentUser;
            if (!user) return;

            const activity = {
                userId: user.uid,
                action,
                details,
                timestamp: serverTimestamp()
            };

            await addDoc(collection(db, 'activities'), activity);
            await this.refreshActivities();
        } catch (error) {
            console.error('Error logging activity:', error);
        }
    }

    async refreshActivities() {
        if (!this.activitiesContainer) return;

        try {
            const user = auth.currentUser;
            if (!user) return;

            const activitiesRef = collection(db, 'activities');
            const q = query(
                activitiesRef,
                where("userId", "==", user.uid),
                orderBy("timestamp", "desc"),
                limit(10)
            );

            const snapshot = await getDocs(q);
            
            if (snapshot.empty) {
                this.activitiesContainer.innerHTML = this.getEmptyState();
                return;
            }

            const activities = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate() || new Date()
            }));

            this.activitiesContainer.innerHTML = `
                <div class="activity-list">
                    ${activities.map(activity => this.getActivityItem(activity)).join('')}
                </div>
            `;
        } catch (error) {
            console.error('Error refreshing activities:', error);
            this.activitiesContainer.innerHTML = this.getErrorState();
        }
    }

    getActivityItem(activity) {
        const timeAgo = this.getTimeAgo(activity.timestamp);
        const icon = this.getActivityIcon(activity.action);
        
        return `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="${icon}"></i>
                </div>
                <div class="activity-content">
                    <p>${activity.details}</p>
                    <span class="activity-time">${timeAgo}</span>
                </div>
            </div>
        `;
    }

    getActivityIcon(action) {
        const icons = {
            login: 'fas fa-sign-in-alt',
            logout: 'fas fa-sign-out-alt',
            create_listing: 'fas fa-plus',
            view_listing: 'fas fa-eye',
            edit_listing: 'fas fa-edit',
            delete_listing: 'fas fa-trash',
            publish_listing: 'fas fa-globe',
            mark_sold: 'fas fa-check-circle',
            default: 'fas fa-circle'
        };
        return icons[action] || icons.default;
    }

    getTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        const intervals = {
            year: 31536000,
            month: 2592000,
            week: 604800,
            day: 86400,
            hour: 3600,
            minute: 60
        };

        for (const [unit, secondsInUnit] of Object.entries(intervals)) {
            const interval = Math.floor(seconds / secondsInUnit);
            if (interval >= 1) {
                return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
            }
        }
        return 'Just now';
    }

    getEmptyState() {
        return `
            <div class="empty-state">
                <i class="fas fa-history"></i>
                <p>No recent activity</p>
            </div>
        `;
    }

    getErrorState() {
        return `
            <div class="error-state">
                <i class="fas fa-exclamation-circle"></i>
                <p>Error loading activities</p>
            </div>
        `;
    }
} 