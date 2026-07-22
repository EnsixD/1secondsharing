import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Copy, Check, Share2, ShieldAlert, Loader2 } from 'lucide-react';

interface WaitingRoomViewProps {
  code: string;
  onCloseRoom: () => void;
}

export const WaitingRoomView: React.FC<WaitingRoomViewProps> = ({ code }) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const shareableUrl = `${window.location.origin}/?room=${code}`;

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
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
        <ShieldAlert
          size={48}
          className="text-gradient"
          style={{ margin: '0px auto 24px', display: 'block' }}
        />

        <h2 style={{ fontSize: '2rem', marginBottom: 8 }}>
          Secure Room Created
        </h2>
        <p style={{ marginBottom: 32 }}>
          Share this unique code with your recipient. The room will close when
          you leave.
        </p>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ marginBottom: 32 }}
        >
          <div
            onClick={copyCode}
            className="glass-panel-interactive"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 20,
              fontSize: '2rem',
              fontWeight: 600,
              letterSpacing: 4,
            }}
            title="Copy code"
          >
            <span className="text-gradient-accent">{code}</span>
            {copiedCode ? (
              <Check size={24} color="var(--color-success)" />
            ) : (
              <Copy size={24} color="var(--color-text-secondary)" />
            )}
          </div>
        </motion.div>

        <button
          onClick={copyLink}
          className="glass-button"
          style={{ width: '100%', marginBottom: 32 }}
        >
          {copiedLink ? (
            <>
              <Check size={20} color="var(--color-success)" />
              <span style={{ color: 'var(--color-success)' }}>
                Share Link Copied!
              </span>
            </>
          ) : (
            <>
              <Share2 size={20} />
              <span>Copy Share Link</span>
            </>
          )}
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            color: 'var(--color-text-secondary)',
          }}
        >
          <Loader2 size={16} style={{ animation: 'spin 2s linear infinite' }} />
          <span style={{ fontSize: '0.9rem' }}>Waiting for connection...</span>
        </div>
      </div>
    </motion.div>
  );
};
