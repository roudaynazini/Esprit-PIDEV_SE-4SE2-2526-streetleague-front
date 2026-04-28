import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Stomp } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export interface WebSocketNotification {
    id?: string;
    type: 'reservation' | 'cancellation' | 'update' | 'message';
    title: string;
    message: string;
    fieldName: string;
    date: string;
    time: string;
    timestamp: string;
    read?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class WebSocketService implements OnDestroy {
    private stompClient: any = null;
    private notificationsSubject = new BehaviorSubject<WebSocketNotification[]>([]);
    public notifications$ = this.notificationsSubject.asObservable();
    
    private connectionStatusSubject = new BehaviorSubject<boolean>(false);
    public connectionStatus$ = this.connectionStatusSubject.asObservable();

    constructor() {
        this.initializeConnection();
    }

    private initializeConnection(): void {
        try {
            const wsUrl = environment.wsUrl + '/ws' || 'http://localhost:8085/ws';
            const socket = new SockJS(wsUrl);
            
            this.stompClient = Stomp.over(socket);
            this.stompClient.debug = () => {}; // Disable debug logs
            
            this.stompClient.connect({}, (frame: any) => {
                console.log('✅ WebSocket STOMP connecté:', frame);
                this.connectionStatusSubject.next(true);
                
                const userId = localStorage.getItem('user_id');
                if (userId) {
                    // Subscribe to user-specific topic
                    this.stompClient.subscribe(`/user/${userId}/queue/notifications`, (message: any) => {
                        console.log('📬 Notification reçue:', message);
                        this.handleNotification(message);
                    });
                }
            }, (error: any) => {
                console.error('❌ Erreur WebSocket STOMP:', error);
                this.connectionStatusSubject.next(false);
                // Retry connection in 5 seconds
                setTimeout(() => this.initializeConnection(), 5000);
            });
        } catch (error) {
            console.error('Erreur lors de l\'initialisation de la connexion WebSocket:', error);
        }
    }

    private handleNotification(message: any): void {
        try {
            const data = JSON.parse(message.body);
            this.addNotification({
                type: data.type || 'message',
                title: data.title,
                message: data.message,
                fieldName: data.fieldName || '',
                date: data.date || '',
                time: data.time || '',
                timestamp: data.timestamp || new Date().toISOString()
            });
        } catch (error) {
            console.error('Erreur lors du parsing de la notification:', error);
        }
    }

    private addNotification(notification: WebSocketNotification): void {
        const currentNotifications = this.notificationsSubject.getValue();
        const newNotification: WebSocketNotification = {
            ...notification,
            id: notification.id || `notif-${Date.now()}`,
            read: false,
            timestamp: notification.timestamp || new Date().toISOString()
        };
        this.notificationsSubject.next([newNotification, ...currentNotifications]);
    }

    /**
     * Obtenir toutes les notifications
     */
    public getNotifications(): Observable<WebSocketNotification[]> {
        return this.notifications$;
    }

    /**
     * Marquer une notification comme lue
     */
    public markAsRead(notificationId: string): void {
        const notifications = this.notificationsSubject.getValue();
        const updated = notifications.map(n => 
            n.id === notificationId ? { ...n, read: true } : n
        );
        this.notificationsSubject.next(updated);
    }

    /**
     * Supprimer une notification
     */
    public deleteNotification(notificationId: string): void {
        const notifications = this.notificationsSubject.getValue();
        const filtered = notifications.filter(n => n.id !== notificationId);
        this.notificationsSubject.next(filtered);
    }

    /**
     * Nettoyer la connexion WebSocket
     */
    public disconnect(): void {
        if (this.stompClient && this.stompClient.connected) {
            this.stompClient.disconnect(() => {
                console.log('WebSocket disconnected');
                this.connectionStatusSubject.next(false);
            });
        }
    }

    ngOnDestroy(): void {
        this.disconnect();
    }
}

