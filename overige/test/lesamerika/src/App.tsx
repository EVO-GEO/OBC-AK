/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flag, 
  Map as MapIcon, 
  BarChart3, 
  BookOpen, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  RotateCcw, 
  Info, 
  User, 
  Clock, 
  HelpCircle,
  Trophy,
  ArrowRightLeft
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Fix Leaflet icon issue
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// --- Types ---
type TaskStatus = 'correct' | 'completed' | 'incorrect' | null;

interface TaskProgress {
  status: TaskStatus;
  attempts: number;
  answer?: string;
}

interface AppState {
  currentTab: number;
  completedTasks: Record<string, TaskProgress>;
  lastUpdated: number;
}

// --- Constants ---
const STORAGE_KEY = 'geo_les_us_politics';
const THEME = {
  blue: '#002868',
  red: '#bf0a30',
  white: '#ffffff',
  bg: '#f4f7f9',
};

// --- Components ---

const ProgressBar = ({ progress }: { progress: number }) => (
  <div className="fixed top-0 left-0 w-full h-[70px] bg-white border-b-2 border-slate-200 flex items-center px-6 z-[1000] shadow-sm">
    <span className="font-extrabold text-[#002868] whitespace-nowrap">🇺🇸 Voortgang:</span>
    <div className="flex-grow h-3 bg-slate-100 rounded-full mx-4 overflow-hidden">
      <motion.div 
        className="h-full bg-gradient-to-r from-[#bf0a30] to-[#002868]"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5 }}
      />
    </div>
    <span className="font-extrabold text-[#002868] min-w-[50px]">{Math.round(progress)}%</span>
  </div>
);

