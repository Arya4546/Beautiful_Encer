/**
 * OTP Rate Limiter
 * Prevents abuse by limiting OTP generation attempts
 */
class OTPRateLimiter {
    constructor() {
        this.attempts = new Map();
        this.MAX_ATTEMPTS = 5; // Max 5 OTP requests
        this.WINDOW_MS = 15 * 60 * 1000; // 15 minutes
        this.CLEANUP_INTERVAL = 30 * 60 * 1000; // 30 minutes
        // Cleanup old entries periodically
        setInterval(() => this.cleanup(), this.CLEANUP_INTERVAL);
    }
    /**
     * Check if the email can request another OTP
     * @param email - User email
     * @returns { allowed: boolean, remainingAttempts: number, resetTime: number }
     */
    checkLimit(email) {
        const now = Date.now();
        const attempt = this.attempts.get(email);
        if (!attempt) {
            return { allowed: true, remainingAttempts: this.MAX_ATTEMPTS - 1, resetTime: null };
        }
        // Check if window has expired
        if (now - attempt.firstAttemptTime > this.WINDOW_MS) {
            // Reset the attempt
            this.attempts.delete(email);
            return { allowed: true, remainingAttempts: this.MAX_ATTEMPTS - 1, resetTime: null };
        }
        // Check if limit exceeded
        if (attempt.count >= this.MAX_ATTEMPTS) {
            const resetTime = attempt.firstAttemptTime + this.WINDOW_MS;
            return {
                allowed: false,
                remainingAttempts: 0,
                resetTime
            };
        }
        return {
            allowed: true,
            remainingAttempts: this.MAX_ATTEMPTS - attempt.count - 1,
            resetTime: null
        };
    }
    /**
     * Record an OTP attempt
     * @param email - User email
     */
    recordAttempt(email) {
        const now = Date.now();
        const attempt = this.attempts.get(email);
        if (!attempt) {
            this.attempts.set(email, {
                count: 1,
                firstAttemptTime: now,
                lastAttemptTime: now,
            });
        }
        else {
            // Check if window has expired
            if (now - attempt.firstAttemptTime > this.WINDOW_MS) {
                // Reset with new attempt
                this.attempts.set(email, {
                    count: 1,
                    firstAttemptTime: now,
                    lastAttemptTime: now,
                });
            }
            else {
                // Increment count
                this.attempts.set(email, {
                    ...attempt,
                    count: attempt.count + 1,
                    lastAttemptTime: now,
                });
            }
        }
    }
    /**
     * Reset attempts for an email (e.g., after successful verification)
     * @param email - User email
     */
    resetAttempts(email) {
        this.attempts.delete(email);
    }
    /**
     * Clean up expired entries
     */
    cleanup() {
        const now = Date.now();
        const emailsToDelete = [];
        for (const [email, attempt] of this.attempts.entries()) {
            if (now - attempt.lastAttemptTime > this.WINDOW_MS) {
                emailsToDelete.push(email);
            }
        }
        emailsToDelete.forEach(email => this.attempts.delete(email));
        if (emailsToDelete.length > 0) {
            console.log(`[OTPRateLimiter] Cleaned up ${emailsToDelete.length} expired entries`);
        }
    }
    /**
     * Get remaining time until reset (in milliseconds)
     * @param email - User email
     */
    getTimeUntilReset(email) {
        const attempt = this.attempts.get(email);
        if (!attempt)
            return null;
        const resetTime = attempt.firstAttemptTime + this.WINDOW_MS;
        const remaining = resetTime - Date.now();
        return remaining > 0 ? remaining : null;
    }
    /**
     * Format time remaining into human-readable string
     * @param ms - Milliseconds
     */
    formatTimeRemaining(ms) {
        const minutes = Math.ceil(ms / 60000);
        return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
}
export const otpRateLimiter = new OTPRateLimiter();
