declare global {
    interface Window {
        handleTurnstileResponse?: (response: string) => void; 
    }
}

export {};
