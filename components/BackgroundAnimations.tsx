import React from 'react';

interface BackgroundAnimationsProps {
    theme: 'light' | 'dark';
}

export const BackgroundAnimations: React.FC<BackgroundAnimationsProps> = React.memo(({ theme }) => {
    // Generate stable random values only once
    const stars = React.useMemo(() => [...Array(30)].map((_, i) => ({
        id: i,
        width: Math.random() * 2 + 'px',
        height: Math.random() * 2 + 'px',
        top: Math.random() * 100 + '%',
        left: Math.random() * 100 + '%',
        animationDelay: Math.random() * 5 + 's',
        opacity: Math.random()
    })), []);

    const particles = React.useMemo(() => [...Array(8)].map((_, i) => ({
        id: i,
        width: Math.random() * 6 + 2 + 'px',
        height: Math.random() * 6 + 2 + 'px',
        left: Math.random() * 100 + '%',
        top: Math.random() * 100 + '%',
        opacity: Math.random() * 0.3 + 0.1,
        animationDelay: Math.random() * 5 + 's',
        animationDuration: Math.random() * 10 + 10 + 's'
    })), []);

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden transform-gpu">
            {theme === 'dark' && (
                <>
                    {/* Space Layer */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#020617] to-[#020617]"></div>

                    {/* Stars */}
                    {stars.map((star) => (
                        <div
                            key={`star-${star.id}`}
                            className="absolute bg-white rounded-full animate-twinkle will-change-transform"
                            style={{
                                width: star.width,
                                height: star.height,
                                top: star.top,
                                left: star.left,
                                animationDelay: star.animationDelay,
                                opacity: star.opacity
                            }}
                        ></div>
                    ))}

                    {/* Nebula Orbs - Optimized with static blur in CSS if possible, but keeping localized here with reduced complexity */}
                    <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-purple-600/10 rounded-full blur-[80px] animate-pulse-glow"></div>
                    <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[60px] animate-pulse-glow" style={{ animationDelay: '3s' }}></div>

                    {/* Meteors */}
                    <div className="absolute top-0 right-0 w-[300px] h-[300px]">
                        <div className="animate-meteor" style={{ top: '20%', left: '80%', animationDelay: '2s' }}></div>
                        <div className="animate-meteor" style={{ top: '40%', left: '90%', animationDelay: '5s' }}></div>
                    </div>

                    {/* Central Space Singularity - Optimized blend mode */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-30">
                        {/* Orbiting Rings */}
                        <div className="absolute w-[800px] h-[800px] border border-indigo-500/10 rounded-full animate-spin-slow will-change-transform" style={{ animationDuration: '60s' }}></div>
                        <div className="absolute w-[600px] h-[600px] border border-purple-500/10 rounded-full border-dashed animate-spin-slow will-change-transform" style={{ animationDuration: '40s', animationDirection: 'reverse' }}></div>

                        {/* Accretion Disk */}
                        <div className="absolute w-[400px] h-[400px] bg-gradient-to-r from-indigo-600/10 via-purple-900/10 to-indigo-600/10 rounded-full blur-[40px] animate-pulse"></div>

                        {/* Event Horizon */}
                        <div className="relative w-2 bg-white rounded-full shadow-[0_0_50px_rgba(168,85,247,0.3)] animate-pulse"></div>
                    </div>
                </>
            )}

            {theme === 'light' && (
                <>
                    {/* Dark Blue Tech / Blueprint Theme */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-50 via-white to-blue-50 opacity-80"></div>

                    {/* Deep Blue Grid */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e3a8a1a_1px,transparent_1px),linear-gradient(to_bottom,#1e3a8a1a_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

                    {/* Rotating Tech Rings */}
                    <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] border border-blue-200 rounded-full opacity-40 animate-spin-slow will-change-transform"></div>
                    <div className="absolute top-[-5%] right-[0%] w-[400px] h-[400px] border border-dashed border-blue-400 rounded-full opacity-20 animate-spin-slow will-change-transform" style={{ animationDuration: '20s', animationDirection: 'reverse' }}></div>
                    <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] border-[2px] border-blue-100 rounded-full opacity-60"></div>

                    {/* Floating Blue Particles */}
                    {particles.map((particle) => (
                        <div
                            key={`blue-particle-${particle.id}`}
                            className="absolute bg-blue-600 rounded-full animate-float will-change-transform"
                            style={{
                                width: particle.width,
                                height: particle.height,
                                left: particle.left,
                                top: particle.top,
                                opacity: particle.opacity,
                                animationDelay: particle.animationDelay,
                                animationDuration: particle.animationDuration
                            }}
                        ></div>
                    ))}

                    {/* Soft Blue Glows */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-400/5 rounded-full blur-[80px] pointer-events-none"></div>
                </>
            )}
        </div>
    );
});
