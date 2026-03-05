"use client";

import React, { useState, useRef, useEffect } from 'react';

interface TimingInputProps {
    targetPhrase: string;
    onFinished: (timingVector: number[]) => void;
    placeholder?: string;
    disabled?: boolean;
}

const TimingInput: React.FC<TimingInputProps> = ({ targetPhrase, onFinished, placeholder, disabled }) => {
    const [value, setValue] = useState("");

    // Per-character timing maps
    const pressTimes = useRef<(number | null)[]>(new Array(targetPhrase.length).fill(null));
    const releaseTimes = useRef<(number | null)[]>(new Array(targetPhrase.length).fill(null));
    const charIndices = useRef<{ [key: string]: number[] }>({}); // Map 't' to indices it appears at

    // Initialize character index mapping (e.g., 'e' might be at 2 and 14)
    useEffect(() => {
        const mapping: { [key: string]: number[] } = {};
        targetPhrase.split('').forEach((char, i) => {
            const c = char.toLowerCase();
            if (!mapping[c]) mapping[c] = [];
            mapping[c].push(i);
        });
        charIndices.current = mapping;
    }, [targetPhrase]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (disabled || e.repeat) return;
        const key = e.key.toLowerCase();
        if (key === 'shift' || key === 'control' || key === 'alt') return;

        // Find the FIRST null slot for this key that is roughly near the current cursor
        const indices = charIndices.current[key];
        if (!indices) return;

        const nextSlot = indices.find(idx => pressTimes.current[idx] === null && idx >= value.length - 1 && idx <= value.length + 1);

        if (nextSlot !== undefined) {
            pressTimes.current[nextSlot] = performance.now() / 1000;
        }
    };

    const handleKeyUp = (e: React.KeyboardEvent) => {
        if (disabled) return;
        const key = e.key.toLowerCase();

        if (e.key === 'Enter') {
            processAndFinish();
            return;
        }

        // Find the slot for this key that was pressed but not yet released
        const indices = charIndices.current[key];
        if (!indices) return;

        const openSlot = indices.find(idx => pressTimes.current[idx] !== null && releaseTimes.current[idx] === null);

        if (openSlot !== undefined) {
            releaseTimes.current[openSlot] = performance.now() / 1000;
        }
    };

    const processAndFinish = () => {
        const targetLen = targetPhrase.length;

        // Validation: Passphrase must match exactly
        if (value.trim() !== targetPhrase.trim()) {
            alert(`Typo detected! Please type exactly: "${targetPhrase}"`);
            reset();
            return;
        }

        const dwell_times: number[] = new Array(targetLen).fill(0.1); // Default 100ms fallback
        const flight_times: number[] = new Array(targetLen - 1).fill(0.1);

        for (let i = 0; i < targetLen; i++) {
            const p = pressTimes.current[i];
            const r = releaseTimes.current[i];

            if (p !== null && r !== null) {
                dwell_times[i] = Math.max(r - p, 0.01);
            }

            // Flight time = Time between Release of i and Press of i+1
            if (i < targetLen - 1) {
                const rCurr = releaseTimes.current[i];
                const pNext = pressTimes.current[i + 1];
                if (rCurr !== null && pNext !== null) {
                    flight_times[i] = pNext - rCurr;
                }
            }
        }

        const vector = [...dwell_times, ...flight_times];
        onFinished(vector);
    };

    const reset = () => {
        setValue("");
        pressTimes.current = new Array(targetPhrase.length).fill(null);
        releaseTimes.current = new Array(targetPhrase.length).fill(null);
    };

    return (
        <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            placeholder={placeholder || `Type: "${targetPhrase}"`}
            disabled={disabled}
            autoComplete="off"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all font-medium text-lg"
        />
    );
};
export default TimingInput;
