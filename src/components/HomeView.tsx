import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Zap, Shield, Lock } from 'lucide-react';

interface HomeViewProps {
  onCreateRoom: () => void;
  onNavigateToJoin: () => void;
  onJoinRoom: (code: string) => void;
  errorMessage: string | null;
  setErrorMessage: (msg: string | null) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onCreateRoom,
  onNavigateToJoin,
  onJoinRoom,
  errorMessage,
}) => {
  // Check URL query parameters for ?room=XXXXXX
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      onJoinRoom(roomParam.trim().toUpperCase());
    }
  }, [onJoinRoom]);

  // Timing mirrors --transition-smooth: 0.4s cubic-bezier(.16, 1, .3, 1)
  const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(10px)', transition: { duration: 0.3 } }}
      className="home-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      {/* Status pill */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: -20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.8, type: 'spring', stiffness: 100 }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 12px',
            background: 'var(--color-surface-2)',
            borderRadius: 20,
            border: '1px solid var(--color-surface-border)',
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--color-success)',
              boxShadow: '0 0 10px var(--color-success)',
            }}
          />
          <span
            style={{
              fontSize: '0.85rem',
              fontWeight: 500,
              letterSpacing: '0.5px',
            }}
          >
            MILITARY-GRADE P2P FILE SHARING
          </span>
        </div>
      </motion.div>

      {/* Hero headline */}
      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{
          fontSize: 'clamp(3rem, 8vw, 5rem)',
          letterSpacing: '-0.03em',
          marginBottom: 16,
        }}
      >
        Share files with{' '}
        <span className="text-gradient-accent">Zero Friction.</span>
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{
          fontSize: 'clamp(1.1rem, 2vw, 1.3rem)',
          maxWidth: 600,
          marginBottom: 48,
          opacity: 0.8,
        }}
      >
        Direct peer-to-peer connection. Your files are never stored on any
        central server. End-to-end encrypted, instantaneous transfers for
        high-end agencies.
      </motion.p>

      {/* Error message */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            style={{ width: '100%', maxWidth: 480, marginBottom: 24 }}
          >
            <div
              style={{
                padding: 16,
                borderRadius: 12,
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'var(--color-danger)',
                fontSize: '0.9rem',
                fontWeight: 500,
              }}
            >
              {errorMessage}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Primary actions */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        style={{
          display: 'flex',
          gap: 20,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <button
          onClick={onCreateRoom}
          className="glass-button primary"
          style={{ padding: '16px 32px', fontSize: '1.1rem' }}
        >
          <Zap size={20} />
          <span>Create Secure Room</span>
        </button>

        <button
          onClick={onNavigateToJoin}
          className="glass-button"
          style={{ padding: '16px 32px', fontSize: '1.1rem' }}
        >
          <span>Join Existing Room</span>
          <ArrowRight size={20} />
        </button>
      </motion.div>

      {/* Feature highlights */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        style={{
          display: 'flex',
          gap: 32,
          marginTop: 80,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              padding: 12,
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 16,
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Shield size={28} className="text-gradient" />
          </div>
          <div style={{ textAlign: 'left' }}>
            <h3
              style={{
                fontSize: '1.1rem',
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              End-to-End Encrypted
            </h3>
            <p style={{ fontSize: '0.85rem', margin: 0, opacity: 0.7 }}>
              Military socket relay standard
            </p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              padding: 12,
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 16,
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <Lock size={28} className="text-gradient" />
          </div>
          <div style={{ textAlign: 'left' }}>
            <h3
              style={{
                fontSize: '1.1rem',
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              Zero Storage
            </h3>
            <p style={{ fontSize: '0.85rem', margin: 0, opacity: 0.7 }}>
              100% ephemeral memory
            </p>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
