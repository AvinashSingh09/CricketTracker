import { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function MatchSetupPage({ onStartMatch }) {
    const { teams, match, setupMatch, startMatch, resetPlayerStats } = useApp();

    const [matchName, setMatchName] = useState(match.name || '');
    const [oversLimit, setOversLimit] = useState(match.oversLimit || '');
    const [battingTeamId, setBattingTeamId] = useState(match.battingTeamId || '');
    const [error, setError] = useState('');

    const teamAPlayers = teams.teamA.playerIds;
    const teamBPlayers = teams.teamB.playerIds;
    const canStart = teamAPlayers.length >= 1 && teamBPlayers.length >= 1 && battingTeamId;

    const handleStartMatch = () => {
        setError('');

        if (!battingTeamId) {
            setError('Please select which team will bat first');
            return;
        }

        if (teamAPlayers.length < 1 || teamBPlayers.length < 1) {
            setError('Both teams need at least 1 player');
            return;
        }

        // Reset player stats for new match
        resetPlayerStats();

        // Setup match configuration
        setupMatch({
            name: matchName.trim() || 'Office Match',
            oversLimit: oversLimit ? parseInt(oversLimit) : null,
            battingTeamId,
            bowlingTeamId: battingTeamId === 'team-a' ? 'team-b' : 'team-a',
            currentBatsmanIds: [],
            currentBowlerId: null,
            totalRuns: 0,
            wickets: 0,
            totalBalls: 0,
            extras: { wides: 0, noBalls: 0 },
            ballByBall: []
        });

        startMatch();
        onStartMatch?.();
    };

    return (
        <div className="animate-fade-in">
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-1">Match Setup</h1>
                <p className="text-gray-400 text-sm">Configure the match settings</p>
            </div>

            {/* Teams Summary */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="card team-card team-a text-center py-5">
                    <div className="w-16 h-16 mx-auto bg-white/10 rounded-xl p-2 flex items-center justify-center mb-3 shadow-lg border border-white/10">
                        <img src="/A.png" alt="Team A" className="w-full h-full object-contain filter drop-shadow" />
                    </div>
                    <div className="text-blue-400 font-bold">{teams.teamA.name}</div>
                    <div className="text-3xl font-bold mt-2">{teamAPlayers.length}</div>
                    <div className="text-gray-500 text-xs uppercase tracking-wider">players</div>
                </div>
                <div className="card team-card team-b text-center py-5">
                    <div className="w-16 h-16 mx-auto bg-white/10 rounded-xl p-2 flex items-center justify-center mb-3 shadow-lg border border-white/10">
                        <img src="/B.png" alt="Team B" className="w-full h-full object-contain filter drop-shadow" />
                    </div>
                    <div className="text-yellow-400 font-bold">{teams.teamB.name}</div>
                    <div className="text-3xl font-bold mt-2">{teamBPlayers.length}</div>
                    <div className="text-gray-500 text-xs uppercase tracking-wider">players</div>
                </div>
            </div>

            {/* Match Configuration */}
            <div className="space-y-5">
                {/* Match Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                        Match Name <span className="text-gray-600">(Optional)</span>
                    </label>
                    <input
                        type="text"
                        value={matchName}
                        onChange={(e) => setMatchName(e.target.value)}
                        placeholder="e.g., Office Finals 2024"
                        className="input"
                        maxLength={50}
                    />
                </div>

                {/* Overs Limit */}
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                        Overs Limit <span className="text-gray-600">(Optional)</span>
                    </label>
                    <input
                        type="number"
                        value={oversLimit}
                        onChange={(e) => setOversLimit(e.target.value)}
                        placeholder="e.g., 6 (leave empty for unlimited)"
                        className="input"
                        min="1"
                        max="50"
                    />
                    <p className="text-gray-600 text-xs mt-1.5">Leave empty for unlimited overs</p>
                </div>

                {/* Batting Team Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-3">
                        Which team bats first? <span className="text-red-400">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setBattingTeamId('team-a')}
                            className={`p-5 rounded-xl border-2 transition-all ${battingTeamId === 'team-a'
                                ? 'border-blue-500 bg-blue-500/15'
                                : 'border-[#2A3F5F] hover:border-[#3B5278] bg-[#1A2744]'
                                }`}
                        >
                            <div className="w-16 h-16 mx-auto bg-white/10 rounded-xl p-2 flex items-center justify-center mb-3 shadow-lg border border-white/10">
                                <img src="/A.png" alt="Team A" className="w-full h-full object-contain filter drop-shadow" />
                            </div>
                            <div className={`font-bold ${battingTeamId === 'team-a' ? 'text-blue-400' : 'text-white'}`}>
                                {teams.teamA.name}
                            </div>
                            <div className="text-gray-500 text-xs mt-1">Bats First</div>
                        </button>
                        <button
                            onClick={() => setBattingTeamId('team-b')}
                            className={`p-5 rounded-xl border-2 transition-all ${battingTeamId === 'team-b'
                                ? 'border-yellow-500 bg-yellow-500/15'
                                : 'border-[#2A3F5F] hover:border-[#3B5278] bg-[#1A2744]'
                                }`}
                        >
                            <div className="w-16 h-16 mx-auto bg-white/10 rounded-xl p-2 flex items-center justify-center mb-3 shadow-lg border border-white/10">
                                <img src="/B.png" alt="Team B" className="w-full h-full object-contain filter drop-shadow" />
                            </div>
                            <div className={`font-bold ${battingTeamId === 'team-b' ? 'text-yellow-400' : 'text-white'}`}>
                                {teams.teamB.name}
                            </div>
                            <div className="text-gray-500 text-xs mt-1">Bats First</div>
                        </button>
                    </div>
                </div>

                {/* Bowling Team Display */}
                {battingTeamId && (
                    <div className="p-4 bg-[#1A2744] border border-[#2A3F5F] rounded-xl animate-fade-in">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-white/10 p-1 flex items-center justify-center border border-white/10 shadow-lg">
                                <img src={battingTeamId === 'team-a' ? '/B.png' : '/A.png'} alt="Bowling Team" className="w-full h-full object-contain filter drop-shadow" />
                            </div>
                            <div>
                                <div className="text-gray-500 text-xs uppercase tracking-wider">Bowling First</div>
                                <div className={`font-bold text-lg ${battingTeamId === 'team-a' ? 'text-yellow-400' : 'text-blue-400'
                                    }`}>
                                    {battingTeamId === 'team-a' ? teams.teamB.name : teams.teamA.name}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-3">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {error}
                    </div>
                )}

                {/* Start Button */}
                <button
                    onClick={handleStartMatch}
                    disabled={!canStart}
                    className={`w-full btn text-lg py-4 mt-4 ${canStart
                        ? 'btn-primary'
                        : 'bg-[#243352] text-gray-500 cursor-not-allowed border border-[#2A3F5F]'
                        }`}
                >
                    <svg className="w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Start Match
                </button>

                {!canStart && (
                    <p className="text-center text-gray-600 text-sm">
                        {teamAPlayers.length < 1 || teamBPlayers.length < 1
                            ? 'Add players to both teams first'
                            : 'Select which team bats first'}
                    </p>
                )}
            </div>
        </div>
    );
}
