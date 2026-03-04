import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutos em milissegundos
const MAX_SESSION_MS = 3 * 60 * 60 * 1000; // 3 horas em milissegundos

export const useAuthSession = () => {
    const navigate = useNavigate();
    const idleTimerRef = useRef(null);
    const sessionTimerRef = useRef(null);

    const logout = (reason) => {
        console.warn(`Sessão encerrada: ${reason}`);
        localStorage.removeItem('token');
        localStorage.removeItem('session_start');

        // Limpa os timers
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);

        navigate('/', { replace: true });
    };

    const resetIdleTimer = () => {
        if (idleTimerRef.current) {
            clearTimeout(idleTimerRef.current);
        }
        idleTimerRef.current = setTimeout(() => {
            logout('Inatividade prolongada (15 minutos)');
        }, IDLE_TIMEOUT_MS);
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return; // Só ativa as regras se estiver logado

        // Inicializa/Verifica o tempo máximo de sessão (3 horas absolutas)
        let sessionStart = localStorage.getItem('session_start');
        if (!sessionStart) {
            sessionStart = Date.now().toString();
            localStorage.setItem('session_start', sessionStart);
        }

        const timeElapsed = Date.now() - parseInt(sessionStart, 10);
        const timeRemaining = MAX_SESSION_MS - timeElapsed;

        if (timeRemaining <= 0) {
            logout('Sessão máxima atingida (3 horas)');
            return;
        } else {
            sessionTimerRef.current = setTimeout(() => {
                logout('Sessão máxima atingida (3 horas)');
            }, timeRemaining);
        }

        // Configura o timer de inatividade
        resetIdleTimer();

        // Eventos que resetam a inatividade
        const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

        const handleUserActivity = () => {
            resetIdleTimer();
        };

        events.forEach(event => {
            window.addEventListener(event, handleUserActivity);
        });

        // Cleanup ao desmontar
        return () => {
            events.forEach(event => {
                window.removeEventListener(event, handleUserActivity);
            });
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
            if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
        };
    }, [navigate]);

    return null; // Hook invisível, apenas executa lógica de fundo
};

export default useAuthSession;
