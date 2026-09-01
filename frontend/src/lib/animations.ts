// Animation variants for Framer Motion

export const fadeIn = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 0.3 }
    }
};

export const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94] as const
        }
    }
};

export const fadeInDown = {
    hidden: { opacity: 0, y: -20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94] as const
        }
    }
};

export const fadeInLeft = {
    hidden: { opacity: 0, x: -20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94]
        }
    }
};

export const fadeInRight = {
    hidden: { opacity: 0, x: 20 },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94]
        }
    }
};

export const scaleIn = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.3,
            ease: [0.25, 0.46, 0.45, 0.94]
        }
    }
};

export const scaleInBounce = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.5,
            type: "spring",
            stiffness: 300,
            damping: 20
        }
    }
};

export const slideInLeft = {
    hidden: { x: '-100%', opacity: 0 },
    visible: {
        x: 0,
        opacity: 1,
        transition: {
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94]
        }
    },
    exit: {
        x: '-100%',
        opacity: 0,
        transition: { duration: 0.3 }
    }
};

export const slideInRight = {
    hidden: { x: '100%', opacity: 0 },
    visible: {
        x: 0,
        opacity: 1,
        transition: {
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94]
        }
    },
    exit: {
        x: '100%',
        opacity: 0,
        transition: { duration: 0.3 }
    }
};

export const slideInUp = {
    hidden: { y: '100%', opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94]
        }
    },
    exit: {
        y: '100%',
        opacity: 0,
        transition: { duration: 0.3 }
    }
};

export const slideInDown = {
    hidden: { y: '-100%', opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94]
        }
    },
    exit: {
        y: '-100%',
        opacity: 0,
        transition: { duration: 0.3 }
    }
};

// Page transition variants
export const pageTransition = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94]
        }
    },
    exit: {
        opacity: 0,
        y: -20,
        transition: { duration: 0.3 }
    }
};

export const pageSlideTransition = {
    hidden: { opacity: 0, x: 50 },
    visible: {
        opacity: 1,
        x: 0,
        transition: {
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94]
        }
    },
    exit: {
        opacity: 0,
        x: -50,
        transition: { duration: 0.3 }
    }
};

// Stagger children animations
export const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1
        }
    }
};

export const staggerItem = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94] as const
        }
    }
};

// Button hover animations
export const buttonHover = {
    scale: 1.05,
    transition: {
        duration: 0.2,
        ease: "easeInOut"
    }
};

export const buttonTap = {
    scale: 0.95,
    transition: {
        duration: 0.1,
        ease: "easeInOut"
    }
};

// Card hover animations
export const cardHover = {
    y: -5,
    boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    transition: {
        duration: 0.3,
        ease: [0.25, 0.46, 0.45, 0.94]
    }
};

// Modal animations
export const modalBackdrop = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 0.2 }
    },
    exit: {
        opacity: 0,
        transition: { duration: 0.2 }
    }
};

export const modalContent = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            duration: 0.3,
            ease: [0.25, 0.46, 0.45, 0.94]
        }
    },
    exit: {
        opacity: 0,
        scale: 0.95,
        y: 20,
        transition: { duration: 0.2 }
    }
};

// Notification animations
export const notificationSlideIn = {
    hidden: { x: '100%', opacity: 0 },
    visible: {
        x: 0,
        opacity: 1,
        transition: {
            duration: 0.3,
            type: "spring",
            stiffness: 300,
            damping: 30
        }
    },
    exit: {
        x: '100%',
        opacity: 0,
        transition: { duration: 0.2 }
    }
};

// Loading animations
export const pulseAnimation = {
    scale: [1, 1.05, 1],
    opacity: [0.7, 1, 0.7],
    transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
    }
};

export const spinAnimation = {
    rotate: 360,
    transition: {
        duration: 1,
        repeat: Infinity,
        ease: "linear"
    }
};

// Scroll reveal animation
export const scrollReveal = {
    hidden: { opacity: 0, y: 50 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            ease: [0.25, 0.46, 0.45, 0.94]
        }
    }
};

// Navigation animations
export const navItemHover = {
    x: 5,
    transition: {
        duration: 0.2,
        ease: "easeInOut"
    }
};

// Custom spring presets
export const springPresets = {
    gentle: { type: "spring", stiffness: 120, damping: 14 },
    bouncy: { type: "spring", stiffness: 300, damping: 20 },
    snappy: { type: "spring", stiffness: 400, damping: 30 },
    smooth: { type: "spring", stiffness: 200, damping: 25 }
};

// Ease presets
export const easePresets = {
    easeInOut: [0.42, 0, 0.58, 1],
    easeOut: [0.25, 0.46, 0.45, 0.94],
    easeIn: [0.42, 0, 1, 1],
    smooth: [0.25, 0.46, 0.45, 0.94]
};
