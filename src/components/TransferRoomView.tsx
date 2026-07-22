import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileTransferItem } from '../types';
import { formatBytes, formatSpeed } from '../lib/utils';
import { CircularProgress } from './CircularProgress';
import {
  CloudUpload,
  Download,
  ShieldCheck,
  Trash2,
  Activity,
  File,
} from 'lucide-react';

interface TransferRoomViewProps {
  code: string;
  role: 'host' | 'peer' | null;
  p2pConnected: boolean;
  transfers: FileTransferItem[];
  onSendFiles: (files: FileList | File[]) => void;
  onCloseRoom: () => void;
}

const listContainerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

// Files land quickly — a transfer list shouldn't feel like it's loading.
const listItemTransition = { duration: 0.25, ease: [0.16, 1, 0.3, 1] } as const;

export const TransferRoomView: React.FC<TransferRoomViewProps> = ({
  code,
  transfers,
  onSendFiles,
  onCloseRoom,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onSendFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onSendFiles(e.target.files);
    }
  };

  const sentFiles = transfers.filter((item) => !item.isIncoming);
  const receivedFiles = transfers.filter((item) => item.isIncoming);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflowY: 'auto',
        padding: '2rem',
        maxWidth: 1200,
        width: '100%',
        margin: '0 auto',
      }}
    >
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 40,
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              padding: 12,
              background: 'var(--color-surface-2)',
              borderRadius: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'glow-pulse 4s infinite',
            }}
          >
            <Activity className="text-gradient-accent" size={24} />
          </div>
          <div>
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              Secure Connection Active
              <ShieldCheck color="var(--color-success)" size={20} />
            </h2>
            <p
              style={{
                color: 'var(--color-text-secondary)',
                fontSize: '0.9rem',
              }}
            >
              Room ID:{' '}
              <span
                style={{
                  color: 'var(--color-text-primary)',
                  letterSpacing: '1px',
                }}
              >
                {code}
              </span>
            </p>
          </div>
        </div>

        <button
          onClick={onCloseRoom}
          className="glass-button danger"
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <Trash2 size={18} />
          Close Room &amp; Shred
        </button>
      </motion.header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 32,
          flex: 1,
        }}
      >
        {/* Dropzone */}
        <div
          className="glass-card"
          style={{
            padding: '3rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            borderStyle: 'dashed',
            borderWidth: '2px',
            borderColor: isDragging
              ? 'var(--color-accent-blue)'
              : 'var(--color-surface-border)',
            background: isDragging
              ? 'rgba(59, 130, 246, 0.05)'
              : 'var(--color-surface-1)',
            transition: 'all 0.3s ease',
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <CloudUpload
            size={64}
            color={
              isDragging
                ? 'var(--color-accent-blue)'
                : 'var(--color-text-secondary)'
            }
            style={{ marginBottom: 24, transition: 'all 0.3s ease' }}
          />
          <h3 style={{ fontSize: '1.5rem', marginBottom: 8 }}>
            Drag &amp; Drop Files Here
          </h3>
          <p
            style={{
              color: 'var(--color-text-secondary)',
              marginBottom: 32,
              textAlign: 'center',
            }}
          >
            Direct peer-to-peer transfer.
            <br />
            Max privacy. Instant delivery.
          </p>
          <input
            type="file"
            id="file-upload"
            ref={fileInputRef}
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
          <label
            htmlFor="file-upload"
            className="glass-button primary"
            style={{ cursor: 'pointer' }}
          >
            Browse Files
          </label>
        </div>

        {/* Received / Sent lists */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.28, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
          className="glass-card"
          style={{
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: 32,
          }}
        >
          <div style={{ flex: 1 }}>
            <h3
              style={{
                fontSize: '1.2rem',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Download size={20} className="text-gradient" /> Received Files
            </h3>

            {receivedFiles.length === 0 ? (
              <p
                style={{
                  color: 'var(--color-text-secondary)',
                  fontSize: '0.9rem',
                  fontStyle: 'italic',
                }}
              >
                No files received yet. Waiting for peer...
              </p>
            ) : (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={listContainerVariants}
                style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                <AnimatePresence>
                  {receivedFiles.map((item) => (
                    <motion.div
                      key={item.id}
                      variants={{
                        hidden: { opacity: 0, x: 20 },
                        visible: { opacity: 1, x: 0 },
                      }}
                      transition={listItemTransition}
                      exit={{ opacity: 0, x: -12, transition: { duration: 0.15 } }}
                      className="glass-panel"
                      style={{
                        padding: 16,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderRadius: 12,
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          overflow: 'hidden',
                        }}
                      >
                        {item.status === 'transferring' ? (
                          <CircularProgress progress={item.progress} />
                        ) : (
                          <File
                            size={24}
                            className="text-gradient-accent"
                            style={{ flexShrink: 0 }}
                          />
                        )}
                        <div style={{ overflow: 'hidden' }}>
                          <p
                            style={{
                              margin: 0,
                              fontWeight: 500,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                            title={item.name}
                          >
                            {item.name}
                          </p>
                          <p
                            style={{
                              margin: 0,
                              fontSize: '0.8rem',
                              color: 'var(--color-text-secondary)',
                              fontVariantNumeric: 'tabular-nums',
                            }}
                          >
                            {item.status === 'transferring'
                              ? `${formatBytes(item.bytesTransferred)} / ${formatBytes(item.size)} · ${formatSpeed(item.speed)}`
                              : formatBytes(item.size)}
                          </p>
                        </div>
                      </div>

                      {item.status === 'completed' && item.blobUrl && (
                        <a
                          href={item.blobUrl}
                          download={item.name}
                          className="glass-button primary"
                          style={{ padding: 8 }}
                        >
                          <Download size={16} />
                        </a>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <h3
              style={{
                fontSize: '1.2rem',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <CloudUpload size={20} className="text-gradient" /> Sent Files
            </h3>

            {sentFiles.length === 0 ? (
              <p
                style={{
                  color: 'var(--color-text-secondary)',
                  fontSize: '0.9rem',
                  fontStyle: 'italic',
                }}
              >
                You haven't sent any files yet.
              </p>
            ) : (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={listContainerVariants}
                style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                <AnimatePresence>
                  {sentFiles.map((item) => (
                    <motion.div
                      key={item.id}
                      variants={{
                        hidden: { opacity: 0, x: -20 },
                        visible: { opacity: 1, x: 0 },
                      }}
                      transition={listItemTransition}
                      exit={{ opacity: 0, x: -12, transition: { duration: 0.15 } }}
                      className="glass-panel"
                      style={{
                        padding: 16,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        borderRadius: 12,
                      }}
                    >
                      {item.status === 'transferring' ? (
                        <CircularProgress progress={item.progress} />
                      ) : (
                        <File
                          size={24}
                          color="var(--color-text-secondary)"
                          style={{ flexShrink: 0 }}
                        />
                      )}
                      <div style={{ overflow: 'hidden' }}>
                        <p
                          style={{
                            margin: 0,
                            fontWeight: 500,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={item.name}
                        >
                          {item.name}
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontSize: '0.8rem',
                            color: 'var(--color-text-secondary)',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {item.status === 'transferring'
                            ? `${formatBytes(item.bytesTransferred)} / ${formatBytes(item.size)} · ${formatSpeed(item.speed)}`
                            : `${formatBytes(item.size)} • Sent`}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

    </motion.div>
  );
};
