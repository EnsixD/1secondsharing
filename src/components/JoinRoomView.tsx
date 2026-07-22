import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Link2 } from 'lucide-react';

interface JoinRoomViewProps {
  onJoinRoom: (code: string) => void;
  onBackHome: () => void;
  errorMessage: string | null;
  setErrorMessage: (msg: string | null) => void;
  initialCode?: string;
}

export const JoinRoomView: React.FC<JoinRoomViewProps> = ({
  onJoinRoom,
  errorMessage,
  setErrorMessage,
  initialCode = '',
}) => {
  const [joinCode, setJoinCode] = useState<string>(initialCode);

  useEffect(() => {
    if (initialCode) {
      setJoinCode(initialCode.toUpperCase());
    }
  }, [initialCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      setErrorMessage('Please enter a 6-character room code');
      return;
    }
    onJoinRoom(joinCode.trim().toUpperCase());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
      .replace(/[^0-9a-zA-Z]/g, '')
      .slice(0, 8)
      .toUpperCase();
    setJoinCode(val);
    if (errorMessage) setErrorMessage(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '2rem',
      }}
    >
      <div
        className="glass-card"
        style={{
          padding: '3rem',
          maxWidth: 500,
          width: '100%',
          textAlign: 'center',
        }}
      >
        <Link2
          size={48}
          className="text-gradient"
          style={{ margin: '0px auto 24px', display: 'block' }}
        />

        <h2 style={{ fontSize: '2rem', marginBottom: 8 }}>Join Room</h2>
        <p style={{ marginBottom: 32 }}>
          Enter the unique code provided to you to establish a secure P2P
          connection.
        </p>

        {errorMessage && (
          <div
            style={{
              padding: 16,
              background: 'var(--color-danger-glow)',
              border: '1px solid var(--color-danger)',
              borderRadius: 12,
              color: 'var(--color-danger)',
              marginBottom: 24,
            }}
          >
            {errorMessage}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
        >
          <input
            type="text"
            className="glass-input"
            value={joinCode}
            onChange={handleInputChange}
            placeholder="Room Code (e.g. A1B2C3D)"
            maxLength={8}
            autoFocus
            required
            style={{
              textAlign: 'center',
              fontSize: '1.5rem',
              letterSpacing: 2,
              padding: 20,
            }}
          />

          <button
            type="submit"
            className="glass-button primary"
            disabled={!joinCode.trim()}
            style={{
              padding: 20,
              fontSize: '1.2rem',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <span>Connect Securely</span>
            <ArrowRight size={20} />
          </button>
        </form>
      </div>
    </motion.div>
  );
};
