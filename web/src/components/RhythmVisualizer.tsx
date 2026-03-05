"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface RhythmVisualizerProps {
    phrase: string;
    vector: number[];
    title?: string;
}

const RhythmVisualizer: React.FC<RhythmVisualizerProps> = ({ phrase, vector, title }) => {
    // Split vector into dwells and flights
    const targetLen = phrase.length;
    const dwells = vector.slice(0, targetLen);
    const flights = vector.slice(targetLen, targetLen + targetLen - 1);

    // Color scaling function (0ms - 300ms range for color)
    const getColor = (val: number, isFlight: boolean = false) => {
        // Normalize: 0 to 0.3 seconds is typical keyboard rhythm
        const max = isFlight ? 0.5 : 0.2;
        const normalized = Math.min(val / max, 1);

        // Blue (low) -> Green (mid) -> Red (high)
        if (normalized < 0.3) return `rgba(59, 130, 246, ${0.3 + normalized})`; // Blue
        if (normalized < 0.7) return `rgba(34, 197, 94, ${0.3 + normalized})`; // Green
        return `rgba(239, 68, 68, ${0.3 + normalized})`; // Red
    };

    return (
        <div className="mt-6 p-4 rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
            {title && <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4">{title}</h4>}

            <div className="flex flex-wrap gap-y-6 items-end justify-center font-mono">
                {phrase.split("").map((char, i) => {
                    const dwell = dwells[i] || 0;
                    const flight = flights[i] || 0;

                    return (
                        <div key={i} className="flex items-end">
                            {/* Dwell Visual */}
                            <div className="flex flex-col items-center group relative">
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: Math.max(dwell * 150, 4) }}
                                    className="w-6 rounded-t-sm shadow-inner transition-colors duration-500"
                                    style={{ backgroundColor: getColor(dwell) }}
                                />
                                <div className="text-lg font-bold text-white py-1 px-2 bg-white/5 rounded-b-md border-x border-b border-white/10 min-w-[24px] text-center">
                                    {char === " " ? "_" : char}
                                </div>

                                {/* Tooltip */}
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none whitespace-nowrap">
                                    {(dwell * 1000).toFixed(0)}ms Dwell
                                </div>
                            </div>

                            {/* Flight Visual (between characters) */}
                            {i < targetLen - 1 && (
                                <div className="group relative flex flex-col items-center">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: 8 }}
                                        className="h-1 mx-1 rounded-full mb-4"
                                        style={{ backgroundColor: getColor(flight, true) }}
                                    />
                                    {/* Tooltip */}
                                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-black text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none whitespace-nowrap">
                                        {(flight * 1000).toFixed(0)}ms Flight
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 flex justify-between items-center text-[10px] text-white/30 uppercase tracking-tighter">
                <span>Fast (&lt;50ms)</span>
                <div className="h-1 flex-1 mx-4 bg-gradient-to-r from-blue-500 via-green-500 to-red-500 rounded-full opacity-30" />
                <span>Slow (&gt;300ms)</span>
            </div>
        </div>
    );
};

export default RhythmVisualizer;
