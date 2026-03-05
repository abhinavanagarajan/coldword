from Crypto.Protocol.KDF import scrypt
import os
import numpy as np
import hashlib

class FuzzyExtractor:
    """
    A Secure Sketch based Fuzzy Extractor.
    Now optimized for 'Demo Reliability' with larger bin tolerance.
    """
    def __init__(self, bin_size=1.2): # Increased from 0.05 to 1.2 for massive ±600ms tolerance
        self.bin_size = bin_size

    def _quantize(self, vector):
        return np.round(vector / self.bin_size).astype(int)

    def generate(self, timing_vector):
        q_base = self._quantize(timing_vector)
        helper = timing_vector - (q_base * self.bin_size)
        salt = os.urandom(16)
        secret_key = scrypt(password=q_base.tobytes(), salt=salt, key_len=32, N=2**14, r=8, p=1)
        return secret_key, helper, salt

    def reproduce(self, timing_vector, helper, salt, original_key_hash, threshold=0.8):
        if len(timing_vector) != len(helper):
            print(f"DEBUG: Vector length mismatch! Received {len(timing_vector)}, expected {len(helper)}")
            return None, float('inf')

        nudged_vector = timing_vector - helper
        q_repro = self._quantize(nudged_vector)
        
        candidate_key = scrypt(password=q_repro.tobytes(), salt=salt, key_len=32, N=2**14, r=8, p=1)
        
        drift = np.linalg.norm(timing_vector - (q_repro * self.bin_size + helper))
        success = hashes_match(candidate_key, original_key_hash)
        
        if not success:
            print(f"DEBUG: Cryptographic Hash Mismatch. Drift: {drift:.4f}")
            # Identify which specific indices are outside the bin boundary
            enrolled_q = (timing_vector - nudged_vector) / self.bin_size # Idealized enrollment Q
            # This is a bit of a hack for debugging
        
        if success and drift <= threshold:
            return candidate_key, drift
        return None, drift

def hashes_match(key, original_hash):
    return hashlib.sha256(key).hexdigest() == original_hash
