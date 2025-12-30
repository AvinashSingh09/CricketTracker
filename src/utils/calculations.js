/**
 * Format balls bowled into overs notation (e.g., 12 balls = 2.0 overs)
 * @param {number} balls - Total balls bowled
 * @returns {string} Overs in cricket notation (e.g., "2.3")
 */
export function formatOvers(balls) {
    const overs = Math.floor(balls / 6);
    const remainingBalls = balls % 6;
    return `${overs}.${remainingBalls}`;
}

/**
 * Calculate strike rate (runs per 100 balls)
 * @param {number} runs - Runs scored
 * @param {number} balls - Balls faced
 * @returns {string} Strike rate formatted to 1 decimal
 */
export function calculateStrikeRate(runs, balls) {
    if (balls === 0) return '0.0';
    return ((runs / balls) * 100).toFixed(1);
}

/**
 * Calculate economy rate (runs per over)
 * @param {number} runs - Runs conceded
 * @param {number} ballsBowled - Balls bowled
 * @returns {string} Economy rate formatted to 2 decimals
 */
export function calculateEconomyRate(runs, ballsBowled) {
    if (ballsBowled === 0) return '0.00';
    const overs = ballsBowled / 6;
    return (runs / overs).toFixed(2);
}

/**
 * Convert overs limit to total balls
 * @param {number} overs - Number of overs
 * @returns {number} Total balls
 */
export function oversToBalls(overs) {
    return overs * 6;
}

/**
 * Check if an over is complete
 * @param {number} balls - Total balls bowled
 * @returns {boolean} True if current over is complete
 */
export function isOverComplete(balls) {
    return balls > 0 && balls % 6 === 0;
}

/**
 * Get current over number (1-indexed)
 * @param {number} balls - Total balls bowled
 * @returns {number} Current over number
 */
export function getCurrentOver(balls) {
    return Math.floor(balls / 6) + 1;
}

/**
 * Calculate run rate
 * @param {number} runs - Total runs
 * @param {number} balls - Total balls
 * @returns {string} Run rate per over
 */
export function calculateRunRate(runs, balls) {
    if (balls === 0) return '0.00';
    const overs = balls / 6;
    return (runs / overs).toFixed(2);
}

/**
 * Get balls remaining in current over
 * @param {number} balls - Total balls bowled
 * @returns {number} Balls remaining (0-5)
 */
export function getBallsRemainingInOver(balls) {
    return 6 - (balls % 6);
}
