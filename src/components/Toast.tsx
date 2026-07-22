import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, ShieldAlert } from 'lucide-react';

interface ToastProps {
  message: string | null;
  onDismiss: () => void;
}

/**
 * Corner notification that stays until dismissed — no auto-hide timer, so a
 * message can't disappear before the user has read it.
 */
export const Toast: React.FC<ToastProps> = ({ message, onDismiss }) => {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16, transition: { duration: 0.15 } }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="glass-panel"
          style={{
            // Deliberately not .glass-card: its `transition: all .4s` fights
            // motion's exit animation and makes dismissal feel like it hangs.
            position: 'fixed',
            top: 88,
            right: 24,
            zIndex: 100,
            maxWidth: 560,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderRadius: 12,
          }}
        >
          <ShieldAlert
            size={18}
            color="var(--color-danger)"
            style={{ flexShrink: 0 }}
          />

          <p
            style={{
              flex: 1,
              minWidth: 0,
              margin: 0,
              fontSize: '0.875rem',
              lineHeight: 1.4,
              color: 'var(--color-text-secondary)',
            }}
          >
            <span
              style={{
                fontWeight: 600,
                color: 'var(--color-text-primary)',
              }}
            >
              Room Closed.
            </span>{' '}
            {message}
          </p>

          <button
            onClick={onDismiss}
            aria-label="Dismiss notification"
            className="toast-dismiss"
          >
            <X size={18} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
