import { motion, type Variants } from 'framer-motion';

interface MascotSceneProps {
  celebrating?: boolean;
}

/* ─── Shared animation variants ─── */
const celebrateJump: Variants = {
  idle: { y: 0, rotate: 0 },
  celebrate: {
    y: [0, -30, 0, -15, 0],
    rotate: [0, -10, 10, -5, 0],
    transition: { duration: 0.8, ease: 'easeInOut' },
  },
};

const sparkleParticles = Array.from({ length: 18 }, (_, index) => {
  const angle = (index * 360) / 18;

  return {
    angle,
    distance: 60 + ((index * 37) % 81),
    size: 4 + ((index * 11) % 7),
    duration: 0.8 + ((index * 7) % 5) * 0.1,
    delay: ((index * 13) % 4) * 0.1,
  };
});

/* ─── Sparkle particles for celebrate state ─── */
function Sparkles() {
  const colors = ['#FF8C42', '#3B82F6', '#FBBF24', '#8B5CF6', '#10B981'];
  return (
    <>
      {sparkleParticles.map((particle, i) => {
        const { angle, distance, size, duration, delay } = particle;
        const rad = (angle * Math.PI) / 180;
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: size,
              height: size,
              backgroundColor: colors[i % colors.length],
              left: '50%',
              top: '50%',
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos(rad) * distance,
              y: Math.sin(rad) * distance,
              opacity: 0,
              scale: 0,
            }}
            transition={{
              duration,
              delay,
              ease: 'easeOut',
            }}
          />
        );
      })}
    </>
  );
}

/* ═══════════════════════════════════════════
   CLOCKY — Orange clock mascot
   ═══════════════════════════════════════════ */
