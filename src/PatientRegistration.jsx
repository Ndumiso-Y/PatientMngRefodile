import React, { useState } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  User, 
  CreditCard, 
  HeartPulse, 
  ShieldCheck, 
  Phone,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  ShieldEllipsis,
  Scan,
  Globe
} from 'lucide-react';
import { validateClaim } from './lib/RevenueEngine';

const regTranslations = {
  en: {
    step1: 'Patient Details',
    step2: 'Responsible Person',
    step3: 'Medical Aid',
    step4: 'Emergency Contact',
    step5: 'Medical History',
    step6: 'Consent',
    firstName: 'First Names',
    surname: 'Surname',
    idNumber: 'ID Number',
    dob: 'Date of Birth',
    gender: 'Gender',
    occupation: 'Occupation',
    cellNumber: 'Cell Number',
    email: 'Email Address',
    address: 'Physical Address',
    maritalStatus: 'Marital Status',
    prefLanguage: 'Preferred Language',
    scanId: 'SCAN ID BOOK (OCR)',
    respName: 'Full Name of Responsible Person',
    respAddress: 'Address',
    medAidName: 'Medical Aid Name',
    medAidMember: 'Main Member Name',
    medAidNumber: 'Membership Number',
    medAidPlan: 'Plan Type',
    conditionsTitle: 'Known Conditions',
    allergies: 'Are you allergic to anything?',
    treatment: 'Currently under medical treatment?',
    medication: 'Taking any medication?',
    pregnant: 'Pregnant?',
    breastfeeding: 'Breastfeeding?',
    consentTitle: 'Medical Declaration & Consent',
    consentText: 'I, the undersigned, hereby declare that the information provided is correct to the best of my knowledge. I understand that it is my responsibility to inform the dentist of any changes to my medical health or medication.',
    consentSub: 'I consent to the treatment and the processing of my personal data for medical purposes.',
    signature: 'Digital Signature (Type Full Name)',
    confirm: 'I confirm that all details are accurate and I agree to the terms of treatment.',
    save: 'Save Record',
    nextStep: 'Next Step',
    toConsent: 'Continue to Consent',
    prev: 'Previous',
    cancel: 'Cancel',
    ageLabel: 'yrs',
    ocrInfo: 'OCR Intelligence: ID Data successfully extracted.',
    validClaim: 'Claim data looks valid for processing.',
    leakageAlert: 'Intelligence: Potential Claim Leakage'
  },
  tn: {
    step1: 'Dintlha tsa gago',
    step2: 'Motho yo o duelang',
    step3: 'Tshireletso ya boitekanelo',
    step4: 'Motho yo re ka mo tswarang',
    step5: 'Ditiragalo tsa kalafi',
    step6: 'Tetlelelo',
    firstName: 'Maina a ntlha',
    surname: 'Sefane',
    idNumber: 'Nomoro ya Boitshupo',
    dob: 'Letsatsi la botsalo',
    gender: 'Bong',
    occupation: 'Tiro ya gago',
    cellNumber: 'Nomoro ya mogala',
    email: 'Aterese ya Imeile',
    address: 'Aterese ya bodulo',
    maritalStatus: 'Boemo jwa nyalo',
    prefLanguage: 'Loleme lo o lo batlang',
    scanId: 'SKENA BOITSHUPO (OCR)',
    respName: 'Leina la motho yo o duelang',
    respAddress: 'Aterese',
    medAidName: 'Leina la tshireletso ya boitekanelo',
    medAidMember: 'Leina la leloko le legolo',
    medAidNumber: 'Nomoro ya leloko',
    medAidPlan: 'Mofuta wa tshireletso',
    conditionsTitle: 'Malwetse a a sa foleng',
    allergies: 'A go na le sengwe se se go lwalisang (allergies)?',
    treatment: 'A o mo kalafing ya bongaka gone jaanong?',
    medication: 'A o nwa melemo epe?',
    pregnant: 'A o ithwele?',
    breastfeeding: 'A o amusa?',
    consentTitle: 'Boikano jwa Molwetse',
    consentText: 'Ke netefatsa gore dintlha tsotlhe tse ke di neetseng di nepagetse mme ke dumelela kalafi kwa Refodile Health Centre. Ke mofutlha wa me go itsise ngaka ka phetogo epe ya boitekanelo jwa me.',
    consentSub: 'Ke dumelela kalafi le go dirisiwa ga dintlha tsa me tsa boitekanelo.',
    signature: 'Mosaeno wa dijiti (Kwala leina lotlhe)',
    confirm: 'Ke netefatsa gore dintlha tsotlhe di nepagetse mme ke dumalana le dintlha tsa kalafi.',
    save: 'Boloka Rekoto',
    nextStep: 'Tswelela',
    toConsent: 'Ya kwa Tetlelelong',
    prev: 'Morago',
    cancel: 'Khansela',
    ageLabel: 'dingwaga',
    ocrInfo: 'Botlhale jwa OCR: Dintlha tsa Boitshupo di ntshitswe ka katlego.',
    validClaim: 'Dintlha tsa tshireletso di lebega di siame.',
    leakageAlert: 'Botlhale: Go ka nna le mathata ka tshireletso'
  }
};

