import time
from pynput import keyboard
import numpy as np

class KeystrokeRecorder:
    def __init__(self, target_phrase):
        self.target_phrase = target_phrase
        self.press_times = {}
        self.timings = [] # List of (key, press_time, release_time)
        self.raw_events = []

    def _on_press(self, key):
        try:
            k = key.char
        except AttributeError:
            k = str(key)
        
        self.raw_events.append(('press', k, time.time()))

    def _on_release(self, key):
        try:
            k = key.char
        except AttributeError:
            k = str(key)
            
        self.raw_events.append(('release', k, time.time()))
        
        # Stop listener if escape is pressed or if length reached (simple logic)
        if key == keyboard.Key.esc:
            return False

    def record(self):
        print(f"\nPlease type the passphrase: '{self.target_phrase}'")
        print("(Press ESC once finished or it will stop automatically if implemented)")
        
        with keyboard.Listener(on_press=self._on_press, on_release=self._on_release) as listener:
            listener.join()
            
        return self.process_raw_events()

    def process_raw_events(self):
        """
        Extracts Dwell Time and Flight Time.
        Dwell Time: ReleaseTime_i - PressTime_i
        Flight Time: PressTime_i - ReleaseTime_{i-1}
        """
        dwell_times = []
        flight_times = []
        
        presses = {}
        last_release_time = None
        
        # We expect a specific number of keystrokes based on the phrase
        target_len = len(self.target_phrase)
        
        for action, key, timestamp in self.raw_events:
            # Ignore ESC and modifier keys (Shift, Ctrl, Alt, Cmd)
            key_str = str(key)
            if any(mod in key_str for mod in ['esc', 'shift', 'ctrl', 'alt', 'cmd', 'Key.']):
                # We still want to process the space key, which pynput labels as Key.space
                if 'space' not in key_str:
                    continue
                
            if action == 'press':
                presses[key] = timestamp
                if last_release_time is not None:
                    if len(flight_times) < target_len - 1:
                        flight_times.append(timestamp - last_release_time)
            elif action == 'release':
                if key in presses:
                    if len(dwell_times) < target_len:
                        dwell_times.append(timestamp - presses[key])
                        last_release_time = timestamp
                    del presses[key]
        
        # Final safety check: if we don't have enough data, pad with zeros
        # to prevent broadcasting errors in fuzzy.py
        while len(dwell_times) < target_len:
            dwell_times.append(0.0)
        while len(flight_times) < target_len - 1:
            flight_times.append(0.0)

        return np.array(dwell_times[:target_len] + flight_times[:target_len-1])

def get_timing_vector(phrase):
    recorder = KeystrokeRecorder(phrase)
    return recorder.record()