const TabButton = ({ index, title, active, completed, onClick }: any) => (
  <button
    onClick={() => onClick(index)}
    className={`px-5 py-2 rounded-full font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
      active 
        ? 'bg-white text-[#002868] shadow-md' 
        : 'bg-white/10 text-white hover:bg-white/20'
    }`}
  >
    <span className="opacity-70 text-xs">{index + 1}.</span>
    {title}
    {completed && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
  </button>
);

const Card = ({ children, variant = 'blue', title, icon: Icon }: any) => (
  <div className={`bg-white rounded-2xl p-8 mb-8 shadow-sm border-l-[6px] ${variant === 'red' ? 'border-[#bf0a30]' : 'border-[#002868]'}`}>
    {Icon && <Icon className={`w-10 h-10 mb-4 ${variant === 'red' ? 'text-[#bf0a30]' : 'text-[#002868]'}`} />}
    {title && <h2 className="text-2xl font-bold text-[#002868] mb-6">{title}</h2>}
    {children}
  </div>
);

const Feedback = ({ type, message }: { type: 'hint' | 'success' | 'error' | null, message: string }) => {
  if (!type) return null;
  const styles = {
    hint: 'bg-amber-50 border-amber-200 text-amber-800',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-red-50 border-red-200 text-red-800'
  };
  return (
    <motion.div 
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mt-4 p-4 rounded-lg border font-semibold ${styles[type]}`}
    >
      {message}
    </motion.div>
  );
};

// --- Main App ---

export default function App() {
  const [state, setState] = useState<AppState>({
    currentTab: 0,
    completedTasks: {},
    lastUpdated: Date.now()
  });

  const [isLoaded, setIsLoaded] = useState(false);

  // Load state
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setState(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load state', e);
    }
    setIsLoaded(true);
  }, []);

  // Save state
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (e) {
        console.error('Failed to save state', e);
      }
    }
  }, [state, isLoaded]);

  const updateTask = (taskId: string, status: TaskStatus, attempts: number = 0, answer?: string) => {
    setState(prev => ({
      ...prev,
      completedTasks: {
        ...prev.completedTasks,
        [taskId]: { 
          status, 
          attempts: (prev.completedTasks[taskId]?.attempts || 0) + attempts,
          answer: answer || prev.completedTasks[taskId]?.answer
        }
      },
      lastUpdated: Date.now()
    }));
  };

  const resetTab = (tabIndex: number) => {
    // Find tasks in this tab and reset them
    // This is a bit complex since we don't have a strict mapping here, 
    // but we can just clear all for simplicity or target specific ones.
    // For this demo, we'll just clear the state for that tab's tasks if we had a list.
    // Let's just allow a full reset for now as per the "clear progress" button.
  };

  const totalTasks = 13;
  const completedCount = (Object.values(state.completedTasks) as TaskProgress[]).filter(t => t.status === 'correct' || t.status === 'completed').length;
  const progress = (completedCount / totalTasks) * 100;

  const tabs = [
    "Welkom", "De Partijen", "Symbolen", "Standpunten", "De President", "Kiesstelsel", "De Kaart", "VS vs NL", "Afsluiting"
  ];

  const switchTab = (index: number) => {
    if (index >= 0 && index < tabs.length) {
      setState(prev => ({ ...prev, currentTab: index }));
      window.scrollTo(0, 0);
    }
  };

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen bg-[#f4f7f9] pt-[70px] pb-24 font-['Nunito'] text-slate-900">
      <ProgressBar progress={progress} />

      {/* Navigation Tabs */}
      <div className="bg-[#002868] py-3 sticky top-[70px] z-[999] overflow-x-auto shadow-md">
        <div className="max-w-[1200px] mx-auto px-6 flex gap-3">
          {tabs.map((title, i) => (
            <TabButton 
              key={i}
              index={i}
              title={title}
              active={state.currentTab === i}
              completed={false} // Would need logic to check if all tasks in tab are done
              onClick={switchTab}
            />
          ))}
        </div>
      </div>

      <main className="max-w-[1000px] mx-auto px-6 mt-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={state.currentTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-[#bf0a30] text-white px-3 py-1 rounded-full text-xs font-bold inline-block mb-4">
              Onderdeel {state.currentTab + 1} van {tabs.length}
            </div>

            {state.currentTab === 0 && <SectionWelkom onComplete={(status) => updateTask('q1', status)} progress={state.completedTasks['q1']} />}
            {state.currentTab === 1 && <SectionPartijen state={state} updateTask={updateTask} />}
            {state.currentTab === 2 && <SectionSymbolen state={state} updateTask={updateTask} />}
            {state.currentTab === 3 && <SectionStandpunten state={state} updateTask={updateTask} />}
            {state.currentTab === 4 && <SectionPresident state={state} updateTask={updateTask} />}
            {state.currentTab === 5 && <SectionKiesstelsel state={state} updateTask={updateTask} />}
            {state.currentTab === 6 && <SectionKaart state={state} updateTask={updateTask} />}
            {state.currentTab === 7 && <SectionVergelijking state={state} updateTask={updateTask} />}
            {state.currentTab === 8 && <SectionAfsluiting state={state} updateTask={updateTask} score={progress} onReset={() => {
              localStorage.removeItem(STORAGE_KEY);
              window.location.reload();
            }} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer Nav */}
      <div className="fixed bottom-0 left-0 w-full bg-white p-4 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-[998]">
        <button 
          onClick={() => switchTab(state.currentTab - 1)}
          disabled={state.currentTab === 0}
          className="flex items-center gap-2 px-6 py-3 rounded-full font-bold bg-slate-100 text-slate-700 disabled:opacity-30"
        >
          <ChevronLeft className="w-5 h-5" /> Vorige
        </button>
        <button 
          onClick={() => switchTab(state.currentTab + 1)}
          disabled={state.currentTab === tabs.length - 1}
          className="flex items-center gap-2 px-8 py-3 rounded-full font-bold bg-[#002868] text-white disabled:opacity-30"
        >
          Volgende <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

// --- Section Components ---

function SectionWelkom({ onComplete, progress }: any) {
  return (
    <Card title="Welkom in Amerika!" icon={Flag}>
      <p className="text-lg leading-relaxed mb-6">
        Hoi! Vandaag gaan we een reis maken naar de Verenigde Staten van Amerika (VS). Je ziet de VS vaak in het nieuws of in films. Het is een enorm land, wel 240 keer zo groot als Nederland! Omdat het zo groot en machtig is, is wat daar gebeurt ook belangrijk voor ons.
      </p>
      <p className="text-lg leading-relaxed mb-6">
        In deze les leer je hoe de politiek daar werkt. Wie zijn de baas? Hoe worden ze gekozen? En waarom is dat anders dan in Nederland? We gaan kijken naar de twee grote partijen die daar de dienst uitmaken.
      </p>
      
      <div className="bg-sky-50 rounded-2xl p-6 border border-sky-100 mb-8">
        <h4 className="flex items-center gap-2 font-bold text-sky-800 mb-2">
          <MapIcon className="w-5 h-5" /> Koppeling met jouw wereld
        </h4>
        <p className="text-sky-900">
          Heb jij wel eens een Amerikaanse film gekeken of een game gespeeld (zoals GTA of Fortnite)? De makers van die spullen wonen in de wereld waar we het vandaag over hebben. Hun regels en ideeën bepalen soms ook wat jij op je scherm ziet!
        </p>
      </div>

      <Quiz 
        id="q1"
        question="Waar liggen de VS?"
        options={[
          { text: "Europa", correct: false, hint: "Kijk eens naar het westen, over de Atlantische Oceaan!" },
          { text: "Noord-Amerika", correct: true },
          { text: "Zuid-Amerika", correct: false, hint: "Dat is het werelddeel ten zuiden van de VS." }
        ]}
        progress={progress}
        onComplete={onComplete}
      />
    </Card>
  );
}

function SectionPartijen({ state, updateTask }: any) {
  return (
    <Card title="Democraten vs. Republikeinen" icon={ArrowRightLeft} variant="red">
      <p className="mb-4">In Nederland hebben we wel 15 of 20 partijen in de Tweede Kamer. In de VS is dat heel anders. Daar heb je eigenlijk maar twee partijen die echt macht hebben: de <strong>Democraten</strong> en de <strong>Republikeinen</strong>.</p>
      <p className="mb-4">De Democraten zijn vaak 'links' of 'progressief'. Zij vinden dat de overheid veel moet regelen, zoals goede zorg voor iedereen en het beschermen van de natuur. De Republikeinen zijn 'rechts' of 'conservatief'. Zij vinden dat mensen het vooral zelf moeten uitzoeken en dat de overheid zich er niet te veel mee moet bemoeien.</p>
      
      <MatchingTask 
        id="m1"
        title="Opdracht 2: Wie vindt wat?"
        sources={[{ id: 'A', text: 'Democraten 🔵' }, { id: 'B', text: 'Republikeinen 🔴' }]}
        targets={[
          { id: 'T1', text: 'Willen minder regels van de overheid', match: 'B' },
          { id: 'T2', text: 'Willen dat de overheid meer helpt bij zorg', match: 'A' }
        ]}
        progress={state.completedTasks['m1']}
        onComplete={(status, attempts) => updateTask('m1', status, attempts)}
      />

      <OpenQuestion 
        id="o1"
        title="Opdracht 3: Jouw mening"
        question="In Nederland hebben we veel partijen, in de VS maar twee. Wat lijkt jou fijner en waarom? (Schrijf minstens 2 zinnen)."
        example="Ik vind het fijner om veel partijen te hebben, omdat je dan meer smaken hebt om uit te kiezen. Zo is er altijd wel een partij die precies vindt wat ik ook vind."
        progress={state.completedTasks['o1']}
        onComplete={(status) => updateTask('o1', status)}
      />
    </Card>
  );
}

function SectionSymbolen({ state, updateTask }: any) {
  return (
    <Card title="Ezels en Olifanten" icon={BookOpen}>
      <p className="mb-4">Wist je dat de partijen in de VS dieren als symbool hebben? De Democraten hebben de <strong>Ezel</strong> en de Republikeinen de <strong>Olifant</strong>.</p>
      <div className="flex justify-around text-6xl my-8">
        <motion.div whileHover={{ scale: 1.2 }}>🫏</motion.div>
        <motion.div whileHover={{ scale: 1.2 }}>🐘</motion.div>
      </div>
      <p className="mb-4">De ezel werd vroeger als belediging gebruikt, maar de Democraten maakten er een compliment van: een ezel is koppig en geeft nooit op! De olifant staat voor kracht en waardigheid.</p>
      
      <SortTask 
        id="s1"
        title="Opdracht 4: Sorteer de symbolen"
        items={[
          { id: '1', text: '🔵 Kleur: Blauw (Democraten)' },
          { id: '2', text: '🫏 Dier: Ezel (Democraten)' },
          { id: '3', text: '🔴 Kleur: Rood (Republikeinen)' },
          { id: '4', text: '🐘 Dier: Olifant (Republikeinen)' }
        ]}
        progress={state.completedTasks['s1']}
        onComplete={(status, attempts) => updateTask('s1', status, attempts)}
      />
    </Card>
  );
}

function SectionStandpunten({ state, updateTask }: any) {
  const data = {
    labels: ['Economie', 'Klimaat', 'Onderwijs', 'Wapens'],
    datasets: [
      {
        label: 'Democraten',
        data: [60, 90, 80, 85],
        backgroundColor: 'rgba(0, 40, 104, 0.7)',
      },
      {
        label: 'Republikeinen',
        data: [95, 30, 75, 40],
        backgroundColor: 'rgba(191, 10, 48, 0.7)',
      },
    ],
  };

  return (
    <Card title="Wat willen ze bereiken?" icon={BarChart3} variant="red">
      <p className="mb-4">Politiek gaat over keuzes maken. Een belangrijk punt is <strong>wapenbezit</strong>. Republikeinen vinden dat dit een recht is. Democraten willen vaak strengere regels.</p>
      
      <div className="h-[300px] w-full mb-8">
        <Bar data={data} options={{ responsive: true, maintainAspectRatio: false }} />
      </div>

      <Quiz 
        id="c1"
        question="Welk onderwerp vinden Republikeinen (Rood) belangrijker dan Democraten (Blauw) volgens de grafiek?"
        options={[
          { text: "Klimaat", correct: false, hint: "Kijk naar de blauwe balk, die is daar juist hoger." },
          { text: "Economie", correct: true },
          { text: "Onderwijs", correct: false, hint: "De balken zijn hier bijna even hoog." }
        ]}
        progress={state.completedTasks['c1']}
        onComplete={(status) => updateTask('c1', status)}
      />

      <OpenQuestion 
        id="o2"
        title="Opdracht 6: In jouw buurt"
        question="Kijk eens om je heen in je eigen dorp of stad. Zie je daar iets waarvan je denkt: 'Hier moet de overheid meer geld aan uitgeven'? Leg uit wat en waarom."
        example="Ik vind dat er meer geld moet naar fietspaden in mijn buurt, omdat er nu veel gaten in het asfalt zitten en dat gevaarlijk is voor leerlingen die naar school fietsen."
        progress={state.completedTasks['o2']}
        onComplete={(status) => updateTask('o2', status)}
      />
    </Card>
  );
}

function SectionPresident({ state, updateTask }: any) {
  return (
    <Card title="De President" icon={User}>
      <p className="mb-4">De president van de VS is de leider van het land. Hij of zij woont in het <strong>Witte Huis</strong> in Washington D.C. De president wordt voor <strong>4 jaar</strong> gekozen.</p>
      
      <Quiz 
        id="q2"
        question="Als een president in 2024 wordt gekozen, wanneer zijn dan de volgende verkiezingen?"
        options={[
          { text: "2026", correct: false, hint: "Dat is maar 2 jaar, dat is te kort." },
          { text: "2028", correct: true },
          { text: "2030", correct: false, hint: "Dat is 6 jaar, dat klopt niet." }
        ]}
        progress={state.completedTasks['q2']}
        onComplete={(status) => updateTask('q2', status)}
      />

      <SortTask 
        id="s2"
        title="Opdracht 8: De weg naar het Witte Huis"
        items={[
          { id: '1', text: '1. De partijen kiezen hun beste kandidaat' },
          { id: '2', text: '2. De kandidaten voeren campagne' },
          { id: '3', text: '3. De burgers gaan stemmen in november' },
          { id: '4', text: '4. De nieuwe president wordt beëdigd in januari' }
        ]}
        progress={state.completedTasks['s2']}
        onComplete={(status, attempts) => updateTask('s2', status, attempts)}
      />
    </Card>
  );
}

function SectionKiesstelsel({ state, updateTask }: any) {
  return (
    <Card title="Winner-takes-all" icon={Trophy} variant="red">
      <p className="mb-4">In de VS gaat het per staat. Als je in een staat de meeste stemmen krijgt, krijg je <strong>alle</strong> punten van die staat. Dit noemen we <strong>Winner-takes-all</strong>.</p>
      
      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-6">
        <p className="italic text-slate-700">"Het is een beetje alsof je met voetbal wint met 1-0; je krijgt de volle 3 punten, ook al was het verschil heel klein."</p>
      </div>

      <Quiz 
        id="q3"
        question="In de staat Texas wint de Republikeinse kandidaat met een klein verschil. Wat gebeurt er met de punten van Texas?"
        options={[
          { text: "De punten worden verdeeld.", correct: false, hint: "Nee, dat gebeurt in Nederland, maar niet in de VS." },
          { text: "De Republikein krijgt alle punten.", correct: true },
          { text: "Niemand krijgt punten.", correct: false, hint: "Dat zou niet eerlijk zijn voor de winnaar." }
        ]}
        progress={state.completedTasks['q3']}
        onComplete={(status) => updateTask('q3', status)}
      />
    </Card>
  );
}

function SectionKaart({ state, updateTask }: any) {
  const locations = [
    { name: "San Francisco", coords: [37.7749, -122.4194] as [number, number], color: "blue", desc: "Vaste Democratische staat." },
    { name: "Philadelphia", coords: [39.9526, -75.1652] as [number, number], color: "purple", desc: "Belangrijke Swing State!" },
    { name: "Phoenix", coords: [33.4484, -112.0740] as [number, number], color: "purple", desc: "Een staat die vaak wisselt." },
    { name: "Houston", coords: [29.7604, -95.3698] as [number, number], color: "red", desc: "Vaste Republikeinse staat." }
  ];

  return (
    <Card title="Swing States en Vaste Staten" icon={MapIcon}>
      <p className="mb-4">Sommige staten zijn voorspelbaar ('vaste staten'), andere zijn elke keer weer spannend ('Swing States').</p>
      
      <div className="h-[400px] w-full rounded-xl overflow-hidden border-2 border-slate-200 mb-8">
        <MapContainer center={[37.8, -96]} zoom={4} style={{ height: '100%', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {locations.map((loc, i) => (
            <Marker key={i} position={loc.coords}>
              <Popup>
                <div className="font-bold">{loc.name}</div>
                <div>{loc.desc}</div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <Quiz 
        id="q4"
        question="Welke stad ligt in een staat die bekend staat als een echte 'Democratische' vaste staat (Blauw)?"
        options={[
          { text: "San Francisco", correct: true },
          { text: "Philadelphia", correct: false, hint: "Pennsylvania is vaak een Swing State!" },
          { text: "Phoenix", correct: false, hint: "Arizona 'swingt' tegenwoordig vaak." }
        ]}
        progress={state.completedTasks['q4']}
        onComplete={(status) => updateTask('q4', status)}
      />
    </Card>
  );
}

function SectionVergelijking({ state, updateTask }: any) {
  return (
    <Card title="VS vs Nederland" icon={HelpCircle} variant="red">
      <p className="mb-4">In Nederland hebben we een koning en een Minister-President. In de VS is de president zowel het staatshoofd als de leider van de regering.</p>
      
      <MatchingTask 
        id="m2"
        title="Opdracht 11: Nederland of VS?"
        sources={[{ id: 'NL', text: 'Nederland 🇳🇱' }, { id: 'US', text: 'Verenigde Staten 🇺🇸' }]}
        targets={[
          { id: 'T1', text: 'Veel verschillende partijen in de Kamer', match: 'NL' },
          { id: 'T2', text: 'De president is de baas van het leger', match: 'US' }
        ]}
        progress={state.completedTasks['m2']}
        onComplete={(status, attempts) => updateTask('m2', status, attempts)}
      />

      <OpenQuestion 
        id="o3"
        title="Opdracht 12: Samenvatting"
        question="Noem één groot verschil tussen de politiek in de VS en in Nederland en leg uit waarom dat een belangrijk verschil is."
        example="In de VS heb je maar twee partijen en in Nederland heel veel. Dit is belangrijk omdat je in Nederland meer keuze hebt, maar in de VS is het duidelijker wie er gaat winnen."
        progress={state.completedTasks['o3']}
        onComplete={(status) => updateTask('o3', status)}
      />
    </Card>
  );
}

function SectionAfsluiting({ state, updateTask, score, onReset }: any) {
  return (
    <Card title="Gefeliciteerd!" icon={Trophy}>
      <div className="text-center py-8">
        <div className="text-6xl font-black text-[#002868] mb-2">{Math.round(score)}%</div>
        <p className="text-xl font-bold text-slate-600">Je hebt de les afgerond!</p>
      </div>

      <OpenQuestion 
        id="o4"
        title="Reflectie"
        question="Wat vond je het meest verrassende dat je vandaag hebt geleerd over de VS? Leg uit waarom."
        example="Ik vond het verrassend dat de winnaar van een staat alle punten krijgt. Dat lijkt me soms niet eerlijk voor de mensen die op de andere partij hebben gestemd."
        progress={state.completedTasks['o4']}
        onComplete={(status) => updateTask('o4', status)}
      />

      <button 
        onClick={onReset}
        className="mt-12 flex items-center gap-2 text-red-600 font-bold hover:underline"
      >
        <RotateCcw className="w-4 h-4" /> Voortgang wissen en opnieuw beginnen
      </button>
    </Card>
  );
}

// --- Interactive Components ---

function Quiz({ id, question, options, progress, onComplete }: any) {
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'hint' | 'success' | 'error' | null, message: string }>({ type: null, message: '' });

  const handleSelect = (idx: number) => {
    if (progress?.status) return;
    setSelected(idx);
    const opt = options[idx];
    if (opt.correct) {
      setFeedback({ type: 'success', message: 'Helemaal goed!' });
      onComplete('correct');
    } else {
      const attempts = (progress?.attempts || 0) + 1;
      if (attempts >= 2) {
        setFeedback({ type: 'error', message: 'Helaas. Het goede antwoord was: ' + options.find((o: any) => o.correct).text });
        onComplete('completed', 1);
      } else {
        setFeedback({ type: 'hint', message: opt.hint || 'Probeer het nog eens!' });
        onComplete(null, 1);
      }
    }
  };

  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold mb-4">{question}</h3>
      <div className="space-y-3">
        {options.map((opt: any, i: number) => (
          <button
            key={i}
            disabled={!!progress?.status}
            onClick={() => handleSelect(i)}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
              selected === i 
                ? (opt.correct ? 'bg-emerald-50 border-emerald-500' : 'bg-red-50 border-red-500')
                : 'bg-slate-50 border-slate-200 hover:border-[#002868]'
            } ${progress?.status && opt.correct ? 'bg-emerald-50 border-emerald-500' : ''}`}
          >
            {opt.text}
          </button>
        ))}
      </div>
      <Feedback type={feedback.type} message={feedback.message} />
    </div>
  );
}

