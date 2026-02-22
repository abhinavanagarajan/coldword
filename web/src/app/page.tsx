"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Key, Lock, Unlock, CheckCircle, XCircle, Info, RefreshCcw } from 'lucide-react';
import TimingInput from '@/components/TimingInput';

const API_URL = "http://localhost:8000";

export default function Home() {
  const [activeTab, setActiveTab] = useState<'enroll' | 'verify'>('enroll');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: "" });

  // Persistence for the session
  const [phrase] = useState("the quick brown fox");
  const [secretMessage, setSecretMessage] = useState("This is my behavior-locked secret.");
  const [enrollmentData, setEnrollmentData] = useState<{
    helper: number[],
    key_hash: string,
    encrypted_message: string
  } | null>(null);

  const [verificationResult, setVerificationResult] = useState<{
    success: boolean,
    decrypted?: string,
    drift?: number
  } | null>(null);

  const handleEnroll = async (vector: number[]) => {
    setLoading(true);
    setStatus({ type: null, message: "" });
    try {
      const resp = await fetch(`${API_URL}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timing_vector: vector,
          secret_message: secretMessage
        })
      });
      const data = await resp.json();
      if (resp.ok) {
        setEnrollmentData(data);
        setStatus({ type: 'success', message: "Enrollment Successful! Your typing fingerprint hash: " + data.key_hash.substring(0, 16) + "..." });
        setActiveTab('verify');
      } else {
        setStatus({ type: 'error', message: data.detail || "Enrollment failed." });
      }
    } catch (err) {
      setStatus({ type: 'error', message: "API not connected. Make sure the Python backend is running on port 8000." });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (vector: number[]) => {
    if (!enrollmentData) return;
    setLoading(true);
    setStatus({ type: null, message: "" });
    try {
      const resp = await fetch(`${API_URL}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timing_vector: vector,
          helper: enrollmentData.helper,
          key_hash: enrollmentData.key_hash,
          encrypted_message: enrollmentData.encrypted_message
        })
      });
      const data = await resp.json();
      if (resp.ok) {
        setVerificationResult(data);
        if (data.success) {
          setStatus({ type: 'success', message: "Access Granted! Identity verified by behavior." });
        } else {
          setStatus({ type: 'error', message: "Access Denied: Timing variance exceeded thresholds." });
        }
      }
    } catch (err) {
      setStatus({ type: 'error', message: "API Connection Error." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 sm:p-24 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-500/10 rounded-full blur-[128px]" />
      <div className="absolute bottom-0 -right-4 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px]" />

      <div className="w-full max-w-2xl z-10">
        <header className="mb-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 mb-4"
          >
            <Shield className="w-10 h-10 text-blue-500 shadow-blue-500/50" />
            <h1 className="text-4xl font-bold tracking-tight text-gradient">ColdWord</h1>
          </motion.div>
          <p className="text-white/50 text-lg">Behavior-Based Encryption PoC</p>
        </header>

        <div className="glass rounded-3xl p-8 glow-blue">
          {/* Tabs */}
          <div className="flex gap-4 mb-8 bg-white/5 p-1.5 rounded-2xl w-fit">
            <button
              onClick={() => setActiveTab('enroll')}
              className={`px-6 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'enroll' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white/60'}`}
            >
              1. Enrollment
            </button>
            <button
              onClick={() => setActiveTab('verify')}
              disabled={!enrollmentData}
              className={`px-6 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'verify' ? 'bg-white/10 text-white shadow-lg' : 'text-white/40 hover:text-white/60 disabled:opacity-50'}`}
            >
              2. Verification
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'enroll' ? (
              <motion.div
                key="enroll"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">Secret Message to Encrypt</label>
                  <textarea
                    value={secretMessage}
                    onChange={(e) => setSecretMessage(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 h-24"
                  />
                </div>

                <div className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-2xl flex gap-3">
                  <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-200/70 leading-relaxed">
                    We will record your unique typing rhythm for the phrase below. This rhythm acts as the key.
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium text-white/80">Step 1: Capture Fingerprint</p>
                  <TimingInput
                    targetPhrase={phrase}
                    onFinished={handleEnroll}
                    disabled={loading}
                    placeholder="Type 'the quick brown fox' and press Enter"
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="verify"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-green-500/5 border border-green-500/20 p-4 rounded-2xl flex items-center gap-4">
                  <div className="bg-green-500/20 p-3 rounded-full">
                    <Lock className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-green-200">Session Locked</p>
                    <p className="text-xs text-green-200/60">Verification required to decrypt</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-sm font-medium text-white/80">Step 2: Authenticate by Rhythm</p>
                  <TimingInput
                    targetPhrase={phrase}
                    onFinished={handleVerify}
                    disabled={loading}
                    placeholder="Type the phrase again to unlock..."
                  />
                </div>

                {verificationResult && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`p-6 rounded-2xl border ${verificationResult.success ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      {verificationResult.success ? (
                        <CheckCircle className="w-6 h-6 text-green-400" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-400" />
                      )}
                      <h3 className="font-bold text-lg">
                        {verificationResult.success ? "Decrypted Content" : "Access Denied"}
                      </h3>
                    </div>

                    {verificationResult.success ? (
                      <div className="bg-black/20 p-4 rounded-xl font-mono text-sm text-green-200 break-all">
                        {verificationResult.decrypted_message}
                      </div>
                    ) : (
                      <p className="text-red-300/70 text-sm">
                        Your typing rhythm had a drift of <span className="font-bold">{verificationResult.drift?.toFixed(4)}</span>.
                        This does not match the enrolled fingerprint.
                      </p>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Status Toast Simulation */}
          {status.type && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-6 p-4 rounded-2xl flex items-center gap-3 ${status.type === 'success' ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20' : 'bg-red-500/10 text-red-300 border border-red-500/20'}`}
            >
              {status.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
              <span className="text-sm font-medium">{status.message}</span>
            </motion.div>
          )}
        </div>

        <footer className="mt-8 text-center text-white/20 text-xs flex flex-col items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5"><Key className="w-3 h-3" /> AES-256-CBC</div>
            <div className="flex items-center gap-1.5"><Unlock className="w-3 h-3" /> Fuzzy Extractor</div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 hover:text-white/40 transition-colors"
          >
            <RefreshCcw className="w-3 h-3" /> Reset Session
          </button>
        </footer>
      </div>
    </main>
  );
}
