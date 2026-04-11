/**
 * Practice Intelligence: Risk Scoring Engine
 * 
 * Calculates clinical risk based on:
 * - Age (>65 or <12)
 * - Chronic conditions (Diabetes, Cardiac, etc.)
 * - Recent history
 * - Incomplete critical data
 */

export const calculateRiskScore = (patientData) => {
  let score = 0;
  const flags = [];

  // 1. Age Factor
  if (patientData.age > 65) {
    score += 2;
    flags.push('Senior Patient (>65)');
  } else if (patientData.age < 12) {
    score += 1;
    flags.push('Pediatric Patient (<12)');
  }

  // 2. Chronic Conditions (Highest impact)
  if (patientData.condCardiac) {
    score += 4;
    flags.push('Cardiac Condition');
  }
  if (patientData.condDiabetes) {
    score += 3;
    flags.push('Diabetic');
  }
  if (patientData.condHighBloodPressure) {
    score += 3;
    flags.push('Hypertension');
  }
  if (patientData.condAsthma) {
    score += 2;
    flags.push('Asthma');
  }
  if (patientData.condEpilepsy) {
    score += 3;
    flags.push('Epilepsy');
  }

  // 3. Current State
  if (patientData.allergies) {
    score += 3;
    flags.push(`ALLERGIC: ${patientData.allergiesDetails || 'Unspecified'}`);
  }
  if (patientData.pregnant) {
    score += 3;
    flags.push('Pregnant');
  }
  if (patientData.takingMedication) {
    score += 1;
    flags.push('On Medication');
  }

  // 4. Record Integrity
  if (!patientData.idNumber || !patientData.cellNumber) {
    score += 1;
    flags.push('Incomplete Basic Info');
  }

  // Determine Level
  let level = 'LOW';
  let color = 'text-green-600 bg-green-50';
  
  if (score >= 7) {
    level = 'HIGH';
    color = 'text-red-600 bg-red-50 border-red-100';
  } else if (score >= 3) {
    level = 'MEDIUM';
    color = 'text-orange-600 bg-orange-50 border-orange-100';
  }

  return {
    score,
    level,
    color,
    flags
  };
};

export const getSuggestedActions = (risk) => {
  const actions = [];
  
  if (risk.level === 'HIGH') {
    actions.push('Consult physician before major procedures');
    actions.push('Require pre-treatment antibiotic prophylaxis if indicated');
    actions.push('Keep emergency oxygen & glucose nearby');
  }
  
  if (risk.flags.includes('Diabetic')) {
    actions.push('Ensure patient has eaten before treatment');
    actions.push('Schedule early morning appointments');
  }
  
  if (risk.level === 'MEDIUM') {
    actions.push('Monitor vital signs during procedure');
    actions.push('Review medication list for interactions');
  }

  if (actions.length === 0) {
    actions.push('Routine clinical protocols apply');
  }

  return actions;
};
