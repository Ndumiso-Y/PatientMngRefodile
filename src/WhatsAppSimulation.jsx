import React, { useState } from 'react';
import { 
  Send, 
  ChevronLeft, 
  CheckCircle2, 
  MessageSquare, 
  Globe,
  User,
  ShieldCheck,
  HeartPulse,
  Phone
} from 'lucide-react';

const translations = {
  en: {
    langLabel: "English",
    welcome: "Welcome to Refodile Health Centre Patient Intake",
    selectLanguage: "Please choose your preferred language to begin:",
    start: "Get Started",
    step1: "Personal Details",
    step2: "Medical History",
    step3: "Consent",
    firstName: "First Names",
    surname: "Surname",
    idNumber: "ID Number",
    cellNumber: "Cell Number",
    allergies: "Do you have any allergies?",
    medication: "Are you taking any medication?",
    conditions: "Do you have any chronic conditions (Diabetes, etc.)?",
    consentTitle: "Patient Declaration",
    consentText: "I confirm that all information provided is correct and I consent to medical treatment at Refodile Health Centre.",
    agree: "I agree and sign",
    finish: "Complete Registration",
    success: "Success! Your digital file has been created. You can now proceed to the practice.",
    next: "Continue",
    back: "Go Back",
    placeholder: "Type your answer here..."
  },
  tn: {
    langLabel: "Setswana",
    welcome: "O amogetswe kwa Refodile Health Centre",
    selectLanguage: "Tsweetswee kgetha loleme lo o lo batlang go simolola:",
    start: "Simolola",
    step1: "Dintlha tsa gago",
    step2: "Ditiragalo tsa kalafi",
    step3: "Tetlelelo",
    firstName: "Maina a ntlha",
    surname: "Sefane",
    idNumber: "Nomoro ya Boitshupo",
    cellNumber: "Nomoro ya mogala",
    allergies: "A go na le sengwe se se go lwalisang (allergies)?",
    medication: "A o nwa melemo epe gone jaanong?",
    conditions: "A o na le malwetse a a sa foleng (Diabetes, jalo le jalo)?",
    consentTitle: "Boikano jwa Molwetse",
    consentText: "Ke netefatsa gore dintlha tsotlhe tse ke di neetseng di nepagetse mme ke dumelela kalafi kwa Refodile Health Centre.",
    agree: "Ke a dumalana mme ke a saena",
    finish: "Fetsa go ikwadisa",
    success: "Go siame! Faele ya gago ya dijiti e tlhamilwe. O ka nna wa tswelela kwa kliniking.",
    next: "Tswelela",
    back: "Boela morago",
    placeholder: "Kwala karabo ya gago fano..."
  }
};

