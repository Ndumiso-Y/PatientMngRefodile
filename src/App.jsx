import React, { useState } from 'react'
import logo from './assets/logo.png'
import { 
  Users, 
  UserPlus, 
  Search, 
  LayoutDashboard, 
  Settings, 
  Bell, 
  LogOut,
  Menu,
  X,
  Phone,
  CreditCard,
  Building2,
  Calendar,
  Layers,
  FileText,
  Mail,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  Activity,
  Stethoscope
} from 'lucide-react'

import PatientRegistration from './PatientRegistration'
import PatientProfile from './PatientProfile'
import WhatsAppSimulation from './WhatsAppSimulation'
import Login from './Login'
import { processWorkflows } from './lib/WorkflowEngine'
import { calculateRevenueStats, validateClaim, getRecallList } from './lib/RevenueEngine'

function App() {
  const [user, setUser] = useState(null)
  const [isKioskMode, setIsKioskMode] = useState(false)
  const [kioskLang, setKioskLang] = useState(null)
  const [isWhatsAppSimOpen, setIsWhatsAppSimOpen] = useState(false)
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Confirm Sarah Khumalo appointment', priority: 'High', category: 'Retention', done: false },
    { id: 2, title: 'Verify Discovery Medical Aid for John Doe', priority: 'Medium', category: 'Admin', done: false },
    { id: 3, title: 'Follow up on David Smith cardiac clearance', priority: 'High', category: 'Clinical', done: false }
  ])
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [currentView, setCurrentView] = useState('dashboard')
  const [selectedPatient, setSelectedPatient] = useState(null)
  
  const practices = [
    { id: 'refodile-main', name: 'Rustenburg (Main Centre)', type: 'General' },
    { id: 'refodile-ortho', name: 'Refodile Orthodontic Centre', type: 'Specialist' },
    { id: 'tebeila-plus', name: 'Dr Tebeila Plus (Coming Soon)', type: 'Premium' }
  ]
  
  const [activePracticeId, setActivePracticeId] = useState('refodile-main')
  const [isPracticeMenuOpen, setIsPracticeMenuOpen] = useState(false)
  const [userRole, setUserRole] = useState(user?.role || 'Admin')

  const [appointments, setAppointments] = useState([
    { id: 1, patientId: '8901025001081', patientName: 'John Doe', practiceId: 'refodile-main', time: '09:00 AM', date: '2026-04-12', status: 'Booked', clinician: 'Dr. Tebeila', reason: 'Routine Checkup' },
    { id: 2, patientId: '9505120123084', patientName: 'Sarah Khumalo', practiceId: 'refodile-main', time: '10:30 AM', date: '2026-04-12', status: 'Arrived', clinician: 'Dr. Tebeila', reason: 'Emergency Bridge Fix' },
    { id: 3, patientId: '9204015567082', patientName: 'Lerato Sithole', practiceId: 'refodile-ortho', time: '02:00 PM', date: '2026-04-12', status: 'Booked', clinician: 'Orthodontist', reason: 'Braces Tightening' }
  ])

  const [treatments, setTreatments] = useState([
    { id: 1, patientId: '8901025001081', practiceId: 'refodile-main', date: '10 Oct 2025', clinician: 'Dr. Tebeila', type: 'Composite Filling', area: 'Tooth 26', notes: 'Deeper decay than expected. LINER applied.', status: 'Completed', priority: 'Medium' },
    { id: 2, patientId: '8901025001081', practiceId: 'refodile-main', date: '15 Jan 2026', clinician: 'Dr. Tebeila', type: 'Routine Cleaning', area: 'Whole Mouth', notes: 'Gums healthy.', status: 'Completed', priority: 'Low' },
    { id: 3, patientId: '9204015567082', practiceId: 'refodile-ortho', date: '01 Mar 2026', clinician: 'Specialist', type: 'Braces Adjustment', area: 'Arch', notes: 'Slow progress on upper right canine.', status: 'Completed', priority: 'Medium' },
    { id: 4, patientId: '8901025001081', practiceId: 'refodile-main', date: '12 Apr 2026', clinician: 'Dr. Tebeila', type: 'Root Canal Therapy', area: 'Tooth 14', notes: 'Infected pulp. Needs immediate attention.', status: 'Planned', priority: 'High' },
    { id: 5, patientId: '8901025001081', practiceId: 'refodile-main', date: '20 Apr 2026', clinician: 'Dr. Tebeila', type: 'Crown Prep', area: 'Tooth 14', notes: 'Following root canal.', status: 'Planned', priority: 'Medium' }
  ])

  const activePractice = practices.find(p => p.id === activePracticeId)

  if (!user) {
    return <Login onLogin={setUser} />
  }

  // Phase 4: Kiosk Mode Implementation
  if (isKioskMode) {
    if (!kioskLang) {
      return (
        <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-6 text-white text-center">
           <div className="max-w-md w-full space-y-12 animate-in zoom-in-95 duration-500">
             <img src={logo} alt="Logo" className="h-32 mx-auto invert brightness-0" />
             <div className="space-y-4">
               <h1 className="text-4xl font-black tracking-tight">Welcome / O amogetswe</h1>
               <p className="text-primary-light font-bold uppercase text-xs tracking-[0.2em]">Select your language to begin</p>
             </div>
             <div className="grid grid-cols-1 gap-4">
                <button 
                  onClick={() => setKioskLang('en')}
                  className="w-full py-6 bg-white/10 hover:bg-white text-white hover:text-primary rounded-[2rem] font-black text-xl transition-all border-2 border-white/20 hover:border-white shadow-2xl"
                >
                  ENGLISH
                </button>
                <button 
                  onClick={() => setKioskLang('tn')}
                  className="w-full py-6 bg-white/10 hover:bg-white text-white hover:text-primary rounded-[2rem] font-black text-xl transition-all border-2 border-white/20 hover:border-white shadow-2xl"
                >
                  SETSWANA
                </button>
             </div>
             <button 
               onClick={() => setIsKioskMode(false)}
               className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] hover:text-white transition-all pt-8"
             >
               Exit Kiosk (Staff Only)
             </button>
           </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="max-w-md w-full space-y-8">
          <img src={logo} alt="Logo" className="h-16 mx-auto invert brightness-0" />
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight">
              {kioskLang === 'tn' ? 'O amogetswe kwa Refodile' : 'Welcome to Refodile'}
            </h1>
            <p className="text-primary-light font-medium tracking-wide opacity-80 uppercase text-[10px]">
              {kioskLang === 'tn' ? 'Tsweetswee tlatsa dintlha tsa gago' : 'Please complete your registration below'}
            </p>
          </div>
          <div className="card text-left text-medical-dark shadow-2xl p-0 overflow-hidden">
            <PatientRegistration 
              onCancel={() => { setIsKioskMode(false); setKioskLang(null); }} 
              preSelectedLang={kioskLang}
              onSuccess={() => {
                alert(kioskLang === 'tn' ? 'Re a leboga! O feditse go ikwadisa. Tsweetswee nna fatshe.' : 'Thank you! Your registration is complete. Please have a seat.');
                setIsKioskMode(false);
                setKioskLang(null);
              }} 
            />
          </div>
          <button 
            onClick={() => { setIsKioskMode(false); setKioskLang(null); }}
            className="text-white/40 text-xs font-bold uppercase tracking-widest hover:text-white transition-all"
          >
            Exit Kiosk (Staff Only)
          </button>
        </div>
      </div>
    )
  }

  const handleViewProfile = (patient) => {
    setSelectedPatient(patient)
    setCurrentView('profile')
  }

  return (
    <div className="min-h-screen bg-medical-light flex font-sans">
      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-100 transition-all duration-300 flex flex-col`}>
        <div className="p-6 flex items-center gap-3">
          <img src={logo} alt="Refodile Logo" className="h-8 w-auto flex-shrink-0" />
          {isSidebarOpen && (
            <div className="flex flex-col">
              <span className="font-bold text-primary text-xs leading-tight uppercase tracking-tighter">REFODILE</span>
              <span className="text-[10px] text-secondary font-medium uppercase tracking-wider">Health Centre</span>
            </div>
          )}
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={currentView === 'dashboard'} 
            isOpen={isSidebarOpen} 
            onClick={() => setCurrentView('dashboard')}
          />
          <NavItem 
            icon={<Users size={20} />} 
            label="Patients" 
            active={currentView === 'patients'}
            isOpen={isSidebarOpen} 
            onClick={() => setCurrentView('patients')}
          />
          <NavItem 
            icon={<UserPlus size={20} />} 
            label="New Patient" 
            active={currentView === 'registration'} 
            isOpen={isSidebarOpen} 
            onClick={() => setCurrentView('registration')}
          />
          <NavItem 
            icon={<Calendar size={20} />} 
            label="Appointments" 
            active={currentView === 'appointments'}
            isOpen={isSidebarOpen} 
            onClick={() => setCurrentView('appointments')}
          />
          <NavItem icon={<Search size={20} />} label="Search" isOpen={isSidebarOpen} />
          
          <div className="pt-6 mt-6 border-t border-gray-50">
            <p className="px-3 text-[10px] font-bold text-medical-grey uppercase tracking-widest mb-3">Management</p>
            <NavItem 
              icon={<CreditCard size={18} />} 
              label="Billing" 
              active={currentView === 'billing'}
              isOpen={isSidebarOpen} 
              onClick={() => setCurrentView('billing')}
            />
            <NavItem 
              icon={<Mail size={18} />} 
              label="Messaging" 
              active={currentView === 'messaging'}
              isOpen={isSidebarOpen} 
              onClick={() => setCurrentView('messaging')}
            />
            <NavItem 
              icon={<FileText size={18} />} 
              label="Reports" 
              active={currentView === 'reports'}
              isOpen={isSidebarOpen} 
              onClick={() => setCurrentView('reports')}
            />
          </div>
        </nav>

        <div className="p-4 border-t border-gray-50 flex flex-col gap-1">
          <NavItem 
            icon={<Settings size={18} />} 
            label="Settings" 
            active={currentView === 'settings'}
            isOpen={isSidebarOpen} 
            onClick={() => setCurrentView('settings')}
          />
          <NavItem icon={<LogOut size={18} />} label="Sign Out" isOpen={isSidebarOpen} onClick={() => setUser(null)} />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-50 rounded-lg text-medical-grey"
            >
              <Menu size={20} />
            </button>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-medical-dark leading-tight flex items-center gap-2">
                {currentView === 'dashboard' ? 'Practice Intelligence' : 
                 currentView === 'registration' ? 'Registration Portal' : 
                 currentView === 'appointments' ? 'Appointment Schedule' :
                 currentView === 'patients' ? 'Patient Registry' : 
                 currentView === 'billing' ? 'Practice Billing' : 
                 currentView === 'messaging' ? 'Communications Hub' : 
                 currentView === 'reports' ? 'Clinical Reports' : 
                 currentView === 'settings' ? 'System Settings' :
                 currentView === 'logs' ? 'Audit System' :
                 'Clinical Profile'}
              </h1>
              <div 
                className="flex items-center gap-1.5 cursor-pointer group hover:bg-gray-50 p-1.5 -m-1.5 rounded-lg transition-all relative"
                onClick={() => setIsPracticeMenuOpen(!isPracticeMenuOpen)}
              >
                <Building2 size={12} className="text-primary" />
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{activePractice.name}</span>
                <ChevronDown size={12} className={`text-primary transition-transform ${isPracticeMenuOpen ? 'rotate-180' : ''}`} />
                
                {isPracticeMenuOpen && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-100 rounded-xl shadow-2xl z-50 p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <p className="px-3 py-2 text-[9px] font-black text-medical-grey uppercase tracking-widest">Switch Practice</p>
                    {practices.map(p => (
                      <button
                        key={p.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePracticeId(p.id);
                          setIsPracticeMenuOpen(false);
                        }}
                        className={`w-full text-left p-3 rounded-lg flex flex-col gap-0.5 transition-all ${activePracticeId === p.id ? 'bg-primary/5 border border-primary/10' : 'hover:bg-gray-50'}`}
                      >
                        <span className={`text-xs font-bold ${activePracticeId === p.id ? 'text-primary' : 'text-medical-dark'}`}>{p.name}</span>
                        <span className="text-[10px] text-medical-grey uppercase tracking-tighter">{p.type}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative group">
              <input 
                type="text" 
                placeholder="Search patient ID or name..." 
                className="bg-gray-50 border-none rounded-full px-4 py-2 text-sm w-64 focus:ring-2 focus:ring-primary/20 transition-all"
              />
              <Search className="absolute right-3 top-2.5 text-medical-grey" size={16} />
            </div>
            
            <button className="relative p-2 hover:bg-gray-50 rounded-full text-medical-grey transition-all">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
            </button>
            
            <div className="flex items-center gap-3 border-l border-gray-100 pl-6 cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center text-primary font-bold text-xs">
                DT
              </div>
              <div className="hidden lg:block leading-tight">
                <p className="text-sm font-semibold text-medical-dark">Dr. Tebeila</p>
                <p className="text-[10px] text-medical-grey">Administrator</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-medical-light/50">
          <div className="max-w-7xl mx-auto">
            {currentView === 'dashboard' ? (
              <div className="space-y-8 animate-in fade-in duration-500">
                {/* Scoped Core Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <StatCard 
                    title="Patients Today" 
                    value={activePracticeId === 'refodile-main' ? "12" : activePracticeId === 'refodile-ortho' ? "5" : "0"} 
                    change={activePracticeId === 'refodile-main' ? "+3" : "+1"} 
                    icon={<Users className="text-primary" />} 
                  />
                  <StatCard 
                    title="Pending Lab Results" 
                    value={activePracticeId === 'refodile-main' ? "4" : "1"} 
                    change="0" 
                    icon={<Activity className="text-secondary" />} 
                    color="blue" 
                  />
                  <StatCard 
                    title="Critical Flags" 
                    value={activePracticeId === 'refodile-main' ? "5" : "0"} 
                    change="0" 
                    icon={<AlertCircle className="text-red-500" />} 
                    color="red" 
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Primary Area: Today's Clinic Flow */}
                  <div className="lg:col-span-2 space-y-8">
                    {/* Recent Patients */}
                    <div className="card">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-medical-dark uppercase tracking-tight">Recent Arrivals</h2>
                        <button className="text-primary font-bold text-xs hover:underline">VIEW REGISTRY</button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <tbody className="divide-y divide-gray-50">
                            {/* Scoped Patient Registry Data */}
                            {(activePracticeId === 'refodile-main' ? [
                              { name: "John Doe", id: "890102 5001 081", status: "In Queue", risk: "low", tags: ['Regular'] },
                              { name: "Sarah Khumalo", id: "950512 0123 084", status: "Consulting", risk: "high", tags: ['Billing'] },
                              { name: "David Smith", id: "721105 5678 089", status: "Completed", risk: "high", tags: ['Cardiac'] }
                            ] : activePracticeId === 'refodile-ortho' ? [
                              { name: "Lerato Sithole", id: "920401 5567 082", status: "In Queue", risk: "low", tags: ['Braces'] },
                              { name: "Thabo Mbeki", id: "880808 5050 081", status: "Completed", risk: "medium", tags: ['Invisalign'] }
                            ] : []).map((p, i) => (
                              <PatientRow 
                                key={i}
                                name={p.name} 
                                id={p.id} 
                                status={p.status} 
                                risk={p.risk}
                                onClick={() => handleViewProfile(p)}
                                tags={p.tags}
                              />
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Today's Schedule (Simplified) */}
                    <div className="card">
                      <h2 className="text-lg font-bold text-medical-dark uppercase tracking-tight mb-6">Today's Appointments</h2>
                      <div className="space-y-4">
                        <ScheduleItem time="10:30 AM" patient="Anna Muller" procedure="Routine Cleaning" />
                        <ScheduleItem time="11:15 AM" patient="Tshepo Moeketsi" procedure="Root Canal" />
                        <ScheduleItem time="02:00 PM" patient="Lerato Sithole" procedure="Extraction" />
                      </div>
                    </div>
                  </div>

                  {/* Secondary Area: Intelligence & Actions */}
                  <div className="space-y-6">
                    {/* High-Impact Actions */}
                    <div className="card bg-primary text-white border-none shadow-xl">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-white/60 mb-4">Quick Actions</h3>
                      <div className="grid grid-cols-1 gap-3">
                        <button 
                          onClick={() => setCurrentView('registration')}
                          className="flex items-center gap-3 p-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all text-left"
                        >
                          <UserPlus size={18} /> Register Walk-In
                        </button>
                        <button 
                          onClick={() => setIsWhatsAppSimOpen(true)}
                          className="flex items-center gap-3 p-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all text-left"
                        >
                          <Phone size={18} /> Send Pre-Reg link
                        </button>
                        <button 
                           onClick={() => setIsKioskMode(true)}
                           className="flex items-center gap-3 p-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all text-left"
                        >
                          <Building2 size={18} /> Enable Tablet Mode
                        </button>
                      </div>
                    </div>

                    {/* Backgrounded Intelligence: Task Queue */}
                    <div className="card">
                       <h3 className="text-xs font-bold uppercase tracking-widest text-medical-grey mb-4">Clinical Priority Queue</h3>
                       <div className="space-y-3">
                          {tasks.slice(0, 3).map(task => (
                            <div key={task.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                               <p className="text-xs font-bold text-medical-dark line-clamp-1">{task.title}</p>
                               <span className="text-[10px] uppercase font-bold text-red-500 mt-1 block">Urgent Action Required</span>
                            </div>
                          ))}
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : currentView === 'patients' ? (
              <div className="animate-in fade-in duration-500">
                <div className="card">
                  <div className="flex items-center justify-between mb-8 pb-4 border-b">
                    <h2 className="text-xl font-bold text-medical-dark uppercase tracking-tight">Active Patient Registry</h2>
                    <div className="flex gap-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-medical-grey" size={16} />
                        <input className="input-field pl-10 h-10 py-0 text-sm w-64" placeholder="Fast search..." />
                      </div>
                      <button className="btn-primary py-2 text-xs flex items-center gap-2">
                        + NEW PATIENT
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[10px] uppercase font-bold text-medical-grey border-b tracking-widest">
                          <th className="pb-3 pl-2">Patient Details</th>
                          <th className="pb-3">Tags & Status</th>
                          <th className="pb-3">Last Visit</th>
                          <th className="pb-3 text-right pr-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        <PatientRow 
                          name="John Doe" 
                          id="890102 5001 081" 
                          status="In Queue" 
                          risk="low"
                          onClick={() => handleViewProfile({ name: "John Doe", id: "890102 5001 081", status: "Complete" })}
                        />
                        <PatientRow 
                          name="Sarah Khumalo" 
                          id="950512 0123 084" 
                          status="Consulting" 
                          risk="high"
                          onClick={() => handleViewProfile({ name: "Sarah Khumalo", id: "950512 0123 084", status: "Incomplete" })}
                        />
                        <PatientRow 
                          name="David Smith" 
                          id="721105 5678 089" 
                          status="Completed" 
                          risk="high"
                          onClick={() => handleViewProfile({ name: "David Smith", id: "721105 5678 089", status: "High Risk" })}
                        />
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : currentView === 'registration' ? (
              <div className="animate-in slide-in-from-bottom-4 duration-500">
                <PatientRegistration 
                  onCancel={() => setCurrentView('dashboard')} 
                  practiceContext={activePractice}
                  onSuccess={(data) => {
                    console.log('Patient Saved:', data);
                    setCurrentView('dashboard');
                  }} 
                />
              </div>
            ) : currentView === 'profile' ? (
              <PatientProfile 
                patient={selectedPatient} 
                treatments={treatments.filter(t => t.patientId === selectedPatient?.id?.replace(/\s/g, ''))}
                onBack={() => setCurrentView('dashboard')} 
              />
            ) : currentView === 'billing' ? (
              <div className="animate-in fade-in duration-500">
                <div className="card">
                  <h2 className="text-xl font-bold text-medical-dark uppercase tracking-tight mb-8">Revenue & Billing Control</h2>
                  <div className="p-12 border-2 border-dashed border-gray-100 rounded-3xl text-center">
                    <CreditCard size={48} className="mx-auto text-gray-200 mb-4" />
                    <p className="text-medical-dark font-bold text-lg">Billing Module Ready</p>
                    <p className="text-medical-grey text-sm">Automated claim processing and invoice generation interface.</p>
                  </div>
                </div>
              </div>
            ) : currentView === 'messaging' ? (
              <div className="animate-in fade-in duration-500">
                <div className="card">
                  <h2 className="text-xl font-bold text-medical-dark uppercase tracking-tight mb-8">Communication Hub</h2>
                  <div className="p-12 border-2 border-dashed border-gray-100 rounded-3xl text-center">
                    <Mail size={48} className="mx-auto text-gray-200 mb-4" />
                    <p className="text-medical-dark font-bold text-lg">WhatsApp & SMS Recall Active</p>
                    <p className="text-medical-grey text-sm">Direct patient contact and reminder automation.</p>
                  </div>
                </div>
              </div>
            ) : currentView === 'reports' ? (
              <div className="animate-in fade-in duration-500">
                <div className="card">
                  <h2 className="text-xl font-bold text-medical-dark uppercase tracking-tight mb-8">Clinical & Analytics Reports</h2>
                  <div className="p-12 border-2 border-dashed border-gray-100 rounded-3xl text-center">
                    <FileText size={48} className="mx-auto text-gray-200 mb-4" />
                    <p className="text-medical-dark font-bold text-lg">Data Intelligence Insights</p>
                    <p className="text-medical-grey text-sm">Practice growth, clinical risk distribution, and revenue reports.</p>
                  </div>
                </div>
              </div>
            ) : currentView === 'appointments' ? (
              <div className="animate-in fade-in duration-500">
                <div className="card">
                  <div className="flex items-center justify-between mb-8 pb-4 border-b">
                     <div>
                        <h2 className="text-xl font-bold text-medical-dark uppercase tracking-tight">Daily Schedule</h2>
                        <p className="text-[10px] text-medical-grey font-bold uppercase tracking-widest mt-1">Practice: {activePractice.name}</p>
                     </div>
                     <button className="btn-primary py-2 px-6 text-xs flex items-center gap-2 shadow-lg shadow-primary/20">
                       <Calendar size={14} /> BOOK APPOINTMENT
                     </button>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {appointments.filter(a => a.practiceId === activePracticeId).length === 0 ? (
                      <div className="p-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
                        <Calendar size={32} className="mx-auto text-gray-200 mb-4" />
                        <p className="text-medical-grey font-bold text-xs uppercase">No appointments found for this practice today</p>
                      </div>
                    ) : (
                      appointments.filter(a => a.practiceId === activePracticeId).map(app => (
                        <AppointmentCard 
                          key={app.id} 
                          appointment={app} 
                          onViewProfile={() => handleViewProfile({ name: app.patientName, id: app.patientId, status: 'In System' })} 
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : currentView === 'settings' ? (
              <div className="animate-in fade-in duration-500">
                <div className="card">
                  <h2 className="text-xl font-bold text-medical-dark uppercase tracking-tight mb-8">System Settings</h2>
                  <div className="space-y-6">
                    <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                       <div>
                         <p className="text-sm font-bold text-medical-dark">Multi-Branch Mode</p>
                         <p className="text-[10px] text-medical-grey uppercase font-medium">Active Division: {activePractice.name}</p>
                       </div>
                       <div className="flex gap-2">
                         <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-primary hover:bg-white/80 transition-all shadow-sm">Sync Inventory</button>
                         <button className="px-4 py-2 bg-white border border-gray-100 rounded-lg text-xs font-bold text-medical-grey">Manage Divisions</button>
                       </div>
                    </div>
                    <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                       <div>
                         <p className="text-sm font-bold text-medical-dark">Clinical Audit Trail</p>
                         <p className="text-[10px] text-medical-grey uppercase font-medium">Tracking all practitioner actions</p>
                       </div>
                       <button 
                         onClick={() => setCurrentView('logs')}
                         className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
                       >
                         View Full Logs
                       </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="animate-in fade-in duration-500">
                <div className="card max-w-4xl mx-auto">
                   <div className="flex items-center justify-between mb-8 border-b pb-4">
                     <div>
                       <h2 className="text-lg font-bold text-medical-dark uppercase tracking-tight">System Audit Logs</h2>
                       <p className="text-xs text-medical-grey">Full traceability for all clinical and administrative actions</p>
                     </div>
                     <button className="btn-secondary text-xs px-4">Export CSV</button>
                   </div>
                   <div className="space-y-4">
                     <LogEntry user="Dr. Tebeila" action="Viewed Profile" patient="David Smith" time="2 mins ago" />
                     <LogEntry user="Receptionist Sarah" action="Saved Registration" patient="Ndumiso Sithole" time="15 mins ago" />
                     <LogEntry user="System Intelligence" action="Auto-Flagged Risk" patient="David Smith" time="2 hours ago" />
                     <LogEntry user="Admin" action="Exported Revenue Report" patient="N/A" time="4 hours ago" />
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {isWhatsAppSimOpen && (
         <WhatsAppSimulation 
           onCancel={() => setIsWhatsAppSimOpen(false)}
           onComplete={() => setIsWhatsAppSimOpen(false)}
         />
      )}
    </div>
  )
}

function LogEntry({ user, action, patient, time }) {
  return (
    <div className="flex items-center justify-between p-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-all rounded-lg group">
      <div className="flex items-center gap-4">
        <div className="w-1.5 h-8 bg-gray-200 group-hover:bg-primary transition-colors rounded-full" />
        <div>
          <p className="text-xs font-bold text-medical-dark">{action} <span className="text-primary">[{patient}]</span></p>
          <p className="text-[10px] text-medical-grey font-medium uppercase tracking-tighter">{user} • {time}</p>
        </div>
      </div>
      <div className="text-[10px] font-bold text-medical-grey">Verified</div>
    </div>
  )
}

function NavItem({ icon, label, active = false, isOpen = true, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
        ${active ? 'bg-primary/10 text-primary font-semibold' : 'text-medical-grey hover:bg-gray-50 hover:text-medical-dark'}
        ${!isOpen && 'justify-center'}
      `}
    >
      {icon}
      {isOpen && <span className="text-sm">{label}</span>}
      {active && isOpen && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
    </button>
  )
}