function OpenQuestion({ id, title, question, example, progress, onComplete }: any) {
  const [text, setText] = useState(progress?.answer || '');
  const [showExample, setShowExample] = useState(!!progress?.status);

  const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;

  return (
    <div className="mt-8 border-t pt-8">
      <h3 className="text-xl font-bold mb-4">{title}</h3>
      <p className="mb-4">{question}</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={!!progress?.status}
        className="w-full h-32 p-4 rounded-xl border-2 border-slate-200 focus:border-[#002868] outline-none transition-all"
        placeholder="Typ hier je antwoord..."
      />
      <div className="flex justify-between items-center mt-2">
        <span className={`text-sm font-bold ${wordCount >= 20 ? 'text-emerald-600' : 'text-slate-400'}`}>
          Woorden: {wordCount} / 20
        </span>
        {!progress?.status && (
          <button
            disabled={wordCount < 20}
            onClick={() => setShowExample(true)}
            className="bg-[#002868] text-white px-6 py-2 rounded-full font-bold disabled:opacity-30"
          >
            Verstuur antwoord
          </button>
        )}
      </div>

      {showExample && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 p-6 bg-slate-50 rounded-xl border border-slate-200">
          <p className="font-bold text-slate-500 text-xs uppercase mb-2">Voorbeeldantwoord:</p>
          <p className="text-slate-800 mb-6">{example}</p>
          {!progress?.status && (
            <div className="flex gap-3">
              <button onClick={() => onComplete('correct')} className="bg-emerald-500 text-white px-6 py-2 rounded-full font-bold">Goed ✓</button>
              <button onClick={() => onComplete('completed')} className="bg-slate-200 text-slate-700 px-6 py-2 rounded-full font-bold">Nog even oefenen ✗</button>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

function MatchingTask({ id, title, sources, targets, progress, onComplete }: any) {
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [pairs, setPairs] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ type: 'hint' | 'success' | 'error' | null, message: string }>({ type: null, message: '' });

  const handleTargetClick = (targetId: string) => {
    if (progress?.status || !selectedSource) return;
    setPairs(prev => ({ ...prev, [targetId]: selectedSource }));
    setSelectedSource(null);
  };

  const check = () => {
    const allCorrect = targets.every((t: any) => pairs[t.id] === t.match);
    if (allCorrect) {
      setFeedback({ type: 'success', message: 'Helemaal goed!' });
      onComplete('correct');
    } else {
      const attempts = (progress?.attempts || 0) + 1;
      if (attempts >= 2) {
        setFeedback({ type: 'error', message: 'Helaas. Kijk goed naar de juiste antwoorden.' });
        onComplete('completed', 1);
      } else {
        setFeedback({ type: 'hint', message: 'Nog niet helemaal. Probeer het nog eens!' });
        onComplete(null, 1);
      }
    }
  };

  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold mb-4">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          {sources.map((s: any) => (
            <button
              key={s.id}
              onClick={() => setSelectedSource(s.id)}
              className={`w-full p-4 rounded-xl border-2 transition-all font-bold ${
                selectedSource === s.id ? 'border-[#002868] bg-sky-50' : 'border-slate-200 bg-white'
              }`}
            >
              {s.text}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          {targets.map((t: any) => (
            <button
              key={t.id}
              onClick={() => handleTargetClick(t.id)}
              className={`w-full p-4 rounded-xl border-2 transition-all min-h-[60px] ${
                pairs[t.id] ? 'border-emerald-500 bg-emerald-50 font-bold' : 'border-slate-200 bg-white'
              }`}
            >
              {pairs[t.id] ? `${sources.find((s: any) => s.id === pairs[t.id]).text} ➔ ` : ''}
              {t.text}
            </button>
          ))}
        </div>
      </div>
      {!progress?.status && (
        <button onClick={check} className="mt-6 bg-[#002868] text-white px-8 py-2 rounded-full font-bold">Controleer Koppelingen</button>
      )}
      <Feedback type={feedback.type} message={feedback.message} />
    </div>
  );
}

function SortTask({ id, title, items, progress, onComplete }: any) {
  const [list, setList] = useState(items);
  const [feedback, setFeedback] = useState<{ type: 'hint' | 'success' | 'error' | null, message: string }>({ type: null, message: '' });

  const handleDragStart = (e: any, index: number) => {
    e.dataTransfer.setData('index', index);
  };

  const handleDrop = (e: any, index: number) => {
    const fromIndex = e.dataTransfer.getData('index');
    const newList = [...list];
    const item = newList.splice(fromIndex, 1)[0];
    newList.splice(index, 0, item);
    setList(newList);
  };

  const check = () => {
    const correct = list.every((item: any, i: number) => item.id === (i + 1).toString());
    if (correct) {
      setFeedback({ type: 'success', message: 'Perfect gesorteerd!' });
      onComplete('correct');
    } else {
      const attempts = (progress?.attempts || 0) + 1;
      if (attempts >= 2) {
        setFeedback({ type: 'error', message: 'Helaas. De volgorde is nu aangepast naar de juiste.' });
        setList([...items].sort((a, b) => a.id.localeCompare(b.id)));
        onComplete('completed', 1);
      } else {
        setFeedback({ type: 'hint', message: 'Nog niet helemaal goed. Sleep de blokjes naar de juiste plek.' });
        onComplete(null, 1);
      }
    }
  };

  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold mb-4">{title}</h3>
      <div className="space-y-2">
        {list.map((item: any, i: number) => (
          <div
            key={item.id}
            draggable={!progress?.status}
            onDragStart={(e) => handleDragStart(e, i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, i)}
            className="p-4 bg-white border-2 border-slate-200 rounded-xl cursor-grab active:cursor-grabbing flex items-center gap-3"
          >
            <div className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center text-xs font-bold text-slate-400">{i + 1}</div>
            {item.text}
          </div>
        ))}
      </div>
      {!progress?.status && (
        <button onClick={check} className="mt-6 bg-[#002868] text-white px-8 py-2 rounded-full font-bold">Controleer Volgorde</button>
      )}
      <Feedback type={feedback.type} message={feedback.message} />
    </div>
  );
}
