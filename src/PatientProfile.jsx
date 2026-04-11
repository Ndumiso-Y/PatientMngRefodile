import React from 'react';
import { 
  ArrowLeft, 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Activity, 
  Shield, 
  AlertTriangle,
  AlertCircle,
  Calendar,
  CalendarDays,
  Stethoscope,
  Activity as RiskIcon,
  Clock,
  Trash2,
  ExternalLink,
  Building2,
  FileText
} from 'lucide-react';
import { calculateRiskScore, getSuggestedActions } from './lib/RiskEngine';

export default function PatientProfile({ patient, treatments = [], onBack }) {
  if (!patient) return null;

  // Mock patient data for clinical demonstrations
  const patientData = {
    ...patient,
    age: patient.age || 45,
    condCardiac: patient.name === 'David Smith',
    condDiabetes: patient.name === 'David Smith',
    condHighBloodPressure: patient.status === 'High Risk',
    allergies: patient.name === 'David Smith' ? 'Penicillin' : 'None Known',
    chronicConditions: patient.name === 'David Smith' ? 'Diabetes Type 2, Hypertension' : 'N/A',
    lastVisit: '15 Jan 2026',
    registeredDate: '10 Apr 2026',
    address: '123 Rustenburg St, North West',
    email: `${patient.name.toLowerCase().replace(' ', '.')}@example.com`,
    phone: '+27 72 000 1234'
  };

  const risk = calculateRiskScore(patientData);
  const suggestions = getSuggestedActions(risk);

  const plannedTreatments = treatments.filter(t => t.status !== 'Completed' && t.status !== 'Cancelled');
  const completedTreatments = treatments.filter(t => t.status === 'Completed');

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-medical-grey hover:text-primary font-bold text-xs uppercase tracking-widest transition-all">
          <ArrowLeft size={16} /> BACK TO DATABASE
        </button>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-medical-dark hover:bg-gray-50 shadow-sm transition-all">
            EDIT PROFILE
          </button>
          <button className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all">
            + NEW TREATMENT PLAN
          </button>
        </div>
      </div>

      {/* Hero Header & Clinical Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Basic ID Card */}
        <div className="lg:col-span-2 card !p-0 overflow-hidden border-t-4 border-t-primary">
          <div className="p-8 flex items-start gap-8">
            <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center text-primary text-3xl font-black shadow-inner">
              {patient.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-3">
                <h1 className="text-3xl font-black text-medical-dark tracking-tight">{patient.name}</h1>
                <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${patient.status === 'High Risk' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                  {patient.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-y-4 gap-x-12">
                <ProfileStat icon={<User size={14}/>} label="Patient ID" value={patient.id} />
                <ProfileStat icon={<CalendarDays size={14}/>} label="Pending Care" value={`${plannedTreatments.length} Items`} />
                <ProfileStat icon={<Phone size={14}/>} label="Contact" value={patientData.phone} />
                <ProfileStat icon={<Mail size={14}/>} label="Email" value={patientData.email} />
              </div>
            </div>
          </div>
        </div>

        {/* Clinical Risk Summary */}
        <div className={`card border-l-8 ${risk.level === 'HIGH' ? 'border-l-red-500 bg-red-50/20' : 'border-l-primary bg-primary/5'}`}>
          <div className="flex items-center justify-between mb-4">
             <p className="text-[10px] font-black text-medical-grey uppercase tracking-widest">Clinical Pulse</p>
             <RiskIcon size={16} className={risk.level === 'HIGH' ? 'text-red-500' : 'text-primary'} />
          </div>
          <div className="mb-4">
            <h2 className={`text-4xl font-black ${risk.level === 'HIGH' ? 'text-red-600' : 'text-primary'}`}>{risk.level}</h2>
            <p className="text-[10px] font-bold text-medical-grey uppercase tracking-tighter">Auto-calculated risk score: {risk.score}/20</p>
          </div>
          <div className="space-y-2">
            {suggestions.slice(0, 2).map((s, i) => (
              <p key={i} className="text-[10px] font-medium text-medical-dark flex gap-2">
                <div className="w-1 h-1 rounded-full bg-medical-grey mt-1.5" /> {s}
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Records Area */}
        <div className="lg:col-span-3 space-y-8">
          
          {/* Section: ACTIVE TREATMENT PLAN */}
          <div className="card border-2 border-primary/10">
            <div className="flex items-center justify-between mb-8 border-b pb-4">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                   <Calendar size={18} />
                 </div>
                 <h3 className="font-black text-medical-dark uppercase tracking-tight">Active Treatment Plan</h3>
               </div>
               <span className="px-3 py-1 bg-primary/5 text-primary text-[10px] font-black rounded-lg uppercase tracking-widest">PROACTIVE CARE</span>
            </div>

            <div className="space-y-4">
              {plannedTreatments.length === 0 ? (
                <div className="p-10 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
                  <p className="text-medical-grey font-bold text-[10px] uppercase">No pending treatment planned</p>
                </div>
              ) : (
                plannedTreatments.map((treatment) => (
                  <TreatmentEntry key={treatment.id} treatment={treatment} isPlan />
                ))
              )}
            </div>
          </div>

          {/* Section: LONGITUDINAL HISTORY */}
          <div className="card">
            <div className="flex items-center justify-between mb-8 border-b pb-4">
               <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-gray-100 text-medical-grey flex items-center justify-center">
                   <FileText size={18} />
                 </div>
                 <h3 className="font-black text-medical-dark uppercase tracking-tight">Clinical History</h3>
               </div>
               <p className="text-[10px] font-black text-medical-grey uppercase tracking-widest">{completedTreatments.length} Completed Records</p>
            </div>

            <div className="space-y-4 opacity-70 grayscale-[0.5] hover:opacity-100 hover:grayscale-0 transition-all">
              {completedTreatments.length === 0 ? (
                <p className="p-10 text-center text-[10px] font-bold text-medical-grey uppercase">No completed history</p>
              ) : (
                completedTreatments.slice().reverse().map((treatment) => (
                  <TreatmentEntry key={treatment.id} treatment={treatment} />
                ))
              )}
            </div>
          </div>
          
          {/* Section: Medical Intelligence */}
          <div className="card">
            <div className="flex items-center gap-3 mb-8 border-b pb-4">
               <div className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center">
                 <AlertTriangle size={18} />
               </div>
               <h3 className="font-black text-medical-dark uppercase tracking-tight">Clinical Alerts & History</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <HistoryBlock label="Allergies" value={patientData.allergies} critical={patientData.allergies !== 'None Known'} />
               <HistoryBlock label="Chronic Conditions" value={patientData.chronicConditions} critical={patientData.condCardiac || patientData.condDiabetes} />
               <HistoryBlock label="Take Medication" value="Yes - Metformin, Lisinopril" />
               <HistoryBlock label="Surgical History" value="None reported" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Section: Insurance */}
            <div className="card">
              <div className="flex items-center gap-3 mb-6 border-b pb-4">
                <Shield size={18} className="text-secondary" />
                <h3 className="font-bold text-medical-dark uppercase text-sm tracking-tight">Financial & Insurance</h3>
              </div>
              <div className="space-y-4">
                <DataField label="Provider" value="Discovery Health" />
                <DataField label="Plan Type" value="Classic Saver (Managed)" />
                <DataField label="Member Number" value="0988772211" />
                <DataField label="Dependant ID" value="00" />
              </div>
            </div>

            {/* Section: Responsible Person */}
            <div className="card">
              <div className="flex items-center gap-3 mb-6 border-b pb-4">
                <User size={18} className="text-medical-grey" />
                <h3 className="font-bold text-medical-dark uppercase text-sm tracking-tight">Responsible Party</h3>
              </div>
              <div className="space-y-4">
                <DataField label="Full Name" value="Self" />
                <DataField label="Employer" value="Rustenburg Mining Dist." />
                <DataField label="Billing Address" value={patientData.address} />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar: Timeline & Files */}
        <div className="space-y-8">
          {/* Patient Timeline */}
          <div className="card">
            <h3 className="text-[10px] font-black text-medical-grey uppercase tracking-widest mb-6">Patient Journey</h3>
            <div className="space-y-8 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-50">
               <TimelineStep date="Upcoming" title={plannedTreatments[0]?.type || 'No care planned'} type="Plan" active={!!plannedTreatments[0]} />
               <TimelineStep date="Recent" title={completedTreatments[completedTreatments.length - 1]?.type || 'N/A'} type="Completed" />
               <TimelineStep date="10 Apr 2026" title="Initial Registration" type="Entry" />
            </div>
          </div>

          {/* Emergency Block */}
          <div className="card bg-medical-dark text-white border-none shadow-2xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
              <Phone size={64} />
            </div>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-4">Emergency Contact</p>
            <div className="space-y-1 mb-6">
              <p className="text-xl font-bold">Mary Smith</p>
              <p className="text-xs text-gray-400">Spouse</p>
            </div>
            <a href="tel:+27820000000" className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 rounded-xl font-bold text-xs transition-all shadow-lg active:scale-95">
              <Phone size={16} /> CALL NOW
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function TreatmentEntry({ treatment, isPlan = false }) {
  const priorityColors = {
    'High': 'bg-red-50 text-red-600 border-red-100',
    'Medium': 'bg-orange-50 text-orange-600 border-orange-100',
    'Low': 'bg-green-50 text-green-600 border-green-100'
  }

  return (
    <div className={`group border rounded-2xl p-5 transition-all bg-white relative overflow-hidden ${isPlan ? 'border-primary/20 hover:border-primary shadow-sm' : 'border-gray-100 hover:border-gray-200'}`}>
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
        <Building2 size={40} />
      </div>
      <div className="flex flex-col md:flex-row items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <div className="px-2 py-0.5 bg-gray-50 text-medical-grey text-[9px] font-black rounded border border-gray-100 uppercase tracking-widest">
              {treatment.date}
            </div>
            {treatment.priority && (
              <span className={`px-2 py-0.5 rounded text-[9px] font-black border uppercase tracking-widest ${priorityColors[treatment.priority]}`}>
                {treatment.priority} Priority
              </span>
            )}
            <span className="text-[9px] font-bold text-medical-grey uppercase flex items-center gap-1.5 border-l pl-3">
              {treatment.practiceId === 'refodile-main' ? 'Rustenburg' : 'Ortho'}
            </span>
          </div>
          <div>
            <h4 className="text-md font-black text-medical-dark">{treatment.type}</h4>
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{treatment.area}</p>
          </div>
          <p className="text-[11px] text-medical-dark leading-tight italic opacity-70">"{treatment.notes}"</p>
        </div>
        <div className="w-full md:w-auto text-right flex flex-col items-end gap-3">
           <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded border tracking-widest ${isPlan ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
             {treatment.status}
           </span>
           {isPlan && (
             <div className="flex gap-2">
                <button className="px-3 py-1.5 bg-primary text-white text-[9px] font-black rounded-lg uppercase tracking-widest shadow-lg shadow-primary/20">
                  SCHEDULE
                </button>
                <button className="px-3 py-1.5 bg-white border border-gray-200 text-medical-grey text-[9px] font-black rounded-lg uppercase tracking-widest hover:bg-gray-50">
                  COMPLETE
                </button>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}


function ProfileStat({ icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-1 text-primary">{icon}</div>
      <div>
        <p className="text-[9px] font-black text-medical-grey uppercase tracking-tighter mb-0.5">{label}</p>
        <p className="text-xs font-bold text-medical-dark leading-tight">{value}</p>
      </div>
    </div>
  );
}

function HistoryBlock({ label, value, critical = false }) {
  return (
    <div className={`p-5 rounded-2xl border ${critical ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
       <p className="text-[9px] font-black text-medical-grey uppercase tracking-widest mb-2">{label}</p>
       <div className="flex items-center justify-between">
         <p className={`font-bold text-sm ${critical ? 'text-red-700' : 'text-medical-dark'}`}>{value}</p>
         {critical && <AlertCircle size={14} className="text-red-500" />}
       </div>
    </div>
  );
}

function DataField({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
      <span className="text-[10px] font-bold text-medical-grey uppercase tracking-widest">{label}</span>
      <span className="text-[11px] font-bold text-medical-dark">{value}</span>
    </div>
  );
}

function TimelineStep({ date, title, type, active = false }) {
  return (
    <div className="relative pl-8">
      <div className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-4 border-white shadow-sm z-10 ${active ? 'bg-primary' : 'bg-gray-200'}`} />
      <p className="text-[10px] font-black text-medical-grey uppercase tracking-tighter mb-1">{date} <span className="mx-1">•</span> {type}</p>
      <p className={`text-xs font-bold ${active ? 'text-primary' : 'text-medical-dark'}`}>{title}</p>
    </div>
  );
}