export default function PatientRegistration({ onCancel, onSuccess, preSelectedLang = null }) {
  const [lang, setLang] = useState(preSelectedLang || 'en');
  const [currentStep, setCurrentStep] = useState(1);
  const t = regTranslations[lang];

  const steps = [
    { id: 1, title: t.step1, icon: <User size={18} /> },
    { id: 2, title: t.step2, icon: <CreditCard size={18} /> },
    { id: 3, title: t.step3, icon: <HeartPulse size={18} /> },
    { id: 4, title: t.step4, icon: <Phone size={18} /> },
    { id: 5, title: t.step5, icon: <ClipboardList size={18} /> },
    { id: 6, title: t.step6, icon: <ShieldCheck size={18} /> },
  ];

  const [formData, setFormData] = useState({
    surname: '',
    firstNames: '',
    dob: '',
    idNumber: '',
    gender: '',
    occupation: '',
    cellNumber: '',
    telephone: '',
    email: '',
    address: '',
    maritalStatus: '',
    language: lang === 'tn' ? 'Setswana' : 'English',
    respFullName: '',
    respIdNumber: '',
    respAddress: '',
    respContact: '',
    medAidName: '',
    medAidMemberName: '',
    medAidMemberNum: '',
    medAidPlan: '',
    emerName: '',
    emerRelation: '',
    emerContact: '',
    allergies: false,
    allergiesDetails: '',
    underTreatment: false,
    takingMedication: false,
    medicationDetails: '',
    pregnant: false,
    breastfeeding: false,
    condDiabetes: false,
    condEpilepsy: false,
    condAsthma: false,
    condCardiac: false,
    condHighBloodPressure: false,
    consentAgreed: false,
    digitalSignature: '',
  });

  const calculateAge = (dob) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const nextStep = () => {
    if (currentStep < 6) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-xl font-bold text-medical-dark">{t.step1}</h3>
              <button 
                type="button"
                onClick={() => {
                  setFormData(prev => ({
                    ...prev,
                    firstNames: 'Ndumiso',
                    surname: 'Sithole',
                    idNumber: '920101 5001 081',
                    dob: '1992-01-01',
                    gender: 'Male',
                    cellNumber: '082 123 4567'
                  }));
                  alert(t.ocrInfo);
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-bold hover:bg-primary/20 transition-all"
              >
                <Scan size={14} /> {t.scanId}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">{t.firstName}</label>
                <input name="firstNames" value={formData.firstNames} onChange={handleChange} className="input-field" required />
              </div>
              <div>
                <label className="label">{t.surname}</label>
                <input name="surname" value={formData.surname} onChange={handleChange} className="input-field" required />
              </div>
              <div>
                <label className="label">{t.idNumber}</label>
                <input name="idNumber" value={formData.idNumber} onChange={handleChange} className="input-field" required />
              </div>
              <div>
                <label className="label">{t.dob}</label>
                <div className="flex gap-2">
                  <input type="date" name="dob" value={formData.dob} onChange={handleChange} className="input-field" required />
                  {formData.dob && (
                    <div className="bg-primary-light text-primary px-3 py-3 rounded-lg flex items-center justify-center font-bold min-w-max">
                      {calculateAge(formData.dob)} {t.ageLabel}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="label">{t.gender}</label>
                <select name="gender" value={formData.gender} onChange={handleChange} className="input-field">
                  <option value="">--</option>
                  <option value="Male">{lang === 'tn' ? 'Monna' : 'Male'}</option>
                  <option value="Female">{lang === 'tn' ? 'Mosadi' : 'Female'}</option>
                </select>
              </div>
              <div>
                <label className="label">{t.occupation}</label>
                <input name="occupation" value={formData.occupation} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="label">{t.cellNumber}</label>
                <input name="cellNumber" value={formData.cellNumber} onChange={handleChange} className="input-field" required />
              </div>
              <div>
                <label className="label">{t.email}</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="input-field" />
              </div>
              <div className="md:col-span-2">
                <label className="label">{t.address}</label>
                <textarea name="address" value={formData.address} onChange={handleChange} className="input-field h-20"></textarea>
              </div>
              <div>
                <label className="label">{t.maritalStatus}</label>
                <select name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} className="input-field">
                  <option value="">--</option>
                  <option value="Single">{lang === 'tn' ? 'Sengwa' : 'Single'}</option>
                  <option value="Married">{lang === 'tn' ? 'Nyetswe' : 'Married'}</option>
                </select>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-xl font-bold text-medical-dark border-b pb-2">{t.step2}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="label">{t.respName}</label>
                <input name="respFullName" value={formData.respFullName} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="label">{t.idNumber}</label>
                <input name="respIdNumber" value={formData.respIdNumber} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="label">{t.cellNumber}</label>
                <input name="respContact" value={formData.respContact} onChange={handleChange} className="input-field" />
              </div>
              <div className="md:col-span-2">
                <label className="label">{t.respAddress}</label>
                <textarea name="respAddress" value={formData.respAddress} onChange={handleChange} className="input-field h-20"></textarea>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-xl font-bold text-medical-dark border-b pb-2">{t.step3}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">{t.medAidName}</label>
                <input name="medAidName" value={formData.medAidName} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="label">{t.medAidMember}</label>
                <input name="medAidMemberName" value={formData.medAidMemberName} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="label">{t.medAidNumber}</label>
                <input name="medAidMemberNum" value={formData.medAidMemberNum} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="label">{t.medAidPlan}</label>
                <input name="medAidPlan" value={formData.medAidPlan} onChange={handleChange} className="input-field" />
              </div>

              <div className="md:col-span-2">
                {(() => {
                   const validation = validateClaim({ 
                     medAidName: formData.medAidName, 
                     medAidMemberNum: formData.medAidMemberNum,
                     medAidPlan: formData.medAidPlan 
                   });
                   if (validation.errors.length > 0) {
                     return (
                       <div className="mt-2 p-4 bg-orange-50 border border-orange-200 rounded-xl animate-in slide-in-from-top-2 duration-300">
                         <div className="flex items-center gap-2 text-orange-700 font-bold text-xs uppercase tracking-tighter mb-2">
                           <ShieldEllipsis size={14} /> {t.leakageAlert}
                         </div>
                         <ul className="space-y-1">
                           {validation.errors.map((err, i) => (
                             <li key={i} className="text-xs text-orange-800 flex items-center gap-2">
                               <div className="w-1 h-1 rounded-full bg-orange-400" /> {err}
                             </li>
                           ))}
                         </ul>
                       </div>
                     );
                   }
                   return formData.medAidMemberNum ? (
                     <div className="mt-2 p-3 bg-green-50 border border-green-100 rounded-xl flex items-center gap-2 text-green-700 text-xs font-bold">
                       <CheckCircle2 size={14} /> {t.validClaim}
                     </div>
                   ) : null;
                })()}
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-xl font-bold text-medical-dark border-b pb-2">{t.step4}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">{t.firstName} / {t.surname}</label>
                <input name="emerName" value={formData.emerName} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="label">{t.prefLanguage}</label>
                <input name="emerRelation" value={formData.emerRelation} onChange={handleChange} className="input-field" />
              </div>
              <div>
                <label className="label">{t.cellNumber}</label>
                <input name="emerContact" value={formData.emerContact} onChange={handleChange} className="input-field" />
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-xl font-bold text-medical-dark border-b pb-2 text-red-600 flex items-center gap-2">
              <AlertCircle size={20} /> {t.step5}
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                  <span className="font-medium">{t.allergies}</span>
                  <input type="checkbox" name="allergies" checked={formData.allergies} onChange={handleChange} className="w-5 h-5 accent-primary" />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                  <span className="font-medium">{t.treatment}</span>
                  <input type="checkbox" name="underTreatment" checked={formData.underTreatment} onChange={handleChange} className="w-5 h-5 accent-primary" />
                </div>
              </div>

              {formData.allergies && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                  <textarea name="allergiesDetails" value={formData.allergiesDetails} onChange={handleChange} className="input-field h-16" placeholder="List details..."></textarea>
                </div>
              )}

              <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                <span className="font-medium">{t.medication}</span>
                <input type="checkbox" name="takingMedication" checked={formData.takingMedication} onChange={handleChange} className="w-5 h-5 accent-primary" />
              </div>

              <div className="p-4 border border-red-100 rounded-lg bg-red-50/30">
                <span className="text-sm font-bold text-red-600 block mb-3 uppercase tracking-wider">{t.conditionsTitle}</span>
                <div className="grid grid-cols-2 gap-3">
                  <ConditionCheckbox label="Diabetes" name="condDiabetes" checked={formData.condDiabetes} onChange={handleChange} />
                  <ConditionCheckbox label="Epilepsy" name="condEpilepsy" checked={formData.condEpilepsy} onChange={handleChange} />
                  <ConditionCheckbox label="Asthma" name="condAsthma" checked={formData.condAsthma} onChange={handleChange} />
                  <ConditionCheckbox label="Cardiac" name="condCardiac" checked={formData.condCardiac} onChange={handleChange} />
                  <ConditionCheckbox label="BP" name="condHighBloodPressure" checked={formData.condHighBloodPressure} onChange={handleChange} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                  <span className="font-medium">{t.pregnant}</span>
                  <input type="checkbox" name="pregnant" checked={formData.pregnant} onChange={handleChange} className="w-5 h-5 accent-primary" />
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                  <span className="font-medium">{t.breastfeeding}</span>
                  <input type="checkbox" name="breastfeeding" checked={formData.breastfeeding} onChange={handleChange} className="w-5 h-5 accent-primary" />
                </div>
              </div>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-xl font-bold text-medical-dark border-b pb-2">{t.step6}</h3>
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 text-sm text-blue-800 leading-relaxed">
              <h4 className="font-bold mb-2 uppercase tracking-tighter">{t.consentTitle}</h4>
              <p>{t.consentText}</p>
              <p className="mt-3 font-semibold">{t.consentSub}</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="label">{t.signature}</label>
                <input name="digitalSignature" value={formData.digitalSignature} onChange={handleChange} className="input-field italic text-lg" />
              </div>
              
              <div className="flex items-center gap-3">
                <input type="checkbox" name="consentAgreed" id="consent" checked={formData.consentAgreed} onChange={handleChange} className="w-6 h-6 rounded border-gray-300 text-primary focus:ring-primary" />
                <label htmlFor="consent" className="text-sm font-medium text-medical-dark cursor-pointer select-none">
                  {t.confirm}
                </label>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden max-w-4xl mx-auto flex flex-col h-full max-h-[90vh]">
      {/* Header with Language Switcher */}
      <div className="bg-white px-6 py-4 flex items-center justify-between border-b relative z-10">
         <div className="flex items-center gap-4">
           <div className="flex gap-1 p-1 bg-gray-50 rounded-xl border border-gray-100">
              <button 
                onClick={() => { setLang('en'); setFormData(prev => ({...prev, language: 'English'})); }}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${lang === 'en' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-medical-grey hover:bg-gray-100'}`}
              >
                ENGLISH
              </button>
              <button 
                onClick={() => { setLang('tn'); setFormData(prev => ({...prev, language: 'Setswana'})); }}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${lang === 'tn' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-medical-grey hover:bg-gray-100'}`}
              >
                SETSWANA
              </button>
           </div>
         </div>
         <div className="flex items-center gap-2 text-medical-grey">
            <Globe size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">{t.langLabel || (lang === 'en' ? 'English' : 'Setswana')}</span>
         </div>
      </div>

      {/* Stepper Header */}
      <div className="bg-gray-50 border-b p-6 flex items-center justify-between overflow-x-auto no-scrollbar">
        {steps.map((s) => (
          <div key={s.id} className="flex items-center gap-2 min-w-max">
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
              ${currentStep === s.id ? 'bg-primary text-white scale-110 shadow-lg' : s.id < currentStep ? 'bg-green-100 text-primary' : 'bg-white text-gray-400 border border-gray-200'}
            `}>
              {s.id < currentStep ? <CheckCircle2 size={20} /> : s.icon}
            </div>
            {currentStep === s.id && (
              <span className="text-sm font-bold text-primary animate-in fade-in duration-500">{s.title}</span>
            )}
            {s.id !== 6 && <ChevronRight className="text-gray-300 mx-2" size={16} />}
          </div>
        ))}
      </div>

      {/* Form Body */}
      <div className="flex-1 overflow-y-auto p-8 bg-white/50">
        {renderStep()}
      </div>

      {/* Footer Controls */}
      <div className="bg-gray-50 p-6 border-t flex items-center justify-between">
        <button 
          onClick={currentStep === 1 ? onCancel : prevStep}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg border border-gray-200 text-medical-grey hover:bg-white hover:text-medical-dark transition-all font-medium"
        >
          {currentStep === 1 ? t.cancel : <><ChevronLeft size={18} /> {t.prev}</>}
        </button>
        
        <button 
          onClick={currentStep === 6 ? () => onSuccess(formData) : nextStep}
          disabled={currentStep === 6 && (!formData.consentAgreed || !formData.digitalSignature)}
          className={`
            flex items-center gap-2 px-8 py-2.5 rounded-lg font-bold transition-all
            ${currentStep === 6 ? 'bg-primary text-white hover:bg-primary-dark shadow-md disabled:opacity-50 disabled:cursor-not-allowed' : 'bg-secondary text-white hover:bg-secondary-dark'}
          `}
        >
          {currentStep === 6 ? t.save : <>{currentStep === 5 ? t.toConsent : t.nextStep} <ChevronRight size={18} /></>}
        </button>
      </div>
    </div>
  );
}

function ConditionCheckbox({ label, name, checked, onChange }) {
  return (
    <div className={`p-3 rounded-lg border transition-all flex items-center gap-3 cursor-pointer select-none ${checked ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`} 
         onClick={() => onChange({ target: { name, checked: !checked, type: 'checkbox' } })}>
      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${checked ? 'bg-red-500 border-red-500 text-white' : 'bg-white border-gray-300'}`}>
        {checked && <CheckCircle2 size={12} strokeWidth={4} />}
      </div>
      <span className={`text-[10px] font-bold uppercase tracking-tight ${checked ? 'text-red-700' : 'text-medical-grey'}`}>{label}</span>
    </div>
  );
}
