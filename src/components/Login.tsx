import {useState, type ChangeEvent} from 'react';
import type { UserCredentials } from '../types/chat';

interface LoginProps {
    onLogin: (creds: UserCredentials) => void;
}

export default function Login({ onLogin }: LoginProps) {
    const [idInstance, setIdInstance] = useState<string>('');
    const [apiTokenInstance, setApiTokenInstance] = useState<string>('');

    const handleSubmit = (e: ChangeEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (idInstance.trim() && apiTokenInstance.trim()) {
            onLogin({
                idInstance: idInstance.trim(),
                apiTokenInstance: apiTokenInstance.trim(),
            });
        }
    };

    return (
        <div className="tg-empty flex h-screen items-center justify-center px-4">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-90 flex flex-col items-center"
            >
                <p className="mb-8 max-w-70 text-center text-[15px] leading-snug text-[#707579]">
                    Введите данные GREEN-API, чтобы войти в мессенджер
                </p>

                <div className="mb-3 w-full">
                    <input
                        type="text"
                        placeholder="idInstance"
                        className="tg-input w-full rounded-xl border border-[#dfe1e5] bg-white px-4 py-3.5 text-[15px] text-[#222] outline-none transition focus:ring-1 focus:ring-[#3390ec]"
                        value={idInstance}
                        onChange={(e) => setIdInstance(e.target.value)}
                        required
                    />
                </div>
                <div className="mb-6 w-full">
                    <input
                        type="password"
                        placeholder="apiTokenInstance"
                        className="tg-input w-full rounded-xl border border-[#dfe1e5] bg-white px-4 py-3.5 text-[15px] text-[#222] outline-none transition focus:ring-1 focus:ring-[#3390ec]"
                        value={apiTokenInstance}
                        onChange={(e) => setApiTokenInstance(e.target.value)}
                        required
                    />
                </div>

                <button
                    type="submit"
                    className="w-full rounded-xl bg-[#3390ec] py-3.5 text-[16px] font-medium text-white transition hover:bg-[#2b7fd4]"
                >
                    Войти
                </button>
            </form>
        </div>
    );
}
