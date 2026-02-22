import numpy as np
import hashlib
from fuzzy import FuzzyExtractor
from encryption import AESManager

def simulate_poc():
    print("--- SIMULATED Behavior-Based Encryption POC ---")
    print("Use this if pynput permissions are restricted.\n")
    
    # Simulate a 10-character phrase timing (Dwell + Flight = 19 features)
    # Mean timing around 0.15s (150ms)
    enroll_timing = np.random.normal(0.15, 0.02, 19)
    
    extractor = FuzzyExtractor(bin_size=0.1)
    key, helper = extractor.generate(enroll_timing)
    key_hash = hashlib.sha256(key).hexdigest()
    
    msg = "Shared Secret: The eagle flies at midnight."
    aes = AESManager(key)
    encrypted = aes.encrypt(msg)
    
    print(f"Enrollment successful. Simulated key hash: {key_hash[:10]}...")
    
    # 1. Simulate SUCCESS (Minor noise)
    print("\nCase 1: Successful Login (Same user, slight variation)")
    success_timing = enroll_timing + np.random.normal(0, 0.01, 19) # 10ms jitter
    recovered_key, drift = extractor.reproduce(success_timing, helper, key_hash)
    
    if recovered_key:
        print(f"✅ Resolved to same key! Drift: {drift:.4f}")
        print(f"Decrypted: {AESManager(recovered_key).decrypt(encrypted)}")
    
    # 2. Simulate FAILURE (High variance - different user or intoxicated)
    print("\nCase 2: Failed Login (Different rhythm - 100ms variance)")
    fail_timing = enroll_timing + np.random.normal(0, 0.1, 19) 
    recovered_key, drift = extractor.reproduce(fail_timing, helper, key_hash)
    
    if not recovered_key:
        print(f"❌ Resolution failed. Drift: {drift:.4f}")
        print("Access Denied: Timing vector outside acceptable bounds.")

if __name__ == "__main__":
    simulate_poc()
