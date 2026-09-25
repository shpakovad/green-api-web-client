export interface Message {
    id: string;
    text: string;
    isOutgoing: boolean;
    timestamp: number;
}

export interface ChatMessages {
    [phoneNumber: string]: Message[];
}

export interface UserCredentials {
    idInstance: string;
    apiTokenInstance: string;
}

export interface GreenNotificationResponse {
    receiptId: number;
    body: {
        typeWebhook: string;
        senderData: {
            sender: string;
        };
        messageData?: {
            typeMessage: string;
            textMessageData: {
                textMessage: string;
            };
        };
    };
}
