import numpy as np
import hashlib
import os

class FuzzyExtractor:
    """
    A simplified Fuzzy Extractor for Keystroke Dynamics.
    
    It uses quantization to convert continuous timing data into discrete 'bins', 
    and a 'helper' value to shift noisy inputs back to the enrollment center.
    """
    def __init__(self, bin_size=0.05): # 50ms bins
        self.bin_size = bin_size

    def _quantize(self, vector):
        return np.round(vector / self.bin_size).astype(int)

    def generate(self, timing_vector):
        """
        Enrollment phase.
        Produces (secret_key, helper_data)
        """
        # 1. Quantize the input to create a 'base'
        q_base = self._quantize(timing_vector)
        
        # 2. The 'helper' in this POC is the offset (residual noise) 
        # to nudge future similar inputs towards the exact q_base.
        # In a real Secure Sketch, this would involve Error Correcting Codes.
        helper = timing_vector - (q_base * self.bin_size)
        
        # 3. Generate a deterministic key from the quantized base
        # We use SHA-256 to ensure any change in q_base results in a different key.
        seed = q_base.tobytes()
        secret_key = hashlib.sha256(seed).digest()
        
        return secret_key, helper

    def reproduce(self, timing_vector, helper, original_key_hash, threshold=0.15):
        """
        Verification/Decryption phase.
        Attempts to recover the original secret_key.
        """
        if len(timing_vector) != len(helper):
            # If lengths don't match, it's an automatic mismatch
            return None, float('inf')

        # 1. 'Nudge' the noisy vector using the helper
        nudged_vector = timing_vector - helper
        
        # 2. Quantize the nudged vector
        q_repro = self._quantize(nudged_vector)
        
        # 3. Derive the candidate key
        seed = q_repro.tobytes()
        candidate_key = hashlib.sha256(seed).digest()
        
        # 4. Check results
        # Drift: Absolute distance from the enrollment center
        drift = np.linalg.norm(timing_vector - (q_repro * self.bin_size + helper))
        
        success = hashes_match(candidate_key, original_key_hash)
        
        # LOGIC:
        # A 'pass' requires the hash to match (meaning bins didn't flip).
        # We use the threshold (0.15) as an additional security layer: 
        # if the hash matches but the drift is suspiciously high, we could block it.
        # But for this user-friendly update, we focus on explaining why the hash failed.
        
        if success:
            if drift <= threshold:
                return candidate_key, drift
            else:
                # Close hash match but suspiciously high overall drift
                print("DEBUG: Hash matched but drift exceeded security threshold.")
                return None, drift
        else:
            return None, drift

def hashes_match(key, original_hash):
    return hashlib.sha256(key).hexdigest() == original_hash
