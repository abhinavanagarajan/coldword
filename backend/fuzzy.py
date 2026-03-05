from Crypto.Protocol.KDF import scrypt
import os
import numpy as np
import hashlib

class FuzzyExtractor:
    """
    A Secure Sketch based Fuzzy Extractor.
    Now using Scrypt for Key Derivation and random salts for uniqueness.
    """
    def __init__(self, bin_size=0.05): 
        self.bin_size = bin_size

    def _quantize(self, vector):
        return np.round(vector / self.bin_size).astype(int)

    def generate(self, timing_vector):
        """
        Enrollment phase.
        Produces (secret_key, helper_data, salt)
        """
        q_base = self._quantize(timing_vector)
        helper = timing_vector - (q_base * self.bin_size)
        
        # Salt prevents rainbow table and collision attacks
        salt = os.urandom(16)
        
        # Scrypt KDF: High memory requirement makes brute force impossible on GPUs
        # Parameters: N=16384 (Cost), r=8 (Block size), p=1 (Parallelization)
        secret_key = scrypt(password=q_base.tobytes(), salt=salt, key_len=32, N=2**14, r=8, p=1)
        
        return secret_key, helper, salt

    def reproduce(self, timing_vector, helper, salt, original_key_hash, threshold=0.15):
        """Attempts to recover the original secret_key using the provided salt."""
        if len(timing_vector) != len(helper):
            return None, float('inf')

        nudged_vector = timing_vector - helper
        q_repro = self._quantize(nudged_vector)
        
        # Re-derive key using SAME salt and Scrypt parameters
        candidate_key = scrypt(password=q_repro.tobytes(), salt=salt, key_len=32, N=2**14, r=8, p=1)
        
        drift = np.linalg.norm(timing_vector - (q_repro * self.bin_size + helper))
        success = hashes_match(candidate_key, original_key_hash)
        
        if success and drift <= threshold:
            return candidate_key, drift
        return None, drift

def hashes_match(key, original_hash):
    return hashlib.sha256(key).hexdigest() == original_hash