function RecallItem({ name, due, revenue }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl border border-gray-50 hover:border-gray-100 transition-all">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-secondary-light flex items-center justify-center text-secondary font-bold text-[10px]">
          {name.split(' ').map(n => n[0]).join('')}
        </div>
        <div>
          <p className="text-xs font-bold text-medical-dark">{name}</p>
          <p className="text-[10px] text-red-500 font-bold uppercase tracking-tighter">Due: {due}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs font-black text-secondary">{revenue}</p>
        <button className="text-[10px] font-bold text-medical-grey hover:text-primary transition-all">Remind</button>
      </div>
    </div>
  )
}

function StatCard({ title, value, change, icon, color = "green" }) {
  const colorMap = {
    green: "bg-primary/10",
    blue: "bg-secondary/10",
    orange: "bg-orange-100",
    red: "bg-red-100"
  }
  
  return (
    <div className="card flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold text-medical-grey uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-medical-dark">{value}</h3>
        <p className={`text-xs mt-2 font-medium ${change.startsWith('+') ? 'text-green-600' : change === '0' ? 'text-gray-400' : 'text-red-600'}`}>
          {change} <span className="text-medical-grey font-normal ml-1">vs last week</span>
        </p>
      </div>
      <div className={`p-3 rounded-xl ${colorMap[color]}`}>
        {icon}
      </div>
    </div>
  )
}

