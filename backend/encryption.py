from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
from Crypto.Random import get_random_bytes
import base64

class AESManager:
    def __init__(self, key):
        self.key = key 

    def encrypt(self, data):
        """Encrypts a string using AES-256-GCM (Authenticated Encryption)."""
        # GCM mode is preferred because it provides integrity (AEAD)
        cipher = AES.new(self.key, AES.MODE_GCM)
        ciphertext, tag = cipher.encrypt_and_digest(data.encode())
        
        # Combine Nonce (16 bytes), Tag (16 bytes), and Ciphertext
        # These are all required for secure decryption in GCM mode
        result = base64.b64encode(cipher.nonce + tag + ciphertext).decode('utf-8')
        return result

    def decrypt(self, encoded_data):
        """Decrypts the base64 string and verifies integrity."""
        try:
            raw_data = base64.b64decode(encoded_data)
            # Standard GCM layout: Nonce [0:16], Tag [16:32], Ciphertext [32:]
            nonce = raw_data[:16]
            tag = raw_data[16:32]
            ciphertext = raw_data[32:]
            
            cipher = AES.new(self.key, AES.MODE_GCM, nonce=nonce)
            # If the tag doesn't match, this will throw a ValueError
            pt = cipher.decrypt_and_verify(ciphertext, tag)
            return pt.decode('utf-8')
        except (ValueError, KeyError):
            # ValueError: Integrity check failed (wrong key or tampered data)
            return None
