import { useState } from 'react';
import Login from './components/Login';
import ChatWindow from './components/ChatWindow';
import type {UserCredentials} from './types/chat';


export default function App() {
    const [credentials, setCredentials] = useState<UserCredentials | null>(() => {
        const savedCreds = localStorage.getItem('tg_user_credentials');
        return savedCreds ? JSON.parse(savedCreds) : null;
    });

    const handleLogin = (creds: UserCredentials) => {
        localStorage.setItem('tg_user_credentials', JSON.stringify(creds));
        setCredentials(creds);
    };

    const handleLogout = () => {
        localStorage.removeItem('tg_user_credentials');
        setCredentials(null);
    };

    return (
        <>
            {!credentials ? (
                <Login onLogin={handleLogin} />
            ) : (
                <ChatWindow credentials={credentials} onLogout={handleLogout}/>
            )}
        </>
    );
}
