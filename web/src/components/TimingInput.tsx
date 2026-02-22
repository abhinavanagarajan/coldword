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
    const events = useRef<{ action: 'press' | 'release', key: string, timestamp: number }[]>([]);
    const presses = useRef<{ [key: string]: number }>({});

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (disabled) return;

        // Ignore modifiers
        if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(e.key)) return;

        const key = e.key;
        if (!presses.current[key]) {
            presses.current[key] = performance.now() / 1000;
            events.current.push({ action: 'press', key, timestamp: performance.now() / 1000 });
        }
    };

    const handleKeyUp = (e: React.KeyboardEvent) => {
        if (disabled) return;
        if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(e.key)) return;

        const key = e.key;
        if (presses.current[key]) {
            events.current.push({ action: 'release', key, timestamp: performance.now() / 1000 });
            delete presses.current[key];
        }

        if (e.key === 'Enter') {
            processAndFinish();
        }
    };

    const processAndFinish = () => {
        const dwell_times: number[] = [];
        const flight_times: number[] = [];
        let last_release_time: number | null = null;
        const temp_presses: { [key: string]: number } = {};

        const target_len = targetPhrase.length;

        for (const ev of events.current) {
            if (ev.action === 'press') {
                temp_presses[ev.key] = ev.timestamp;
                if (last_release_time !== null) {
                    if (flight_times.length < target_len - 1) {
                        flight_times.append ? null : flight_times.push(ev.timestamp - last_release_time);
                    }
                }
            } else if (ev.action === 'release') {
                if (temp_presses[ev.key]) {
                    if (dwell_times.length < target_len) {
                        dwell_times.push(ev.timestamp - temp_presses[ev.key]);
                        last_release_time = ev.timestamp;
                    }
                    delete temp_presses[ev.key];
                }
            }
        }

        // Padding if needed
        while (dwell_times.length < target_len) dwell_times.push(0);
        while (flight_times.length < target_len - 1) flight_times.push(0);

        const vector = [...dwell_times.slice(0, target_len), ...flight_times.slice(0, target_len - 1)];
        onFinished(vector);

        // Reset for next time
        // setValue("");
        // events.current = [];
    };

    return (
        <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            placeholder={placeholder || `Type: "${targetPhrase}" and press Enter`}
            disabled={disabled}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
        />
    );
};

export default TimingInput;