function Clocky({ celebrating }: { celebrating: boolean }) {
  return (
    <motion.div
      className="relative"
      variants={celebrateJump}
      animate={celebrating ? 'celebrate' : 'idle'}
    >
      <motion.div
        animate={celebrating ? {} : { y: [0, -6, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg width="100" height="120" viewBox="0 0 100 120" fill="none">
          {/* Body / Clock face */}
          <circle cx="50" cy="48" r="36" fill="#FF8C42" />
          <circle cx="50" cy="48" r="30" fill="white" />

          {/* Clock face details */}
          {[0, 90, 180, 270].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            return (
              <line
                key={angle}
                x1={50 + 22 * Math.sin(rad)}
                y1={48 - 22 * Math.cos(rad)}
                x2={50 + 26 * Math.sin(rad)}
                y2={48 - 26 * Math.cos(rad)}
                stroke="#FF8C42"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            );
          })}

          {/* Hour hand */}
          <motion.line
            x1="50" y1="48" x2="50" y2="30"
            stroke="#FF8C42" strokeWidth="3" strokeLinecap="round"
            style={{ transformOrigin: '50px 48px' }}
            animate={celebrating
              ? { rotate: [0, 360] }
              : { rotate: [0, 30, 0] }
            }
            transition={celebrating
              ? { duration: 0.6, repeat: 2, ease: 'linear' }
              : { duration: 4, repeat: Infinity, ease: 'easeInOut' }
            }
          />

          {/* Minute hand */}
          <motion.line
            x1="50" y1="48" x2="62" y2="40"
            stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"
            style={{ transformOrigin: '50px 48px' }}
            animate={celebrating
              ? { rotate: [0, 720] }
              : { rotate: [0, 60, 0] }
            }
            transition={celebrating
              ? { duration: 0.6, repeat: 2, ease: 'linear' }
              : { duration: 3, repeat: Infinity, ease: 'easeInOut' }
            }
          />

          {/* Center dot */}
          <circle cx="50" cy="48" r="3" fill="#FF8C42" />

          {/* Eyes */}
          <motion.ellipse
            cx="40" cy="44" rx="3" ry="3.5"
            fill="#1E293B"
            animate={celebrating ? { scaleY: [1, 0.2, 1] } : {}}
            transition={{ duration: 0.3, repeat: celebrating ? 3 : 0 }}
          />
          <motion.ellipse
            cx="60" cy="44" rx="3" ry="3.5"
            fill="#1E293B"
            animate={celebrating ? { scaleY: [1, 0.2, 1] } : {}}
            transition={{ duration: 0.3, repeat: celebrating ? 3 : 0 }}
          />
          {/* Eye highlights */}
          <circle cx="41.5" cy="42.5" r="1" fill="white" />
          <circle cx="61.5" cy="42.5" r="1" fill="white" />

          {/* Smile */}
          <motion.path
            d={celebrating ? "M 40 54 Q 50 64 60 54" : "M 42 53 Q 50 59 58 53"}
            stroke="#1E293B"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />

          {/* Legs */}
          <motion.rect
            x="38" y="82" width="8" height="14" rx="4" fill="#FF8C42"
            animate={celebrating
              ? { rotate: [0, -15, 15, 0] }
              : { rotate: [0, -5, 5, 0] }
            }
            transition={{ duration: celebrating ? 0.4 : 2, repeat: Infinity }}
            style={{ transformOrigin: '42px 82px' }}
          />
          <motion.rect
            x="54" y="82" width="8" height="14" rx="4" fill="#FF8C42"
            animate={celebrating
              ? { rotate: [0, 15, -15, 0] }
              : { rotate: [0, 5, -5, 0] }
            }
            transition={{ duration: celebrating ? 0.4 : 2, repeat: Infinity, delay: 0.1 }}
            style={{ transformOrigin: '58px 82px' }}
          />

          {/* Feet */}
          <ellipse cx="42" cy="98" rx="8" ry="4" fill="#E97320" />
          <ellipse cx="58" cy="98" rx="8" ry="4" fill="#E97320" />

          {/* Clock bell on top */}
          <circle cx="50" cy="10" r="5" fill="#FFD700" stroke="#E5A800" strokeWidth="1.5" />
          <rect x="48" y="8" width="4" height="8" fill="#FF8C42" rx="2" />
        </svg>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   RUNNY — Blue running shoe mascot
   ═══════════════════════════════════════════ */
function Runny({ celebrating }: { celebrating: boolean }) {
  return (
    <motion.div
      className="relative"
      variants={celebrateJump}
      animate={celebrating ? 'celebrate' : 'idle'}
    >
      <motion.div
        animate={celebrating ? {} : { x: [0, 8, 0, -8, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg width="110" height="90" viewBox="0 0 110 90" fill="none">
          {/* Shoe body */}
          <path
            d="M 15 45 Q 10 25 35 20 Q 60 15 80 25 Q 100 35 95 50 Q 90 65 70 65 L 20 65 Q 10 65 15 45 Z"
            fill="#3B82F6"
          />
          {/* Sole */}
          <path
            d="M 12 62 Q 10 70 20 72 L 85 72 Q 98 72 98 65 Q 95 58 85 60 L 20 60 Q 12 60 12 62 Z"
            fill="#1E40AF"
          />
          {/* Sole treads */}
          <rect x="25" y="68" width="10" height="3" rx="1" fill="#1E3A8A" />
          <rect x="40" y="68" width="10" height="3" rx="1" fill="#1E3A8A" />
          <rect x="55" y="68" width="10" height="3" rx="1" fill="#1E3A8A" />
          <rect x="70" y="68" width="10" height="3" rx="1" fill="#1E3A8A" />

          {/* Shoe tongue */}
          <path d="M 40 22 Q 45 10 55 15 Q 60 18 55 25" fill="#60A5FA" />

          {/* Laces */}
          <line x1="38" y1="30" x2="55" y2="28" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <line x1="36" y1="38" x2="53" y2="36" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <line x1="34" y1="46" x2="51" y2="44" stroke="white" strokeWidth="2" strokeLinecap="round" />

          {/* Nike-style swoosh */}
          <path
            d="M 25 50 Q 50 55 80 35"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />

          {/* Eyes */}
          <motion.ellipse
            cx="55" cy="35" rx="4" ry="4.5"
            fill="white"
            animate={celebrating ? { scaleY: [1, 0.2, 1] } : {}}
            transition={{ duration: 0.3, repeat: celebrating ? 3 : 0 }}
          />
          <circle cx="56" cy="34" r="2" fill="#1E293B" />
          <circle cx="57" cy="33" r="0.8" fill="white" />

          <motion.ellipse
            cx="72" cy="32" rx="4" ry="4.5"
            fill="white"
            animate={celebrating ? { scaleY: [1, 0.2, 1] } : {}}
            transition={{ duration: 0.3, repeat: celebrating ? 3 : 0 }}
          />
          <circle cx="73" cy="31" r="2" fill="#1E293B" />
          <circle cx="74" cy="30" r="0.8" fill="white" />

          {/* Smile */}
          <motion.path
            d={celebrating ? "M 55 42 Q 63 52 72 42" : "M 58 42 Q 63 47 70 42"}
            stroke="#1E293B"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />

          {/* Speed lines */}
          <motion.g
            animate={celebrating ? { opacity: 1 } : { opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <line x1="5" y1="35" x2="12" y2="35" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" />
            <line x1="2" y1="45" x2="10" y2="45" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" />
            <line x1="5" y1="55" x2="12" y2="55" stroke="#93C5FD" strokeWidth="2" strokeLinecap="round" />
          </motion.g>
        </svg>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   COACH BOT — Robot coach mascot
   ═══════════════════════════════════════════ */
function CoachBot({ celebrating }: { celebrating: boolean }) {
  return (
    <motion.div
      className="relative"
      variants={celebrateJump}
      animate={celebrating ? 'celebrate' : 'idle'}
    >
      <motion.div
        animate={celebrating ? {} : { rotate: [0, 3, -3, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <svg width="90" height="115" viewBox="0 0 90 115" fill="none">
          {/* Antenna */}
          <line x1="45" y1="5" x2="45" y2="18" stroke="#9CA3AF" strokeWidth="2.5" />
          <motion.circle
            cx="45" cy="5" r="4"
            fill="#10B981"
            animate={celebrating
              ? { fill: ['#10B981', '#FBBF24', '#FF8C42', '#10B981'] }
              : { opacity: [0.5, 1, 0.5] }
            }
            transition={{ duration: celebrating ? 0.5 : 2, repeat: Infinity }}
          />

          {/* Head */}
          <rect x="18" y="18" width="54" height="42" rx="12" fill="#6B7280" />
          <rect x="22" y="22" width="46" height="34" rx="8" fill="#9CA3AF" />

          {/* Eyes — LED style */}
          <motion.rect
            x="30" y="30" width="10" height="10" rx="2"
            fill={celebrating ? '#10B981' : '#3B82F6'}
            animate={celebrating
              ? { fill: ['#10B981', '#FBBF24', '#10B981'], scaleY: [1, 0.3, 1] }
              : { opacity: [0.7, 1, 0.7] }
            }
            transition={{ duration: celebrating ? 0.4 : 1.5, repeat: Infinity }}
          />
          <motion.rect
            x="50" y="30" width="10" height="10" rx="2"
            fill={celebrating ? '#10B981' : '#3B82F6'}
            animate={celebrating
              ? { fill: ['#10B981', '#FBBF24', '#10B981'], scaleY: [1, 0.3, 1] }
              : { opacity: [0.7, 1, 0.7] }
            }
            transition={{ duration: celebrating ? 0.4 : 1.5, repeat: Infinity, delay: 0.1 }}
          />

          {/* Mouth — LED grid */}
          <motion.path
            d={celebrating ? "M 33 47 Q 45 57 57 47" : "M 35 48 L 55 48"}
            stroke={celebrating ? '#10B981' : '#3B82F6'}
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Body */}
          <rect x="25" y="62" width="40" height="28" rx="8" fill="#6B7280" />

          {/* Chest badge */}
          <circle cx="45" cy="73" r="7" fill="#4B5563" stroke="#9CA3AF" strokeWidth="1" />
          <motion.circle
            cx="45" cy="73" r="4"
            fill="#3B82F6"
            animate={celebrating
              ? { fill: ['#3B82F6', '#FF8C42', '#FBBF24', '#3B82F6'], scale: [1, 1.3, 1] }
              : { opacity: [0.6, 1, 0.6] }
            }
            transition={{ duration: celebrating ? 0.6 : 2, repeat: Infinity }}
          />

          {/* Whistle */}
          <motion.g
            animate={celebrating ? { rotate: [0, -20, 20, 0] } : { y: [0, -2, 0] }}
            transition={{ duration: celebrating ? 0.3 : 2, repeat: Infinity }}
            style={{ transformOrigin: '72px 55px' }}
          >
            <circle cx="78" cy="52" r="6" fill="#FBBF24" />
            <rect x="68" y="50" width="12" height="4" rx="2" fill="#FBBF24" />
            <circle cx="78" cy="52" r="2" fill="#F59E0B" />
          </motion.g>

          {/* Arms */}
          <motion.rect
            x="8" y="65" width="14" height="6" rx="3" fill="#9CA3AF"
            animate={celebrating
              ? { rotate: [0, -30, 30, 0], y: [0, -10, 0] }
              : { rotate: [0, -5, 0] }
            }
            transition={{ duration: celebrating ? 0.5 : 2, repeat: Infinity }}
            style={{ transformOrigin: '22px 68px' }}
          />
          <motion.rect
            x="68" y="65" width="14" height="6" rx="3" fill="#9CA3AF"
            animate={celebrating
              ? { rotate: [0, 30, -30, 0], y: [0, -10, 0] }
              : { rotate: [0, 5, 0] }
            }
            transition={{ duration: celebrating ? 0.5 : 2, repeat: Infinity, delay: 0.15 }}
            style={{ transformOrigin: '68px 68px' }}
          />

          {/* Legs */}
          <rect x="32" y="90" width="8" height="16" rx="4" fill="#4B5563" />
          <rect x="50" y="90" width="8" height="16" rx="4" fill="#4B5563" />
          {/* Feet */}
          <ellipse cx="36" cy="108" rx="8" ry="4" fill="#374151" />
          <ellipse cx="54" cy="108" rx="8" ry="4" fill="#374151" />
        </svg>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   STAR — Yellow energy star mascot
   ═══════════════════════════════════════════ */
function Star({ celebrating }: { celebrating: boolean }) {
  // 5-point star path
  const starPath = 'M 45 5 L 53 30 L 80 30 L 58 48 L 66 75 L 45 58 L 24 75 L 32 48 L 10 30 L 37 30 Z';

  return (
    <motion.div
      className="relative"
      variants={celebrateJump}
      animate={celebrating ? 'celebrate' : 'idle'}
    >
      <motion.div
        animate={celebrating
          ? { rotate: [0, 360], scale: [1, 1.2, 1] }
          : { scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }
        }
        transition={{
          duration: celebrating ? 0.8 : 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <svg width="90" height="100" viewBox="0 0 90 100" fill="none">
          {/* Glow effect */}
          <motion.path
            d={starPath}
            fill="#FBBF24"
            opacity={0.3}
            animate={celebrating
              ? { scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }
              : { scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }
            }
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ transformOrigin: '45px 40px' }}
          />

          {/* Star body */}
          <path d={starPath} fill="#FBBF24" stroke="#F59E0B" strokeWidth="2" />

          {/* Sunglasses */}
          <rect x="30" y="30" width="12" height="9" rx="3" fill="#1E293B" />
          <rect x="48" y="30" width="12" height="9" rx="3" fill="#1E293B" />
          <line x1="42" y1="34" x2="48" y2="34" stroke="#1E293B" strokeWidth="2" />
          {/* Glasses shine */}
          <rect x="32" y="32" width="4" height="2" rx="1" fill="#475569" opacity="0.5" />
          <rect x="50" y="32" width="4" height="2" rx="1" fill="#475569" opacity="0.5" />

          {/* Smile */}
          <motion.path
            d={celebrating ? "M 37 44 Q 45 54 53 44" : "M 39 44 Q 45 50 51 44"}
            stroke="#92400E"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />

          {/* Small arms */}
          <motion.line
            x1="15" y1="38" x2="8" y2="30"
            stroke="#F59E0B" strokeWidth="3" strokeLinecap="round"
            animate={celebrating
              ? { rotate: [0, -30, 30, 0] }
              : { rotate: [0, -10, 0] }
            }
            transition={{ duration: celebrating ? 0.4 : 2, repeat: Infinity }}
            style={{ transformOrigin: '15px 38px' }}
          />
          <motion.line
            x1="75" y1="38" x2="82" y2="30"
            stroke="#F59E0B" strokeWidth="3" strokeLinecap="round"
            animate={celebrating
              ? { rotate: [0, 30, -30, 0] }
              : { rotate: [0, 10, 0] }
            }
            transition={{ duration: celebrating ? 0.4 : 2, repeat: Infinity }}
            style={{ transformOrigin: '75px 38px' }}
          />

          {/* Tiny legs */}
          <motion.rect
            x="38" y="72" width="6" height="12" rx="3" fill="#F59E0B"
            animate={celebrating ? { rotate: [0, -15, 15, 0] } : {}}
            transition={{ duration: 0.4, repeat: celebrating ? Infinity : 0 }}
            style={{ transformOrigin: '41px 72px' }}
          />
          <motion.rect
            x="48" y="72" width="6" height="12" rx="3" fill="#F59E0B"
            animate={celebrating ? { rotate: [0, 15, -15, 0] } : {}}
            transition={{ duration: 0.4, repeat: celebrating ? Infinity : 0 }}
            style={{ transformOrigin: '51px 72px' }}
          />
          <ellipse cx="41" cy="86" rx="6" ry="3" fill="#D97706" />
          <ellipse cx="51" cy="86" rx="6" ry="3" fill="#D97706" />
        </svg>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   MAIN SCENE — Layout of all mascots
   ═══════════════════════════════════════════ */
export function MascotScene({ celebrating = false }: MascotSceneProps) {
  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full select-none">
      {/* Title */}
      <motion.div
        className="text-center mb-6 lg:mb-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <h2 className="mb-2 text-2xl font-bold lg:text-3xl" aria-label="LifeSync AI">
          <span className="text-[#FF8C42]">LifeSync</span>{' '}
          <span className="text-[#3B82F6]">AI</span>
        </h2>
        <p className="text-sm text-gray-500 lg:text-base">
          Đồng hành cùng công việc và sức khỏe
        </p>
      </motion.div>

      {/* Mascots row */}
      <div className="relative flex items-end justify-center gap-2 lg:gap-4">
        {/* Sparkles overlay when celebrating */}
        {celebrating && <Sparkles />}

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 100 }}
        >
          <Clocky celebrating={celebrating} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 100 }}
          className="self-center"
        >
          <Runny celebrating={celebrating} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, type: 'spring', stiffness: 100 }}
        >
          <CoachBot celebrating={celebrating} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, type: 'spring', stiffness: 100 }}
          className="self-center"
        >
          <Star celebrating={celebrating} />
        </motion.div>
      </div>

      {/* Ground shadow */}
      <motion.div
        className="mascot-ground-shadow w-4/5 max-w-xs mt-2 mx-auto"
        initial={{ opacity: 0, scaleX: 0.5 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
      />
    </div>
  );
}
