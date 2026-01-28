import React, { useState, useEffect } from 'react';

interface TypewriterProps {
    text: string;
    speed?: number;
    onComplete?: () => void;
    className?: string;
}

export const Typewriter: React.FC<TypewriterProps> = ({ text, speed = 10, onComplete, className }) => {
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(true);

    useEffect(() => {
        // Reset if text changes
        setDisplayedText('');
        setIsTyping(true);
        let index = 0;

        // Allow immediate render if text is short or empty
        if (!text) {
            setIsTyping(false);
            return;
        }

        const intervalId = setInterval(() => {
            if (index < text.length) {
                setDisplayedText((prev) => prev + text.charAt(index));
                index++;
            } else {
                clearInterval(intervalId);
                setIsTyping(false);
                if (onComplete) onComplete();
            }
        }, speed);

        return () => clearInterval(intervalId);
    }, [text, speed]);

    return (
        <div className={`${className} ${isTyping ? 'typing-cursor' : ''}`}>
            {displayedText}
        </div>
    );
};
