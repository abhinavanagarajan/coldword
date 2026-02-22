import sys
import hashlib
import numpy as np
from dynamics import get_timing_vector
from fuzzy import FuzzyExtractor
from encryption import AESManager

def main():
    print("=== Behavior-Based Encryption POC ===")
    phrase = "the quick brown fox"
    
    # 1. ENROLLMENT PHASE
    print("\n[Section 1: Enrollment]")
    print("First, we need to capture your unique typing 'fingerprint'.")
    timing_enroll = get_timing_vector(phrase)
    
    extractor = FuzzyExtractor(bin_size=0.3) # 300ms bins (±150ms tolerance)
    key, helper = extractor.generate(timing_enroll)
    key_hash = hashlib.sha256(key).hexdigest()
    
    print("\nSuccess! Timing vector captured.")
    print(f"Vector length: {len(timing_enroll)}")
    print(f"Generated Key (SHA256 hash): {key_hash}")
    
    # Encrypt a sample string
    secret_message = "This is a top-secret message locked by your behavior."
    aes_manager = AESManager(key)
    encrypted_msg = aes_manager.encrypt(secret_message)
    print(f"Encrypted Message: {encrypted_msg}")
    
    # 2. VERIFICATION / DECRYPTION PHASE
    print("\n" + "="*40)
    print("[Section 2: Verification]")
    print("Now, try to unlock the file by typing the same phrase again.")
    
    timing_verify = get_timing_vector(phrase)
    
    # Attempt to reconstruct the key
    recovered_key, drift = extractor.reproduce(timing_verify, helper, key_hash)
    
    print(f"\nTiming Drift (Euclidean Distance): {drift:.4f}")
    
    if recovered_key:
        print("✅ ACCESS GRANTED: Dynamics matched! Recovering key...")
        decrypter = AESManager(recovered_key)
        decrypted_msg = decrypter.decrypt(encrypted_msg)
        print(f"Decrypted Message: {decrypted_msg}")
    else:
        print("❌ ACCESS DENIED: Timing variance exceeded threshold.")
        print("Even though the text was correct, your typing rhythm was different.")
        print("This 'Failed State' prevents unauthorized users from using your password.")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\nError: {e}")
        print("\nNote: pynput requires 'Accessibility' permissions on macOS.")
        print("Or you may be running in a headless environment.")
