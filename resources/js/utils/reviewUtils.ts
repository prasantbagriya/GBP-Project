/**
 * Safely parse star rating from any format returned by Google Business Profile API or cached DB:
 * - Number: 1, 2, 3, 4, 5
 * - Word string: 'FIVE', 'FOUR', 'THREE', 'TWO', 'ONE'
 * - Digit string: '5', '4', '3', '2', '1'
 * - Prefixed string: 'STAR_RATING_FIVE', 'RATING_5', etc.
 */
export const parseStarRating = (val: any): number => {
  if (val === null || val === undefined) return 5;
  if (typeof val === 'number') {
    if (isNaN(val)) return 5;
    const rounded = Math.round(val);
    return rounded >= 1 && rounded <= 5 ? rounded : 5;
  }
  const str = String(val).trim().toUpperCase();
  if (str === 'FIVE' || str === '5') return 5;
  if (str === 'FOUR' || str === '4') return 4;
  if (str === 'THREE' || str === '3') return 3;
  if (str === 'TWO' || str === '2') return 2;
  if (str === 'ONE' || str === '1') return 1;

  if (str.includes('FIVE') || str.includes('5')) return 5;
  if (str.includes('FOUR') || str.includes('4')) return 4;
  if (str.includes('THREE') || str.includes('3')) return 3;
  if (str.includes('TWO') || str.includes('2')) return 2;
  if (str.includes('ONE') || str.includes('1')) return 1;

  const num = parseInt(str.replace(/[^0-9]/g, ''), 10);
  if (!isNaN(num) && num >= 1 && num <= 5) return num;

  return 5;
};