function AppointmentCard({ appointment, onViewProfile }) {
  const statusColors = {
    'Booked': 'bg-blue-50 text-blue-600 border-blue-100',
    'Arrived': 'bg-primary/10 text-primary border-primary/20',
    'Completed': 'bg-gray-100 text-gray-500 border-gray-200',
    'Cancelled': 'bg-red-50 text-red-600 border-red-100'
  }

  return (
    <div className="flex flex-col md:flex-row items-center justify-between p-5 rounded-2xl border border-gray-100 hover:border-primary/20 transition-all group bg-white hover:shadow-xl hover:shadow-gray-200/50">
      <div className="flex items-center gap-6 w-full md:w-auto">
        <div className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 text-medical-dark">
          <p className="text-[10px] font-bold uppercase tracking-tighter opacity-40">TIME</p>
          <p className="text-sm font-black tracking-tighter">{appointment.time.split(' ')[0]}</p>
          <p className="text-[9px] font-bold opacity-40 uppercase">{appointment.time.split(' ')[1]}</p>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <p className="text-sm font-bold text-medical-dark group-hover:text-primary transition-colors cursor-pointer" onClick={onViewProfile}>
              {appointment.patientName}
            </p>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${statusColors[appointment.status]}`}>
              {appointment.status}
            </span>
          </div>
          <p className="text-[10px] text-medical-grey font-bold uppercase flex items-center gap-2">
            <Stethoscope size={10} /> {appointment.clinician} • {appointment.reason}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-4 md:mt-0 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-gray-50">
        <button 
          onClick={onViewProfile}
          className="flex-1 md:flex-none px-4 py-2 text-[10px] font-bold text-medical-grey hover:text-primary transition-all uppercase tracking-widest border border-gray-100 md:border-0 rounded-lg"
        >
          View Profile
        </button>
        <button className="flex-1 md:flex-none px-4 py-2 text-[10px] font-bold text-primary hover:bg-primary-light transition-all uppercase tracking-widest border border-primary/20 rounded-lg">
          Reschedule
        </button>
        <button className="p-2 text-medical-grey hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

function ScheduleItem({ time, patient, procedure }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-gray-50 hover:bg-gray-50 transition-all group cursor-pointer">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center text-primary font-black text-xs">
          {time.split(' ')[0]}
        </div>
        <div>
          <p className="text-xs font-bold text-medical-dark group-hover:text-primary transition-colors">{patient}</p>
          <p className="text-[10px] text-medical-grey tracking-tight font-medium uppercase">{procedure}</p>
        </div>
      </div>
      <ChevronRight size={16} className="text-gray-200 group-hover:text-primary transition-all" />
    </div>
  )
}

function PatientRow({ name, id, status, onClick, risk = "low", tags = [] }) {
  const riskStyles = {
    'high': 'bg-red-500',
    'medium': 'bg-orange-400',
    'low': 'bg-green-400'
  }
  
  return (
    <tr className="hover:bg-gray-50 transition-colors group">
      <td className="py-4 pl-2">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-medical-grey uppercase">
              {name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${riskStyles[risk]}`} title={`Risk: ${risk}`} />
          </div>
          <div className="leading-tight">
            <span className="font-bold text-medical-dark block text-sm">{name}</span>
            <span className="text-[10px] text-medical-grey font-medium uppercase tracking-widest">{id}</span>
          </div>
        </div>
      </td>
      <td className="py-4">
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag, i) => (
            <span key={i} className="px-2 py-0.5 rounded bg-gray-100 text-medical-grey text-[9px] font-bold uppercase">
              {tag}
            </span>
          ))}
        </div>
      </td>
      <td className="py-4">
        <span className="text-xs font-bold text-medical-grey uppercase tracking-tighter">{status}</span>
      </td>
      <td className="py-4 text-right pr-2">
        <button 
          onClick={onClick}
          className="px-4 py-2 hover:bg-primary/10 text-primary font-bold text-xs rounded-lg transition-all"
        >
          OPEN FILE
        </button>
      </td>
    </tr>
  )
}

export default App
