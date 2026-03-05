"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RhythmVisualizerProps {
    phrase: string;
    vector: number[];
    title?: string;
}

const RhythmVisualizer: React.FC<RhythmVisualizerProps> = ({ phrase, vector, title }) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [hoveredType, setHoveredType] = useState<'dwell' | 'flight' | null>(null);

    const targetLen = phrase.length;
    const dwells = vector.slice(0, targetLen);
    const flights = vector.slice(targetLen, targetLen + targetLen - 1);

    const getColor = (val: number, isFlight: boolean = false) => {
        const max = isFlight ? 0.4 : 0.2;
        const normalized = Math.min(val / max, 1);
        if (normalized < 0.3) return `rgb(59, 130, 246)`; // Bright Blue
        if (normalized < 0.7) return `rgb(34, 197, 94)`; // Vibrant Green
        return `rgb(239, 68, 68)`; // Safety Red
    };

    return (
        <div className="mt-8 p-6 rounded-[32px] bg-black/40 border border-white/5 backdrop-blur-md shadow-2xl relative group/viz">
            <div className="flex justify-between items-center mb-6">
                {title && <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">{title}</h4>}
                <div className="flex gap-4">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" /><span className="text-[9px] text-white/20 font-bold">FAST</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500" /><span className="text-[9px] text-white/20 font-bold">SLOW</span></div>
                </div>
            </div>

            {/* Horizontal Scroll Area */}
            <div className="overflow-x-auto pb-6 custom-scrollbar">
                <div className="flex items-end min-w-max px-2 h-32">
                    {phrase.split("").map((char, i) => {
                        const dwell = dwells[i] || 0;
                        const flight = flights[i] || 0;

                        return (
                            <div key={i} className="flex items-end">
                                {/* Dwell Column */}
                                <div
                                    className="flex flex-col items-center cursor-crosshair px-0.5"
                                    onMouseEnter={() => { setHoveredIndex(i); setHoveredType('dwell'); }}
                                    onMouseLeave={() => { setHoveredIndex(null); setHoveredType(null); }}
                                >
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: Math.max(dwell * 300, 6) }}
                                        className={`w-4 sm:w-6 rounded-t-lg transition-all duration-300 ${hoveredIndex === i && hoveredType === 'dwell' ? 'brightness-150 scale-x-110 shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'opacity-80'}`}
                                        style={{ backgroundColor: getColor(dwell) }}
                                    />
                                    <div className={`mt-2 text-sm font-black transition-colors ${hoveredIndex === i ? 'text-white' : 'text-white/20'}`}>
                                        {char === " " ? "␣" : char}
                                    </div>
                                </div>

                                {/* Flight Gap */}
                                {i < targetLen - 1 && (
                                    <div
                                        className="h-full flex flex-col items-center justify-end px-0.5 mb-8 cursor-crosshair pb-1"
                                        onMouseEnter={() => { setHoveredIndex(i); setHoveredType('flight'); }}
                                        onMouseLeave={() => { setHoveredIndex(null); setHoveredType(null); }}
                                    >
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className={`h-1.5 w-6 sm:w-8 rounded-full transition-all ${hoveredIndex === i && hoveredType === 'flight' ? 'brightness-150 scale-y-150' : 'opacity-20'}`}
                                            style={{ backgroundColor: getColor(flight, true) }}
                                        />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Live Data Inspector */}
            <div className="mt-4 pt-4 border-t border-white/5 h-10 flex items-center justify-center">
                <AnimatePresence mode="wait">
                    {hoveredIndex !== null ? (
                        <motion.div
                            key="hover"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="flex items-center gap-6 text-[11px] font-bold"
                        >
                            <span className="text-white/40">INDEX <span className="text-white">#{hoveredIndex}</span></span>
                            <span className="text-white/40">COMPONENT <span className="text-blue-400 uppercase">{hoveredType}</span></span>
                            <span className="text-white/40">LATENCY <span className="text-white font-mono text-xs">{(hoveredType === 'dwell' ? dwells[hoveredIndex] : flights[hoveredIndex]) * 1000}ms</span></span>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-[10px] text-white/10 uppercase tracking-[0.2em] font-bold"
                        >
                            Hover bars for high-fidelity data
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default RhythmVisualizer;
