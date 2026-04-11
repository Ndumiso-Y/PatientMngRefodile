/**
 * Practice Intelligence: Workflow Automation Engine
 * 
 * Drives clinical and operational behavior based on patient state.
 */

export const processWorkflows = (patient) => {
  const tags = [];
  const tasks = [];

  // Workflow 1: Chronic Condition Care
  if (patient.condDiabetes) {
    tags.push({ text: 'Diabetes Care', color: 'bg-blue-100 text-blue-700' });
    tasks.push({ 
      title: 'Review blood sugar stability', 
      priority: 'Medium',
      category: 'Clinical'
    });
  }

  if (patient.condHighBloodPressure) {
    tags.push({ text: 'Hypertension', color: 'bg-orange-100 text-orange-700' });
    tasks.push({ 
      title: 'Check BP before local anesthetic', 
      priority: 'High',
      category: 'Clinical'
    });
  }

  // Workflow 2: Administrative Readiness
  if (!patient.medAidMemberNum && patient.medAidName) {
    tags.push({ text: 'Incomplete Billing', color: 'bg-red-100 text-red-700' });
    tasks.push({ 
      title: 'Capture missing Medical Aid number', 
      priority: 'High',
      category: 'Admin'
    });
  }

  // Workflow 3: Pediatric Engagement
  if (patient.age < 12) {
    tags.push({ text: 'Pediatric', color: 'bg-purple-100 text-purple-700' });
    tasks.push({ 
      title: 'Discuss fissure sealants with parent', 
      priority: 'Low',
      category: 'Clinical'
    });
  }

  // Workflow 4: Retention (Mocking missed appointments for now)
  if (patient.name === 'Sarah Khumalo') { // Mocking for demo
    tags.push({ text: 'Repeat No-Show', color: 'bg-gray-100 text-gray-700 font-bold' });
    tasks.push({ 
      title: 'Call to confirm next visit (High risk of no-show)', 
      priority: 'High',
      category: 'Retention'
    });
  }

  return { tags, tasks };
};
