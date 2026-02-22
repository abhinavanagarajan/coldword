from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
from Crypto.Random import get_random_bytes
import base64

class AESManager:
    def __init__(self, key):
        self.key = key # Must be 32 bytes for AES-256

    def encrypt(self, data):
        """Encrypts a string using AES-256-CBC."""
        iv = get_random_bytes(16)
        cipher = AES.new(self.key, AES.MODE_CBC, iv)
        ct_bytes = cipher.encrypt(pad(data.encode(), AES.block_size))
        
        # Combine IV and Ciphertext for storage
        result = base64.b64encode(iv + ct_bytes).decode('utf-8')
        return result

    def decrypt(self, encoded_data):
        """Decrypts the base64 string."""
        raw_data = base64.b64decode(encoded_data)
        iv = raw_data[:16]
        ct = raw_data[16:]
        
        cipher = AES.new(self.key, AES.MODE_CBC, iv)
        try:
            pt = unpad(cipher.decrypt(ct), AES.block_size)
            return pt.decode('utf-8')
        except ValueError:
            # Padding is incorrect, likely wrong key
            return None
