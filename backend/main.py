from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import numpy as np
import hashlib
from fuzzy import FuzzyExtractor
from encryption import AESManager
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow Next.js frontend to communicate with Python backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class EnrollmentRequest(BaseModel):
    timing_vector: List[float]
    secret_message: str

class VerificationRequest(BaseModel):
    timing_vector: List[float]
    helper: List[float]
    key_hash: str
    encrypted_message: str

@app.post("/enroll")
async def enroll(req: EnrollmentRequest):
    try:
        extractor = FuzzyExtractor(bin_size=0.3)
        timing_np = np.array(req.timing_vector)
        
        key, helper = extractor.generate(timing_np)
        key_hash = hashlib.sha256(key).hexdigest()
        
        aes = AESManager(key)
        encrypted_msg = aes.encrypt(req.secret_message)
        
        return {
            "helper": helper.tolist(),
            "key_hash": key_hash,
            "encrypted_message": encrypted_msg,
            "vector_length": len(timing_np)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/verify")
async def verify(req: VerificationRequest):
    try:
        extractor = FuzzyExtractor(bin_size=0.3)
        timing_np = np.array(req.timing_vector)
        helper_np = np.array(req.helper)
        
        recovered_key, drift = extractor.reproduce(timing_np, helper_np, req.key_hash)
        
        if recovered_key:
            aes = AESManager(recovered_key)
            decrypted_msg = aes.decrypt(req.encrypted_message)
            return {
                "success": True,
                "decrypted_message": decrypted_msg,
                "drift": drift
            }
        else:
            return {
                "success": False,
                "drift": drift,
                "detail": "Timing variance too high."
            }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
