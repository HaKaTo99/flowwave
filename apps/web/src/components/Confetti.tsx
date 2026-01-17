import React, { useEffect, useState } from 'react';

interface Particle {
    id: number;
    x: number;
    y: number;
    color: string;
    rotation: number;
    scale: number;
    velocity: { x: number; y: number };
}

const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'];

export const Confetti: React.FC = () => {
    const [particles, setParticles] = useState<Particle[]>([]);

    useEffect(() => {
        // Initial explosion
        const newParticles: Particle[] = [];
        for (let i = 0; i < 50; i++) {
            const angle = (Math.PI * 2 * i) / 50;
            const velocity = 10 + Math.random() * 10;
            newParticles.push({
                id: i,
                x: 50, // Center in %
                y: 50,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                scale: 0.5 + Math.random(),
                velocity: {
                    x: Math.cos(angle) * velocity * (Math.random() + 0.5),
                    y: Math.sin(angle) * velocity * (Math.random() + 0.5)
                }
            });
        }
        setParticles(newParticles);

        // Animation loop
        let animationFrameId: number;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            if (elapsed > 2000) {
                setParticles([]);
                return;
            }

            setParticles(prev => prev.map(p => ({
                ...p,
                x: p.x + p.velocity.x * 0.1,
                y: p.y + p.velocity.y * 0.1 + 0.5, // Gravity
                rotation: p.rotation + 5,
                velocity: {
                    x: p.velocity.x * 0.95, // Friction
                    y: p.velocity.y * 0.95
                }
            })));

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();
        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    if (particles.length === 0) return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {particles.map(p => (
                <div
                    key={p.id}
                    style={{
                        position: 'absolute',
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: '10px',
                        height: '10px',
                        backgroundColor: p.color,
                        transform: `rotate(${p.rotation}deg) scale(${p.scale})`,
                        borderRadius: '2px',
                        opacity: 1
                    }}
                />
            ))}
        </div>
    );
};