export default function WhatsAppSimulation({ onComplete, onCancel }) {
  const [lang, setLang] = useState(null);
  const [step, setStep] = useState(0); // 0: Lang, 1: Welcome, 2: Details, 3: Medical, 4: Consent, 5: Success
  const [formData, setFormData] = useState({
    firstName: '',
    surname: '',
    idNumber: '',
    cellNumber: '',
    allergies: '',
    medication: '',
    conditions: '',
    agreed: false
  });

  const t = lang ? translations[lang] : translations.en;

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  if (!lang) {
    return (
      <div className="fixed inset-0 bg-medical-dark/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto text-primary">
              <Globe size={32} />
            </div>
            <div>
              <h2 className="text-xl font-black text-medical-dark mb-2">Language Selection</h2>
              <p className="text-xs font-bold text-medical-grey uppercase tracking-widest">Kgetha Loleme</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={() => setLang('en')}
                className="w-full py-4 bg-gray-50 hover:bg-primary hover:text-white rounded-2xl font-bold transition-all border border-gray-100 flex items-center justify-between px-6 group"
              >
                English <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">SELECT</span>
              </button>
              <button 
                onClick={() => setLang('tn')}
                className="w-full py-4 bg-gray-50 hover:bg-primary hover:text-white rounded-2xl font-bold transition-all border border-gray-100 flex items-center justify-between px-6 group"
              >
                Setswana <span className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">TLHAPHA</span>
              </button>
            </div>
            <button onClick={onCancel} className="text-[10px] font-black text-medical-grey uppercase tracking-widest hover:text-red-500 transition-colors pt-4">
              Close / Tswala
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-medical-dark/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[#E5DDD5] w-full max-w-sm h-[700px] rounded-[3rem] overflow-hidden shadow-2xl flex flex-col relative border-[8px] border-medical-dark">
        {/* Hardware Notch Simulation */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-medical-dark rounded-b-2xl z-50 flex items-center justify-center">
            <div className="w-10 h-1 bg-white/10 rounded-full" />
        </div>

        {/* WhatsApp Header */}
        <div className="bg-[#075E54] p-6 pt-10 text-white flex items-center gap-3 shadow-md">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl font-black">R</div>
          <div>
            <h3 className="font-bold text-sm">Refodile Health Centre</h3>
            <p className="text-[10px] opacity-80">Online / Jaanong</p>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat">
          
          {/* Incoming: Welcome */}
          <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm max-w-[85%] animate-in slide-in-from-left-4 duration-300">
             <p className="text-xs text-medical-dark leading-relaxed font-medium">
                {t.welcome} 👋
             </p>
             <span className="text-[9px] text-gray-400 block text-right mt-1">08:30</span>
          </div>

          {step >= 1 && (
            <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm max-w-[85%] animate-in slide-in-from-left-4 duration-300">
               <p className="text-xs text-medical-dark leading-relaxed font-medium">
                  {step === 1 ? t.selectLanguage : t.step1}
               </p>
               <span className="text-[9px] text-gray-400 block text-right mt-1">08:31</span>
            </div>
          )}

          {/* Outgoing: User start */}
          {step >= 1 && (
            <div className="bg-[#DCF8C6] p-3 rounded-2xl rounded-tr-none shadow-sm ml-auto max-w-[85%] animate-in slide-in-from-right-4 duration-300">
               <p className="text-xs font-bold text-medical-dark uppercase tracking-tight">
                  {lang === 'en' ? 'Let\'s start' : 'A re simolole'}
               </p>
               <span className="text-[9px] text-gray-400 block text-right mt-1">08:31 ✓✓</span>
            </div>
          )}

          {/* Interactive Form Area */}
          {step === 1 && (
             <div className="mt-8 space-y-3 animate-in fade-in duration-500">
                <button 
                  onClick={handleNext}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest"
                >
                  {t.start}
                </button>
             </div>
          )}

          {step === 2 && (
            <div className="bg-white p-6 rounded-[2rem] shadow-xl space-y-4 animate-in slide-in-from-bottom-4 duration-400">
               <div className="flex items-center gap-2 text-primary mb-2">
                  <User size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{t.step1}</span>
               </div>
               <div className="space-y-3">
                  <MobileInput label={t.firstName} value={formData.firstName} onChange={(v) => setFormData({...formData, firstName: v})} />
                  <MobileInput label={t.surname} value={formData.surname} onChange={(v) => setFormData({...formData, surname: v})} />
                  <MobileInput label={t.idNumber} value={formData.idNumber} onChange={(v) => setFormData({...formData, idNumber: v})} />
               </div>
               <button onClick={handleNext} className="w-full py-3 bg-primary text-white rounded-xl font-bold text-xs uppercase tracking-widest mt-4">
                  {t.next}
               </button>
            </div>
          )}

          {step === 3 && (
            <div className="bg-white p-6 rounded-[2rem] shadow-xl space-y-4 animate-in slide-in-from-bottom-4 duration-400">
               <div className="flex items-center gap-2 text-red-500 mb-2">
                  <HeartPulse size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{t.step2}</span>
               </div>
               <div className="space-y-3">
                  <MobileInput label={t.allergies} value={formData.allergies} onChange={(v) => setFormData({...formData, allergies: v})} />
                  <MobileInput label={t.medication} value={formData.medication} onChange={(v) => setFormData({...formData, medication: v})} />
               </div>
               <div className="flex gap-2 pt-2">
                  <button onClick={handleBack} className="flex-1 py-3 bg-gray-50 text-medical-grey rounded-xl font-bold text-[10px] uppercase">{t.back}</button>
                  <button onClick={handleNext} className="flex-[2] py-3 bg-primary text-white rounded-xl font-bold text-[10px] uppercase tracking-widest">{t.next}</button>
               </div>
            </div>
          )}

          {step === 4 && (
            <div className="bg-white p-6 rounded-[2rem] shadow-xl space-y-6 animate-in slide-in-from-bottom-4 duration-400">
               <div className="flex items-center gap-2 text-green-600 mb-2">
                  <ShieldCheck size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{t.step3}</span>
               </div>
               <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 italic text-[11px] text-medical-dark leading-relaxed">
                  "{t.consentText}"
               </div>
               <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl cursor-pointer" onClick={() => setFormData({...formData, agreed: !formData.agreed})}>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${formData.agreed ? 'bg-primary border-primary' : 'border-gray-300'}`}>
                    {formData.agreed && <CheckCircle2 size={12} className="text-white" />}
                  </div>
                  <span className="text-[11px] font-bold text-medical-dark uppercase tracking-tight">{t.agree}</span>
               </div>
               <button 
                onClick={handleNext} 
                disabled={!formData.agreed}
                className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-xl shadow-primary/20 disabled:opacity-50 transition-all uppercase tracking-widest"
               >
                  {t.finish}
               </button>
            </div>
          )}

          {step === 5 && (
            <div className="p-8 text-center space-y-6 animate-in zoom-in-95 duration-500">
               <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 size={40} />
               </div>
               <div>
                  <h4 className="text-xl font-black text-medical-dark mb-2">PULA!</h4>
                  <p className="text-sm font-medium text-medical-grey leading-relaxed">
                     {t.success}
                  </p>
               </div>
               <button onClick={onCancel} className="w-full py-4 bg-medical-dark text-white rounded-2xl font-black text-xs uppercase tracking-widest">
                  Close / Tswala
               </button>
            </div>
          )}

        </div>

        {/* Fake Menu */}
        <div className="bg-white p-2 flex items-center gap-2 border-t px-4 pb-6">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">+</div>
            <div className="flex-1 bg-gray-100 rounded-full py-2 px-4 text-gray-400 text-xs">{t.placeholder}</div>
            <div className="w-10 h-10 rounded-full bg-[#128C7E] flex items-center justify-center text-white">
                <Send size={18} />
            </div>
        </div>
      </div>
    </div>
  );
}

function MobileInput({ label, value, onChange }) {
  return (
    <div className="space-y-1.5">
       <label className="text-[9px] font-black text-medical-grey uppercase tracking-widest ml-1">{label}</label>
       <input 
         type="text"
         value={value}
         onChange={(e) => onChange(e.target.value)}
         className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none"
       />
    </div>
  );
}
