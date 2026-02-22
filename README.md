## Behavior-Based Encryption POC

This project demonstrates how human typing rhythm (Keystroke Dynamics) can be used as an entropy source for AES-256 encryption.

## How it Works: Converting Noise to Deterministic Keys

The core challenge of biometric or behavioral encryption is that humans never perform the same action exactly the same way twice. There is always "noise." A standard cryptographic hash (like SHA-256) would produce a completely different result even if one keypress was 1ms off.

### 1. Feature Extraction
We capture two primary metrics:
- **Dwell Time**: How long a key is held down.
- **Flight Time**: The interval between releasing one key and pressing the next.
These form a **Timing Vector** (continuous floats).

### 2. The Fuzzy Extractor (The "Magic")
To resolve noisy floats into a stable key, we use a simplified **Secure Sketch**:
- **Quantization**: We map the continuous timing values into discrete "bins" (e.g., 100ms intervals). This absorbs small variations.
- **Helper Data (The Sketch)**: During enrollment, we calculate the "offset" between your actual timing and the center of the nearest bin. We store this offset (the `helper`). 
- **Reconstruction**: When you type again, we use the `helper` to "nudge" your new timing back toward the original bins. If your rhythm is close enough to the original, you will land in the **exact same bins**, resulting in the **exact same bitstring**.

### 3. Failed State logic
If the "nudge" isn't enough to land you back in the original bins (i.e., your timing drift is too high), the resulting bitstring (and thus the SHA-256 derived key) will be completely different. The decryption will fail because the AES key won't match.

## Setup
1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Run the application:
   ```bash
   python app.py
   ```

## Requirements
- **macOS**: Requires Accessibility permissions for `pynput` to listen to global keystrokes.
- **Python 3.x**
- **Libraries**: `pynput`, `pycryptodome`, `numpy`

<3 Abhinav
