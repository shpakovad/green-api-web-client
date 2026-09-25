import type {GreenNotificationResponse, UserCredentials} from '../types/chat';

const BASE_URL = 'https://api.green-api.com';

export const greenApi = {
    async sendMessage(
        creds: UserCredentials,
        phoneNumber: string,
        text: string
    ): Promise<{ idMessage: string }> {
        const chatId = phoneNumber.includes('@') ? phoneNumber : `${phoneNumber}@c.us`;

        const response = await fetch(`${BASE_URL}/waInstance${creds.idInstance}/sendMessage/${creds.apiTokenInstance}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chatId: chatId,
                message: text,
            }),
        });

        if (!response.ok) {
            throw new Error(`Ошибка SendMessage: ${response.statusText}`);
        }

        return response.json();
    },

    async receiveNotification(creds: UserCredentials): Promise<GreenNotificationResponse | null> {
        const response = await fetch(
            `${BASE_URL}/waInstance${creds.idInstance}/receiveNotification/${creds.apiTokenInstance}?receiveTimeout=20`
        );

        if (!response.ok) {
            throw new Error(`Ошибка ReceiveNotification: ${response.statusText}`);
        }
        const textData = await response.text();

        if (!textData || textData.trim() === '') {
            return null;
        }

        return JSON.parse(textData);
    },

    async deleteNotification(creds: UserCredentials, receiptId: number): Promise<void> {
        const response = await fetch(`${BASE_URL}/waInstance${creds.idInstance}/deleteNotification/${creds.apiTokenInstance}/${receiptId}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            throw new Error(`Ошибка DeleteNotification: ${response.statusText}`);
        }
    }
};
