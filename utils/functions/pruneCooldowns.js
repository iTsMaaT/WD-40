/**
 * Removes users from a cooldown map whose cooldowns have all expired.
 * @param {Map<string, Record<string, number>>} cooldowns
 */
export default function pruneCooldowns(cooldowns) {
    const now = Date.now();
    for (const [userId, entries] of cooldowns) {
        if (Object.values(entries).every(expiry => expiry <= now))
            cooldowns.delete(userId);
    }
};
