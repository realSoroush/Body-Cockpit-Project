import { useState, useEffect, useMemo, ReactNode, useCallback } from 'react';
import { format } from 'date-fns';
import { 
  LayoutDashboard, 
  TrendingUp, 
  UtensilsCrossed, 
  Droplets, 
  CheckCircle2, 
  RefreshCcw,
  Target,
  Clock,
  Pill,
  CheckCircle,
  Calendar as CalendarIcon,
  RotateCcw,
  Plus,
  Trash2,
  Lightbulb,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { cn, STORAGE_KEY, AppData, WeightLog } from './lib/utils';
import { MEAL_PLAN, MOTIVATIONAL_TIPS } from './constants';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function useTehranTime() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Tehran',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).format(time);
  }, [time]);
}

export default function App() {
  const tehranTime = useTehranTime();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'chart' | 'meals'>('dashboard');
  const [selectedDayIndex, setSelectedDayIndex] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
  const [todayStr] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showCelebration, setShowCelebration] = useState(false);

  const [data, setData] = useState<AppData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migration check for weights
        if (!Array.isArray(parsed.weights)) {
          parsed.weights = [];
        }
        return parsed;
      } catch (e) {
        console.error("Failed to parse appData", e);
      }
    }
    return {
      weights: [],
      waterIntake: {},
      completedMeals: {},
      selectedOptions: {},
      isTrainingDay: false
    };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const toggleTrainingDay = () => {
    setData(prev => ({ ...prev, isTrainingDay: !prev.isTrainingDay }));
  };

  const updateWater = () => {
    setData(prev => {
      const current = prev.waterIntake[todayStr] || 0;
      if (current >= 4000) return prev;
      return {
        ...prev,
        waterIntake: { ...prev.waterIntake, [todayStr]: Math.min(current + 250, 4000) }
      };
    });
  };

  const resetWater = () => {
    setData(prev => ({
      ...prev,
      waterIntake: { ...prev.waterIntake, [todayStr]: 0 }
    }));
  };

  const toggleMealComplete = (mealId: string) => {
    setData(prev => {
      const completed = prev.completedMeals[todayStr] || [];
      const isCompleted = completed.includes(mealId);
      
      if (!isCompleted) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 1500);
      }

      return {
        ...prev,
        completedMeals: {
          ...prev.completedMeals,
          [todayStr]: isCompleted 
            ? completed.filter(id => id !== mealId) 
            : [...completed, mealId]
        }
      };
    });
  };

  const addWeightLog = (weight: number) => {
    if (!weight) return;
    const newLog: WeightLog = {
      id: crypto.randomUUID(),
      weight,
      timestamp: new Date().toISOString()
    };
    setData(prev => ({
      ...prev,
      weights: [newLog, ...prev.weights].slice(0, 50) // Keep last 50
    }));
  };

  const removeWeightLog = (id: string) => {
    setData(prev => ({
      ...prev,
      weights: prev.weights.filter(w => w.id !== id)
    }));
  };

  const rotateMealOption = (mealId: string, optionsCount: number) => {
    setData(prev => {
      const currentIdx = prev.selectedOptions[mealId] || 0;
      return {
        ...prev,
        selectedOptions: {
          ...prev.selectedOptions,
          [mealId]: (currentIdx + 1) % optionsCount
        }
      };
    });
  };

  const filteredMeals = useMemo(() => {
    return MEAL_PLAN.filter(meal => {
      if (meal.isWorkoutSpecific === 'training' && !data.isTrainingDay) return false;
      return true;
    });
  }, [data.isTrainingDay]);

  const nextMeal = useMemo(() => {
    const completed = data.completedMeals[todayStr] || [];
    return filteredMeals.find(m => !completed.includes(m.id));
  }, [filteredMeals, data.completedMeals, todayStr]);

  const waterProgress = (data.waterIntake[todayStr] || 0) / 4000;
  const mealsCompleted = (data.completedMeals[todayStr] || []).filter(id => MEAL_PLAN.some(m => m.id === id)).length;

  const dailyTip = useMemo(() => {
    const hash = todayStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return MOTIVATIONAL_TIPS[hash % MOTIVATIONAL_TIPS.length];
  }, [todayStr]);

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans text-slate-900 select-none overflow-x-hidden">
      {/* Top Header / Toggle */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-slate-100 flex flex-col">
        {/* Tehran Time Bar */}
        <div className="bg-slate-900 text-white py-1 px-4 text-[10px] uppercase tracking-tighter font-mono flex justify-between items-center opacity-90">
          <div className="flex items-center gap-2">
            <CalendarIcon size={10} className="text-blue-400" />
            <span className="truncate max-w-[200px]">{tehranTime}</span>
          </div>
          <span className="text-blue-400 font-bold">Tehran, IR</span>
        </div>
        
        <div className="px-6 py-4 flex justify-between items-center bg-white/80 backdrop-blur-md">
          <h1 className="text-xl font-black tracking-tighter bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            BODY COCKPIT
          </h1>
          <button 
            onClick={toggleTrainingDay}
            className={cn(
              "relative w-36 h-9 rounded-full p-1 transition-all duration-300 flex items-center",
              data.isTrainingDay ? "bg-purple-600 shadow-lg shadow-purple-200" : "bg-blue-600 shadow-lg shadow-blue-200"
            )}
          >
            <div className={cn(
              "absolute inset-0 flex items-center justify-around text-[9px] font-black uppercase tracking-wider text-white px-3",
              data.isTrainingDay ? "flex-row-reverse" : "flex-row"
            )}>
              <span>Normal</span>
              <span>Training</span>
            </div>
            <motion.div 
              layout
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="z-10 w-1/2 h-full bg-white rounded-full shadow-sm flex items-center justify-center font-black text-[9px] uppercase text-slate-800"
            >
              {data.isTrainingDay ? 'Training' : 'Normal'}
            </motion.div>
          </button>
        </div>
      </header>

      <main className="pt-32 px-6 max-w-lg mx-auto">
        <AnimatePresence>
          {showCelebration && (
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 1 }}
              exit={{ scale: 2, opacity: 0 }}
              className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center text-4xl"
            >
              <div className="bg-white/80 backdrop-blur-sm p-8 rounded-full shadow-2xl border border-blue-100 flex flex-col items-center">
                <CheckCircle2 size={80} className="text-blue-600 mb-2" />
                <span className="font-black text-blue-600 text-lg uppercase tracking-widest">Excellent!</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Next Action */}
              <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="flex items-center gap-2 mb-4 text-slate-400 font-medium text-sm">
                  <Target size={16} />
                  <span>Next Action</span>
                </div>
                {nextMeal ? (
                  <div className="relative">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h2 className="text-2xl font-bold text-slate-800">{nextMeal.name}</h2>
                        <div className="flex items-center gap-1.5 text-blue-600 font-semibold text-sm mt-1">
                          <Clock size={14} />
                          <span>{nextMeal.time}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => toggleMealComplete(nextMeal.id)}
                        className="bg-blue-600 text-white p-2.5 rounded-2xl shadow-lg shadow-blue-200"
                      >
                        <CheckCircle2 size={24} />
                      </button>
                    </div>
                    <ul className="space-y-2">
                       {nextMeal.options[data.selectedOptions[nextMeal.id] || 0].items.map((item, i) => (
                         <li key={i} className="flex items-center gap-3 text-slate-600 text-sm">
                           <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                           {item}
                         </li>
                       ))}
                    </ul>
                    {nextMeal.options[data.selectedOptions[nextMeal.id] || 0].medicines && (
                       <div className="mt-4 pt-4 border-t border-slate-50">
                         <div className="flex items-center gap-2 text-purple-600 font-semibold text-xs uppercase tracking-widest">
                           <Pill size={14} />
                           <span>Suggested Add-ons</span>
                         </div>
                         <p className="text-slate-500 text-sm mt-1">
                           {nextMeal.options[data.selectedOptions[nextMeal.id] || 0].medicines?.join(', ')}
                         </p>
                       </div>
                    )}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="text-green-600" size={32} />
                    </div>
                    <p className="text-slate-800 font-bold">All meals completed!</p>
                    <p className="text-slate-400 text-sm">Target reached for today.</p>
                  </div>
                )}
              </section>

              {/* Progress */}
              <section className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Completed</p>
                  <p className="text-3xl font-black text-slate-800">{mealsCompleted}</p>
                </div>
                <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Remaining</p>
                  <p className="text-3xl font-black text-slate-800">{filteredMeals.length - mealsCompleted}</p>
                </div>
              </section>

              {/* Water Tracker - MOVED TO BOTTOM */}
              <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
                    <Droplets size={16} className="text-blue-500" />
                    <span>Hydration</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-black text-blue-600">{(data.waterIntake[todayStr] || 0) / 1000}L / 4L</span>
                    <button 
                      onClick={resetWater}
                      className="p-1.5 text-slate-300 hover:text-slate-400 active:rotate-180 transition-all"
                    >
                      <RotateCcw size={16} />
                    </button>
                  </div>
                </div>
                <div className="flex gap-1.5 mb-6">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "flex-1 h-6 rounded-sm transition-all duration-700",
                        (i * 250) < (data.waterIntake[todayStr] || 0) 
                          ? "bg-gradient-to-b from-blue-400 to-blue-600 shadow-[0_2px_10px_rgba(37,99,235,0.2)]" 
                          : "bg-slate-50"
                      )}
                    />
                  ))}
                </div>
                <button 
                  onClick={updateWater}
                  disabled={(data.waterIntake[todayStr] || 0) >= 4000}
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-blue-100"
                >
                  <Plus size={20} />
                  Add 250ml
                </button>
              </section>

              {/* Tip of Today */}
              <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                   <Sparkles size={48} className="text-purple-600" />
                </div>
                <div className="flex items-center gap-2 mb-3 text-slate-400 font-bold text-xs uppercase tracking-widest">
                  <Lightbulb size={16} className="text-yellow-500" />
                  <span>Tip of Today</span>
                </div>
                <p className="text-slate-700 font-medium leading-relaxed italic pr-8">
                  "{dailyTip}"
                </p>
                <div className="mt-4 flex items-center gap-1.5 text-[10px] font-black text-blue-600 uppercase tracking-widest">
                  <span>Keep Pushing</span>
                  <div className="w-8 h-[1px] bg-blue-100" />
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'chart' && (
            <motion.div 
               key="chart"
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: 20 }}
               className="space-y-6"
            >
              <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-6 text-slate-400 font-bold text-xs uppercase tracking-widest">
                  <TrendingUp size={16} className="text-blue-500" />
                  <span>Measures Tracker</span>
                </div>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={[...data.weights].reverse().map(log => ({ 
                      name: format(new Date(log.timestamp), 'dd/MM'), 
                      weight: log.weight 
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} 
                      />
                      <YAxis 
                        width={30}
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
                        domain={['auto', 'auto']}
                      />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', background: '#fff' }} 
                        labelStyle={{ color: '#94a3b8', fontWeight: 800, marginBottom: '4px' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="weight" 
                        stroke="#2563eb" 
                        strokeWidth={4} 
                        dot={{ r: 5, fill: '#2563eb', strokeWidth: 3, stroke: '#fff' }} 
                        activeDot={{ r: 8, strokeWidth: 0 }} 
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">New Measure</h3>
                <div className="flex gap-2 md:gap-3">
                  <input 
                    id="new-weight-input"
                    type="number" 
                    placeholder="00.0"
                    step="0.1"
                    className="flex-1 w-full min-w-0 bg-slate-50 border-none rounded-2xl px-4 py-3 md:p-4 text-lg md:text-xl font-black text-slate-800 placeholder:text-slate-200 outline-none focus:ring-2 focus:ring-blue-100"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.currentTarget;
                        addWeightLog(parseFloat(input.value));
                        input.value = '';
                      }
                    }}
                  />
                  <button 
                    onClick={() => {
                      const input = document.getElementById('new-weight-input') as HTMLInputElement;
                      addWeightLog(parseFloat(input.value));
                      input.value = '';
                    }}
                    className="bg-blue-600 text-white p-3 md:p-4 rounded-2xl shadow-lg shadow-blue-100 active:scale-95 transition-all flex-shrink-0"
                  >
                    <Plus size={24} />
                  </button>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Weekly Log</h3>
                {data.weights.map((log) => (
                  <motion.div 
                    layout
                    key={log.id} 
                    className="bg-white rounded-2xl p-4 flex justify-between items-center border border-slate-100 group"
                  >
                    <div>
                      <p className="font-black text-slate-800 text-lg leading-tight">{log.weight} <span className="text-xs text-slate-400">kg</span></p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                        {format(new Date(log.timestamp), 'EEE, MMM dd • HH:mm')}
                      </p>
                    </div>
                    <button 
                      onClick={() => removeWeightLog(log.id)}
                      className="p-2 text-slate-200 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </motion.div>
                ))}
              </section>
            </motion.div>
          )}

          {activeTab === 'meals' && (
             <motion.div 
               key="meals"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               className="space-y-6"
             >
               {/* Day Selector */}
               <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
                 {DAYS.map((day, i) => (
                    <button 
                      key={day}
                      onClick={() => setSelectedDayIndex(i)}
                      className={cn(
                        "flex-shrink-0 w-14 py-3 rounded-2xl font-bold text-sm transition-all",
                        selectedDayIndex === i 
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105" 
                          : "bg-white text-slate-400 border border-slate-100"
                      )}
                    >
                      {day}
                    </button>
                 ))}
               </div>

               {/* Meals List */}
               <div className="space-y-4">
                 {filteredMeals.map((meal) => {
                   const optionIdx = data.selectedOptions[meal.id] || 0;
                   const option = meal.options[optionIdx];
                   const isCompleted = (data.completedMeals[todayStr] || []).includes(meal.id);

                   return (
                     <div 
                        key={meal.id}
                        className={cn(
                          "bg-white rounded-3xl p-5 border transition-all duration-300 relative overflow-hidden",
                          isCompleted ? "opacity-30 border-slate-200 grayscale-[0.5]" : "border-slate-100 shadow-sm shadow-slate-100/50"
                        )}
                        onClick={() => toggleMealComplete(meal.id)}
                     >
                       <div className="flex justify-between items-start mb-3">
                         <div>
                           <div className="flex items-center gap-2">
                             <h3 className="font-bold text-lg text-slate-800">{meal.name}</h3>
                             {isCompleted && <CheckCircle2 size={18} className="text-blue-600" />}
                           </div>
                           <div className="flex items-center gap-1 text-slate-400 font-bold text-xs mt-0.5">
                             <Clock size={12} />
                             <span>{meal.time}</span>
                           </div>
                         </div>
                         {meal.options.length > 1 && !isCompleted && (
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               rotateMealOption(meal.id, meal.options.length);
                             }}
                             className="p-2 bg-slate-50 text-slate-600 rounded-xl active:rotate-180 transition-transform"
                           >
                             <RefreshCcw size={16} />
                           </button>
                         )}
                       </div>

                       <div className="space-y-1.5 mb-4">
                          {option.items.map((item, i) => (
                            <p key={i} className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">• {item}</p>
                          ))}
                       </div>

                       {/* Medicines */}
                       {option.medicines && (
                         <div className="mb-4 flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-2 rounded-xl text-xs font-bold w-fit">
                           <Pill size={14} />
                           <span>{option.medicines.join(', ')}</span>
                         </div>
                       )}

                       {/* Macros */}
                       <div className="flex gap-2 pt-4 border-t border-slate-50">
                          <MacroBadge label="P" value={option.p} color="text-red-500" />
                          <MacroBadge label="C" value={option.c} color="text-blue-500" />
                          <MacroBadge label="F" value={option.f} color="text-orange-500" />
                          <MacroBadge label="Fib" value={option.fib} color="text-green-500" />
                       </div>
                     </div>
                   );
                 })}
               </div>
             </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 px-8 py-4 flex justify-between items-center z-50 rounded-t-[32px] shadow-[0_-10px_30px_rgba(0,0,0,0.02)]">
        <NavButton 
          active={activeTab === 'chart'} 
          onClick={() => setActiveTab('chart')}
          icon={<TrendingUp size={24} />}
          label="Measures"
        />
        <div className="relative -mt-12">
          <button 
            id="nav-dashboard-btn"
            onClick={() => setActiveTab('dashboard')}
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl",
              activeTab === 'dashboard' 
                ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white scale-110 rotate-0 shadow-blue-300" 
                : "bg-white text-slate-400 scale-100 rotate-45 shadow-slate-200"
            )}
          >
            <LayoutDashboard size={28} />
          </button>
        </div>
        <NavButton 
          active={activeTab === 'meals'} 
          onClick={() => setActiveTab('meals')}
          icon={<UtensilsCrossed size={24} />}
          label="Meals"
        />
      </nav>
    </div>
  );
}

function NavButton({ active, icon, label, onClick }: { active: boolean, icon: ReactNode, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-all duration-300",
        active ? "text-blue-600 scale-110" : "text-slate-300"
      )}
    >
      {icon}
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}

function MacroBadge({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="bg-slate-50 px-2 py-1 rounded-lg flex items-baseline gap-0.5">
      <span className="text-[10px] font-black text-slate-400 uppercase">{label}</span>
      <span className={cn("text-xs font-black", color)}>{value}g</span>
    </div>
  );
}
