import {useState, useEffect, useRef, useCallback, type ChangeEvent} from 'react';
import type { UserCredentials, ChatMessages, Message } from '../types/chat';
import { useGreenPolling } from '../hooks/useGreenPolling.ts';
import { greenApi } from '../services/greenApi.ts';

interface ChatWindowProps {
    credentials: UserCredentials;
    onLogout: () => void;
}

function formatPhone(phone: string) {
    return `+${phone}`;
}

function avatarHue(phone: string) {
    let hash = 0;
    for (let i = 0; i < phone.length; i++) {
        hash = phone.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % 360;
}

function formatTime(ts: number) {
    return new Date(ts).toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

function lastMessagePreview(messages: Message[] | undefined) {
    if (!messages?.length) return 'Нет сообщений';
    const last = messages[messages.length - 1];
    return last.isOutgoing ? `Вы: ${last.text}` : last.text;
}

export default function ChatWindow({ credentials, onLogout }: ChatWindowProps) {
    const [chats, setChats] = useState<string[]>(() => {
        const saved = localStorage.getItem(`chats_${credentials.idInstance}`);
        return saved ? JSON.parse(saved) : [];
    });

    const [activeChat, setActiveChat] = useState<string | null>(null);
    const [newNumber, setNewNumber] = useState<string>('');
    const [messageText, setMessageText] = useState<string>('');

    const [messages, setMessages] = useState<ChatMessages>(() => {
        const saved = localStorage.getItem(`messages_${credentials.idInstance}`);
        return saved ? JSON.parse(saved) : {};
    });

    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        localStorage.setItem(`chats_${credentials.idInstance}`, JSON.stringify(chats));
        localStorage.setItem(`messages_${credentials.idInstance}`, JSON.stringify(messages));
    }, [chats, messages, credentials.idInstance]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, activeChat]);

    const handleCreateChat = (e: ChangeEvent<HTMLFormElement>) => {
        e.preventDefault();
        const cleanPhone = newNumber.replace(/\D/g, '');
        if (!cleanPhone) return;

        if (!chats.includes(cleanPhone)) {
            setChats((prev) => [...prev, cleanPhone]);
        }
        setActiveChat(cleanPhone);
        setNewNumber('');
    };

    const handleSendMessage = async (e: ChangeEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!messageText.trim() || !activeChat) return;

        const currentText = messageText;
        setMessageText('');

        const newMsg: Message = {
            id: `msg_${Math.random().toString(36).slice(2, 11)}`,
            text: currentText,
            isOutgoing: true,
            timestamp: Date.now(),
        };

        setMessages((prev) => ({
            ...prev,
            [activeChat]: [...(prev[activeChat] || []), newMsg],
        }));

        try {
            await greenApi.sendMessage(credentials, activeChat, currentText);
        } catch (error) {
            console.error('Не удалось отправить сообщение:', error);
        }
    };

    const handleIncomingMessage = useCallback(
        ({ senderPhone, text }: { senderPhone: string; text: string }) => {
            setChats((prev) => (prev.includes(senderPhone) ? prev : [...prev, senderPhone]));

            setMessages((prev) => ({
                ...prev,
                [senderPhone]: [
                    ...(prev[senderPhone] || []),
                    {
                        id: `msg_${Math.random().toString(36).slice(2, 11)}`,
                        text,
                        isOutgoing: false,
                        timestamp: Date.now(),
                    },
                ],
            }));
        },
        [],
    );

    useGreenPolling(credentials, handleIncomingMessage);

    return (
        <div className="flex h-screen bg-[#0e1621] font-[system-ui,-apple-system,'Segoe_UI',Roboto,sans-serif]">
            <div className="flex h-full w-full overflow-hidden bg-white">
                <aside className="flex w-85 shrink-0 flex-col border-r border-[#dfe1e5] bg-white">
                    <div className="flex items-center gap-3 border-b border-[#dfe1e5] px-3 py-2.5">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#3390ec] text-sm font-medium text-white">
                            TG
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="truncate text-[15px] font-medium text-[#222]">
                                GREEN-API Chat
                            </div>
                            <div className="truncate text-[13px] text-[#707579]">
                                {credentials.idInstance}
                            </div>
                        </div>
                    </div>

                    <form
                        onSubmit={handleCreateChat}
                        className="flex gap-2 border-b border-[#dfe1e5] px-3 py-2.5"
                    >
                        <input
                            type="text"
                            placeholder="Поиск или новый номер"
                            className="flex-1 rounded-full bg-[#f4f4f5] px-4 py-2 text-[14px] text-[#222] outline-none"
                            value={newNumber}
                            onChange={(e) => setNewNumber(e.target.value)}
                            required
                        />
                        <button
                            type="submit"
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#3390ec] text-white transition hover:bg-[#2b7fd4]"
                            title="Создать чат"
                            aria-label="Создать чат"
                        >
                            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                            </svg>
                        </button>
                    </form>

                    <div className="flex-1 overflow-y-auto">
                        {chats.length === 0 && (
                            <p className="px-4 py-8 text-center text-[14px] text-[#a2acb4]">
                                Введите номер, чтобы начать чат
                            </p>
                        )}
                        {chats.map((phone) => {
                            const active = activeChat === phone;
                            const hue = avatarHue(phone);
                            return (
                                <button
                                    key={phone}
                                    type="button"
                                    onClick={() => setActiveChat(phone)}
                                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition ${
                                        active
                                            ? 'bg-[#3390ec] text-white'
                                            : 'hover:bg-[#f4f4f5] text-[#222]'
                                    }`}
                                >
                                    <div
                                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[16px] font-medium text-white"
                                        style={{
                                            background: active
                                                ? 'rgba(255,255,255,0.25)'
                                                : `hsl(${hue} 55% 48%)`,
                                        }}
                                    >
                                        {phone.slice(-2)}
                                    </div>
                                    <div className="min-w-0 flex-1 border-b border-transparent py-1">
                                        <div className="flex items-baseline justify-between gap-2">
                                            <span className="truncate text-[15px] font-medium">
                                                {formatPhone(phone)}
                                            </span>
                                            {(messages[phone]?.length ?? 0) > 0 && (
                                                <span
                                                    className={`shrink-0 text-[12px] ${
                                                        active ? 'text-white/70' : 'text-[#a2acb4]'
                                                    }`}
                                                >
                                                    {formatTime(
                                                        messages[phone][
                                                            messages[phone].length - 1
                                                        ].timestamp,
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                        <p
                                            className={`mt-0.5 truncate text-[14px] ${
                                                active ? 'text-white/80' : 'text-[#707579]'
                                            }`}
                                        >
                                            {lastMessagePreview(messages[phone])}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                    <div className="p-3 w-full flex justify-end">
                        <button
                            onClick={onLogout}
                            className="text-xs text-blue-500 hover:text-blue-700 font-medium hover:underline cursor-pointer"
                        >
                            Выйти
                        </button>
                    </div>
                </aside>

                <main className="flex min-w-0 flex-1 flex-col">
                    {activeChat ? (
                        <>
                            <header className="flex items-center gap-3 border-b border-[#dfe1e5] bg-white px-4 py-2.5 shadow-sm">
                                <div
                                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-medium text-white"
                                    style={{
                                        background: `hsl(${avatarHue(activeChat)} 55% 48%)`,
                                    }}
                                >
                                    {activeChat.slice(-2)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="truncate text-[15px] font-medium text-[#222]">
                                        {formatPhone(activeChat)}
                                    </div>
                                    <div className="text-[13px] text-[#707579]">
                                        на связи через GREEN-API
                                    </div>
                                </div>
                            </header>

                            <div className="tg-empty flex flex-1 flex-col gap-1.5 overflow-y-auto px-4 py-3">
                                {(messages[activeChat] || []).map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.isOutgoing ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`tg-bubble relative max-w-[65%] px-2.5 py-3.5 text-[15px] leading-snug shadow-sm ${
                                                msg.isOutgoing
                                                    ? 'tg-bubble-out bg-[#eeffde] text-black rounded-xl rounded-br-sm'
                                                    : 'tg-bubble-in bg-white text-black rounded-xl rounded-bl-sm'
                                            }`}
                                        >
                                            <span className="whitespace-pre-wrap wrap-break-word pr-10">
                                                {msg.text}
                                            </span>
                                            <span className="absolute bottom-1 right-2 text-[11px] leading-none text-[#8d969c]">
                                                {formatTime(msg.timestamp)}
                                                {msg.isOutgoing && (
                                                    <span className="ml-1 text-[#4fae4e]">✓✓</span>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            <form
                                onSubmit={handleSendMessage}
                                className="flex items-end gap-2 bg-[#f0f2f5] px-3 py-2.5"
                            >
                                <input
                                    type="text"
                                    placeholder="Сообщение"
                                    className="flex-1 rounded-xl border-0 bg-white px-4 py-2.5 text-[15px] text-[#222] outline-none"
                                    value={messageText}
                                    onChange={(e) => setMessageText(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    disabled={!messageText.trim()}
                                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#3390ec] text-white transition hover:bg-[#2b7fd4]"
                                    aria-label="Отправить"
                                >
                                    <svg
                                        viewBox="0 0 24 24"
                                        className="h-5 w-5 translate-x-px"
                                        fill="currentColor"
                                    >
                                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                                    </svg>
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="tg-empty flex h-full flex-col items-center justify-center px-6 text-center">
                            <h2 className="mb-2 text-[20px] font-medium text-[#222]">
                                Выберите чат
                            </h2>
                            <p className="max-w-sm text-[14px] leading-relaxed text-[#707579]">
                                Введите номер телефона слева, чтобы начать переписку. Сообщения
                                приходят автоматически через GREEN-API.
                            </p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
