import React from 'react';

interface BackgroundAnimationsProps {
    theme: 'light' | 'dark';
}

export const BackgroundAnimations: React.FC<BackgroundAnimationsProps> = React.memo(({ theme }) => {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {theme === 'dark' && (
                <div className="absolute inset-0 bg-gradient-to-b from-[#020617] to-[#0f172a]"></div>
            )}
            {/* Light mode is just transparent/white, handled by parent bg */}
        </div>
    );
});
