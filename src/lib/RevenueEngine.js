/**
 * Practice Intelligence: Revenue Engine
 * 
 * Analyzes billing potential, identifies missed revenue, 
 * and validates medical aid claims.
 */

export const calculateRevenueStats = (patients = []) => {
  // Mock logic for demo purposes
  const outstandingClaims = 12540.50;
  const missedRevenue = 4800.00; // From missed appointments
  const potentialRecallRevenue = 15200.00; // From patients due for checkups
  const rejectedClaimsCount = 3;

  return {
    outstandingClaims,
    missedRevenue,
    potentialRecallRevenue,
    rejectedClaimsCount,
    totalAtRisk: outstandingClaims + missedRevenue
  };
};

export const validateClaim = (medAidData) => {
  const errors = [];
  
  // Rule 1: Member Number length
  if (medAidData.medAidMemberNum && medAidData.medAidMemberNum.length < 5) {
    errors.push('Medical Aid number seems too short (potential rejection)');
  }

  // Rule 2: Missing Plan
  if (medAidData.medAidName && !medAidData.medAidPlan) {
    errors.push('Missing Plan Type (required for claim processing)');
  }

  // Rule 3: Discovery Health prefix check
  if (medAidData.medAidName?.toLowerCase().includes('discovery')) {
    if (medAidData.medAidMemberNum && !/^\d+$/.test(medAidData.medAidMemberNum)) {
      errors.push('Discovery numbers must be purely numeric');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const getRecallList = (patients) => {
  // Mock data for demo
  return [
    { name: 'Anna Muller', lastVisit: '07 Oct 2025', dueSince: '07 Apr 2026', potentialRevenue: 'R 850' },
    { name: 'Tshepo Moeketsi', lastVisit: '06 Oct 2025', dueSince: '06 Apr 2026', potentialRevenue: 'R 1,200' }
  ];
};
