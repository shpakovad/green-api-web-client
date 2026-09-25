import { useEffect, useRef } from 'react';
import type {UserCredentials} from '../types/chat';
import { greenApi } from '../services/greenApi';

interface IncomingData {
    senderPhone: string;
    text: string;
}

type NewMessageCallback = (data: IncomingData) => void;

export const useGreenPolling = (
    creds: UserCredentials | null,
    onMessageReceived: NewMessageCallback
) => {
    const isPolling = useRef<boolean>(false);

    useEffect(() => {
        if (!creds) return;

        isPolling.current = true;

        const poll = async () => {
            while (isPolling.current) {
                try {
                    const notification = await greenApi.receiveNotification(creds);

                    if (notification && notification.receiptId) {
                        const { receiptId, body } = notification;

                        if (body.typeWebhook === 'incomingMessageReceived' && body.messageData?.typeMessage === 'textMessage') {
                            const senderWithSuffix = body.senderData.sender;
                            const senderPhone = senderWithSuffix.split('@')[0];
                            const text = body.messageData.textMessageData.textMessage;

                            onMessageReceived({ senderPhone, text });
                        }

                        await greenApi.deleteNotification(creds, receiptId);

                        continue;
                    }

                    await new Promise((resolve) => setTimeout(resolve, 1500));

                } catch (error) {
                    console.error('Ошибка при получении уведомлений:', error);
                    await new Promise((resolve) => setTimeout(resolve, 5000));
                }
            }
        };


        poll();

        return () => {
            isPolling.current = false;
        };
    }, [creds, onMessageReceived]);
};
