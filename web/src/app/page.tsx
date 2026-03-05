"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Lock,
  Unlock,
  CheckCircle,
  XCircle,
  Info,
  RefreshCcw,
  Fingerprint,
  Activity,
  Zap,
  Microchip
} from 'lucide-react';
import TimingInput from '@/components/TimingInput';
import RhythmVisualizer from '@/components/RhythmVisualizer';

const API_URL = "http://localhost:8000";

export default function Home() {
  const [activeTab, setActiveTab] = useState<'enroll' | 'verify'>('enroll');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: "" });

  // Persistence for the session
  const [phrase] = useState("the quick brown fox");
  const [secretMessage, setSecretMessage] = useState("This is my behavior-locked secret.");
  const [currentVector, setCurrentVector] = useState<number[] | null>(null);
  const [enrollmentData, setEnrollmentData] = useState<{
    helper: number[],
    salt: string,
    key_hash: string,
    encrypted_message: string,
    timing_vector: number[]
  } | null>(null);

  const [verificationResult, setVerificationResult] = useState<{
    success: boolean,
    decrypted_message?: string,
    drift?: number
  } | null>(null);

  const handleEnroll = async (vector: number[]) => {
    setLoading(true);
    setStatus({ type: null, message: "" });
    setCurrentVector(vector);
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
        setEnrollmentData({ ...data, timing_vector: vector });
        setStatus({ type: 'success', message: "Enrollment Successful! Scrypt Salt generated and AES-GCM Vault locked." });
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
    setCurrentVector(vector);
    try {
      const resp = await fetch(`${API_URL}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timing_vector: vector,
          helper: enrollmentData.helper,
          salt: enrollmentData.salt,
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
    <main className="min-h-screen flex flex-col items-center justify-center p-6 sm:p-24 relative overflow-hidden bg-[#050505] text-white">
      {/* Dynamic Background */}
      <div className="absolute top-0 -left-20 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 -right-20 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />

      <div className="w-full max-w-3xl z-10">
        <header className="mb-12 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex items-center justify-center gap-4 mb-6"
          >
            <div className="relative">
              <Shield className="w-16 h-16 text-blue-500" />
              <motion.div
                animate={{ opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 bg-blue-500 blur-2xl rounded-full"
              />
            </div>
            <h1 className="text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/40">COLDWORD</h1>
          </motion.div>
          <div className="flex items-center justify-center gap-6 text-[10px] uppercase tracking-[0.4em] font-bold text-white/30">
            <span className="flex items-center gap-2"><Fingerprint className="w-3 h-3" /> Biometric</span>
            <span className="flex items-center gap-2"><Lock className="w-3 h-3" /> Encrypted</span>
            <span className="flex items-center gap-2"><Activity className="w-3 h-3" /> Behavioral</span>
          </div>
        </header>

        <div className="relative group">
          {/* Glass Card */}
          <div className=" glass rounded-[40px] p-10 glow-blue border border-white/10 backdrop-blur-3xl shadow-2xl relative overflow-hidden">

            {/* Tab Navigation */}
            <div className="flex gap-2 mb-10 bg-white/5 p-1.5 rounded-[20px] w-fit border border-white/5 mx-auto">
              <button
                onClick={() => { setActiveTab('enroll'); setStatus({ type: null, message: "" }); setVerificationResult(null); }}
                className={`flex items-center gap-2 px-8 py-3 rounded-[14px] text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'enroll' ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'text-white/30 hover:text-white/60'}`}
              >
                <Zap className={`w-4 h-4 ${activeTab === 'enroll' ? 'fill-current' : ''}`} />
                Enrollment
              </button>
              <button
                onClick={() => { setActiveTab('verify'); setStatus({ type: null, message: "" }); }}
                disabled={!enrollmentData}
                className={`flex items-center gap-2 px-8 py-3 rounded-[14px] text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'verify' ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'text-white/30 hover:text-white/60 disabled:opacity-20'}`}
              >
                <Unlock className={`w-4 h-4 ${activeTab === 'verify' ? 'fill-current' : ''}`} />
                Verification
              </button>
            </div>

            <AnimatePresence mode="wait">
              {activeTab === 'enroll' ? (
                <motion.div
                  key="enroll"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-8"
                >
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1">
                      <Microchip className="w-3 h-3" /> Secure Vault Payload
                    </label>
                    <textarea
                      value={secretMessage}
                      onChange={(e) => setSecretMessage(e.target.value)}
                      className="w-full bg-black/60 border border-white/5 rounded-[24px] px-6 py-5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 h-32 transition-all placeholder:text-white/10 font-medium text-lg"
                      placeholder="Secrets to hide..."
                    />
                  </div>

                  <div className="bg-white/5 border border-white/5 p-6 rounded-[24px] flex gap-5 items-start">
                    <div className="p-3 bg-blue-500/10 rounded-2xl">
                      <Fingerprint className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-black text-sm uppercase tracking-tight mb-1">Rhythm Enrollment</h4>
                      <p className="text-sm text-white/40 leading-relaxed font-medium">
                        We capture the <span className="text-blue-400">Dwell Time</span> (held keys) and <span className="text-blue-400">Flight Time</span> (gaps) to create a unique behavioral signature.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] text-center italic">Type exactly: "{phrase}"</p>
                    <TimingInput
                      targetPhrase={phrase}
                      onFinished={handleEnroll}
                      disabled={loading}
                      placeholder="the quick brown fox"
                    />
                  </div>

                  {!enrollmentData ? (
                    <div className="h-32 rounded-[32px] border border-dashed border-white/5 flex flex-col items-center justify-center gap-2 text-white/10 italic text-xs font-bold uppercase tracking-[0.2em]">
                      <Activity className="w-5 h-5 opacity-20" />
                      <span>Fingerprint will generate upon completion</span>
                    </div>
                  ) : (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                      <RhythmVisualizer title="Master Fingerprint Recorded" phrase={phrase} vector={enrollmentData.timing_vector} />
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="verify"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/5 p-8 rounded-[32px] flex items-center gap-6">
                    <div className={`p-5 rounded-[22px] shadow-2xl transition-all duration-500 ${verificationResult?.success ? 'bg-green-500/20 text-green-400 scale-110' : 'bg-red-500/20 text-red-500'}`}>
                      {verificationResult?.success ? <Unlock className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
                    </div>
                    <div>
                      <p className="font-black text-white text-xl tracking-tight">Vault Locked</p>
                      <p className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black">Requires Exact rhythm for: "{phrase}"</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Biometric Receiver</span>
                      {!currentVector && <motion.span animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ repeat: Infinity, duration: 2 }} className="text-[9px] text-blue-500 font-bold uppercase tracking-tighter">● Waiting for signature</motion.span>}
                    </div>
                    <TimingInput
                      targetPhrase={phrase}
                      onFinished={handleVerify}
                      disabled={loading}
                      placeholder="Verify rhythm..."
                    />
                  </div>

                  {enrollmentData && (
                    <div className="space-y-8">
                      {!currentVector ? (
                        <div className="h-32 rounded-[32px] border border-dashed border-white/5 flex flex-col items-center justify-center gap-2 text-white/10 italic text-xs font-bold uppercase tracking-[0.2em]">
                          <Activity className="w-5 h-5 opacity-20" />
                          <span>Signature heatmap will manifest here</span>
                        </div>
                      ) : (
                        <RhythmVisualizer
                          title={status.type === 'error' ? "Rejected Input Signature" : "Access Granted Signature"}
                          phrase={phrase}
                          vector={currentVector}
                        />
                      )}

                      {verificationResult && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-8 rounded-[32px] border-2 shadow-2xl relative overflow-hidden ${verificationResult.success ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}
                        >
                          {/* Inner glow for success/fail */}
                          <div className={`absolute inset-0 opacity-10 blur-3xl ${verificationResult.success ? 'bg-green-500' : 'bg-red-500'}`} />

                          <div className="flex items-center gap-4 mb-6 relative z-10">
                            <div className={`p-3 rounded-2xl ${verificationResult.success ? 'bg-green-400/20' : 'bg-red-400/20'}`}>
                              {verificationResult.success ? (
                                <CheckCircle className="w-7 h-7 text-green-400" />
                              ) : (
                                <XCircle className="w-7 h-7 text-red-400" />
                              )}
                            </div>
                            <h3 className="font-black text-2xl tracking-tighter uppercase italic">
                              {verificationResult.success ? "Vault Decrypted" : "Access Denied"}
                            </h3>
                          </div>

                          {verificationResult.success ? (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="bg-black/60 p-8 rounded-2xl font-mono text-xl text-green-200 break-all border border-green-500/20 shadow-inner relative z-10"
                            >
                              {verificationResult.decrypted_message}
                            </motion.div>
                          ) : (
                            <div className="text-red-300 font-bold space-y-4 relative z-10">
                              <div className="flex justify-between items-center bg-black/40 p-4 rounded-xl border border-red-500/10">
                                <span className="text-[10px] uppercase tracking-widest text-red-500/60">Euclidean Drift</span>
                                <span className="font-mono text-xl">{verificationResult.drift?.toFixed(6)}</span>
                              </div>
                              <p className="text-xs text-red-300/40 uppercase tracking-widest text-center">Fuzzy Extractor failed to resolve bins.</p>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Global Status Toast */}
            <AnimatePresence>
              {status.type && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`mt-10 p-5 rounded-[20px] flex items-center gap-4 font-black border-2 backdrop-blur-md ${status.type === 'success' ? 'bg-blue-600/10 text-blue-400 border-blue-500/20' : 'bg-red-600/10 text-red-400 border-red-500/20'}`}
                >
                  <div className={`p-2 rounded-lg ${status.type === 'success' ? 'bg-blue-400/20' : 'bg-red-400/20'}`}>
                    {status.type === 'success' ? <Shield className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                  </div>
                  <span className="text-xs uppercase tracking-widest">{status.message}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Professional Footer */}
        <footer className="mt-16 text-center text-white/20 text-[10px] flex flex-col items-center gap-8">
          <div className="flex flex-wrap justify-center items-center gap-4 px-8 py-3 bg-white/5 rounded-full border border-white/5 uppercase tracking-[0.25em] font-black">
            <div className="flex items-center gap-2 text-blue-400/80 underline decoration-blue-500/50 underline-offset-4">AES-256-GCM</div>
            <div className="w-1 h-1 rounded-full bg-white/20" />
            <div className="flex items-center gap-2 text-purple-400/80 underline decoration-purple-500/50 underline-offset-4">Scrypt (N=16k)</div>
            <div className="w-1 h-1 rounded-full bg-white/20" />
            <div className="flex items-center gap-2 text-green-400/80 underline decoration-green-500/50 underline-offset-4">Secure Sketch</div>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="group flex items-center gap-3 text-white/20 hover:text-white/60 transition-all uppercase tracking-[0.5em] font-black text-[9px] bg-white/5 px-6 py-2 rounded-full border border-white/5"
          >
            <RefreshCcw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-700" />
            Purge Session Context
          </button>

          <p className="mt-4 opacity-50">&copy; 2024 ColdWord Security Systems. No persistent biometrics stored.</p>
        </footer>
      </div>
    </main>
  );
}
