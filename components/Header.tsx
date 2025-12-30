
import React from 'react';
import { Microscope, Package, Activity, BrainCircuit, BarChart3 } from 'lucide-react';
import { ViewMode } from '../types';

interface HeaderProps {
    activeView: ViewMode;
    labNodesCount: number;
    vaultNodesCount: number;
    simulating: boolean;
    onRunSimulation: () => void;
    diversityScore?: number; // New Prop
}

const Header: React.FC<HeaderProps> = ({ activeView, labNodesCount, vaultNodesCount, simulating, onRunSimulation, diversityScore = 0 }) => {
    
    // Calculate color based on score (0-4)
    const getScoreColor = (score: number) => {
        if (score === 0) return 'text-slate-300';
        if (score <= 1) return 'text-red-500';
        if (score <= 2) return 'text-orange-500';
        if (score <= 3) return 'text-blue-500';
        return 'text-emerald-500';
    };

    return (
        <div className="absolute top-0 left-0 w-full h-16 bg-white/80 backdrop-blur-sm border-b border-slate-200 flex items-center justify-between px-6 z-10">
            <div className="flex items-center gap-6">
                <div>
                    <h1 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        {activeView === 'LAB' ? <><Microscope className="w-4 h-4"/> Testing Lab</> : <><Package className="w-4 h-4 text-amber-500"/> Creative Vault</>}
                    </h1>
                    <p className="text-xs text-slate-400 font-mono">{activeView === 'LAB' ? `${labNodesCount} Assets Active` : `${vaultNodesCount} Winning Assets`}</p>
                </div>
                
                {/* DIVERSITY SCORE INDICATOR */}
                {activeView === 'LAB' && (
                    <div className="hidden md:flex flex-col border-l border-slate-200 pl-6">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <BarChart3 className="w-3 h-3"/> Andromeda Diversity
                        </span>
                        <div className={`text-sm font-bold flex items-center gap-1 ${getScoreColor(diversityScore)}`}>
                            Level {diversityScore}/4
                            <div className="flex gap-0.5 ml-2">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className={`w-2 h-1 rounded-full ${i <= diversityScore ? 'bg-current' : 'bg-slate-200'}`}></div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="flex items-center gap-4">
                 {activeView === 'LAB' && (
                     <button onClick={onRunSimulation} disabled={simulating} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-2">
                        <BrainCircuit className={`w-4 h-4 ${simulating ? 'animate-pulse text-indigo-500' : 'text-indigo-500'}`} />
                        {simulating ? 'Auditing Assets...' : 'Run Global Audit'}
                     </button>
                 )}
            </div>
        </div>
    );
};
export default Header;
