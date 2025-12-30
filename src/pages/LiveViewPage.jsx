import { useState, useEffect, useCallback } from 'react';
import { matchApi, teamsApi, playersApi } from '../services/api';
import { formatOvers, calculateStrikeRate } from '../utils/calculations';

export default function LiveViewPage() {
    const [match, setMatch] = useState(null);
    const [teams, setTeams] = useState(null);
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(null);

    // Fetch live data
    const fetchLiveData = useCallback(async () => {
        try {
            const [matchData, teamsData, playersData] = await Promise.all([
                matchApi.get(),
                teamsApi.get(),
                playersApi.getAll()
            ]);

            // Normalize players
            const normalizedPlayers = playersData.map(p => ({
                ...p,
                id: p._id?.toString() || p.id
            }));

            setMatch(matchData);
            setTeams(teamsData);
            setPlayers(normalizedPlayers);
            setLastUpdate(new Date());
        } catch (error) {
            console.error('Failed to fetch live data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load and polling
    useEffect(() => {
        fetchLiveData();

        // Poll every 5 seconds for live updates
        const interval = setInterval(fetchLiveData, 5000);

        return () => clearInterval(interval);
    }, [fetchLiveData]);

    // Helper to get player by ID
    const getPlayer = (id) => players.find(p => p.id === id);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0A0F1C]">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-4xl animate-pulse">
                        🏏
                    </div>
                    <p className="text-gray-400 text-lg">Loading live score...</p>
                </div>
            </div>
        );
    }

    if (!match || match.status === 'setup') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0A0F1C] p-6">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gray-800 flex items-center justify-center text-5xl">
                        ⏳
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3">No Live Match</h2>
                    <p className="text-gray-400">
                        There's no match currently in progress. Check back when a match starts!
                    </p>
                    <button
                        onClick={fetchLiveData}
                        className="mt-6 btn btn-primary"
                    >
                        Refresh
                    </button>
                </div>
            </div>
        );
    }

    const battingTeam = match.battingTeamId === 'team-a' ? teams?.teamA : teams?.teamB;
    const bowlingTeam = match.bowlingTeamId === 'team-a' ? teams?.teamA : teams?.teamB;

    const striker = match.currentBatsmanIds?.[0] ? getPlayer(match.currentBatsmanIds[0]) : null;
    const nonStriker = match.currentBatsmanIds?.[1] ? getPlayer(match.currentBatsmanIds[1]) : null;
    const currentBowler = match.currentBowlerId ? getPlayer(match.currentBowlerId) : null;

    const target = match.innings === 2 && match.firstInningsScore
        ? match.firstInningsScore.runs + 1
        : null;

    const currentRunRate = match.totalBalls > 0
        ? ((match.totalRuns / match.totalBalls) * 6).toFixed(2)
        : '0.00';

    const requiredRunRate = target && match.oversLimit
        ? (((target - match.totalRuns) / ((match.oversLimit * 6) - match.totalBalls)) * 6).toFixed(2)
        : null;

    // Get last 6 balls for "This Over" display
    const thisOverBalls = match.ballByBall?.slice(-6) || [];

    return (
        <div className="min-h-screen bg-[#0A0F1C] text-white">
            {/* Header */}
            <header className="bg-gradient-to-r from-[#0D1424] to-[#1A2744] border-b border-white/10 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-xl shadow-lg">
                            🏏
                        </div>
                        <div>
                            <h1 className="font-bold text-lg">Live Score</h1>
                            <p className="text-xs text-gray-500">{match.name || 'Cricket Match'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {match.status === 'live' && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/15 rounded-lg border border-red-500/30">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                <span className="text-red-400 text-xs font-bold uppercase">Live</span>
                            </div>
                        )}
                        <div className="text-xs text-gray-500">
                            Updated: {lastUpdate?.toLocaleTimeString()}
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto p-6">
                {/* Main Scoreboard */}
                <div className="card mb-6 border-t-4 border-t-emerald-500 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 pointer-events-none"
                        style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(16, 185, 129, 0.4), transparent 50%)' }}>
                    </div>

                    {/* Innings indicator */}
                    <div className="flex items-center justify-between mb-6 relative z-10">
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                            {match.innings === 2 ? '2nd Innings' : '1st Innings'}
                        </span>
                        {match.oversLimit && (
                            <span className="text-xs text-gray-500">{match.oversLimit} Overs Match</span>
                        )}
                    </div>

                    {/* Team & Score */}
                    <div className="flex items-center gap-4 relative z-10 mb-4">
                        <div className="w-16 h-16 bg-white/10 rounded-xl p-2 flex items-center justify-center border border-white/10">
                            <img
                                src={match.battingTeamId === 'team-a' ? '/A.png' : '/B.png'}
                                alt={battingTeam?.name}
                                className="w-full h-full object-contain"
                            />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold uppercase tracking-wide">{battingTeam?.name}</h2>
                            <div className="flex items-baseline gap-2 mt-1">
                                <span className="font-score text-6xl text-white">{match.totalRuns}</span>
                                <span className="font-score text-3xl text-gray-500">/{match.wickets}</span>
                                <span className="text-lg text-gray-400 ml-4">({formatOvers(match.totalBalls)} ov)</span>
                            </div>
                        </div>
                    </div>

                    {/* Run Rate & Target */}
                    <div className="flex flex-wrap gap-4 text-sm relative z-10 mt-6 pt-4 border-t border-white/10">
                        <div className="px-3 py-2 bg-white/5 rounded-lg">
                            <span className="text-gray-400">CRR: </span>
                            <span className="font-bold text-white">{currentRunRate}</span>
                        </div>
                        {target && (
                            <>
                                <div className="px-3 py-2 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                                    <span className="text-yellow-400">Target: </span>
                                    <span className="font-bold text-yellow-300">{target}</span>
                                </div>
                                <div className="px-3 py-2 bg-white/5 rounded-lg">
                                    <span className="text-gray-400">RRR: </span>
                                    <span className="font-bold text-white">{requiredRunRate}</span>
                                </div>
                                <div className="px-3 py-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                    <span className="text-emerald-400">Need: </span>
                                    <span className="font-bold text-emerald-300">
                                        {Math.max(0, target - match.totalRuns)} off {(match.oversLimit * 6) - match.totalBalls}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* First Innings Score (if 2nd innings) */}
                    {match.firstInningsScore && (
                        <div className="mt-4 pt-4 border-t border-white/10 text-sm text-gray-400">
                            {match.firstInningsScore.battingTeamId === 'team-a' ? teams?.teamA?.name : teams?.teamB?.name}:{' '}
                            <span className="text-white font-bold">
                                {match.firstInningsScore.runs}/{match.firstInningsScore.wickets}
                            </span>
                            {' '}({formatOvers(match.firstInningsScore.balls)} ov)
                        </div>
                    )}
                </div>

                {/* This Over */}
                <div className="card mb-6">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">This Over</h3>
                    <div className="flex gap-2 flex-wrap">
                        {thisOverBalls.length === 0 ? (
                            <span className="text-gray-500 text-sm">No balls yet</span>
                        ) : (
                            thisOverBalls.map((ball, i) => (
                                <div
                                    key={i}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 ${ball.isWicket ? 'bg-red-500/20 border-red-500 text-red-400' :
                                            ball.isWide || ball.isNoBall ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400' :
                                                ball.runs === 4 || ball.runs === 6 ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' :
                                                    'bg-white/5 border-white/20 text-white'
                                        }`}
                                >
                                    {ball.isWicket ? 'W' : ball.isWide ? 'WD' : ball.isNoBall ? 'NB' : ball.runs}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Batsmen & Bowler */}
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                    {/* Batsmen */}
                    <div className="card">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Batting</h3>
                        {striker && (
                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                    <span className="font-medium">{striker.name}*</span>
                                </div>
                                <div className="text-right">
                                    <span className="font-score text-xl">{striker.runs || 0}</span>
                                    <span className="text-gray-500 text-sm ml-1">({striker.balls || 0})</span>
                                </div>
                            </div>
                        )}
                        {nonStriker && (
                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                    <span className="font-medium">{nonStriker.name}</span>
                                </div>
                                <div className="text-right">
                                    <span className="font-score text-xl">{nonStriker.runs || 0}</span>
                                    <span className="text-gray-500 text-sm ml-1">({nonStriker.balls || 0})</span>
                                </div>
                            </div>
                        )}
                        {!striker && !nonStriker && (
                            <p className="text-gray-500 text-sm">Batsmen not selected</p>
                        )}
                    </div>

                    {/* Bowler */}
                    <div className="card">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Bowling</h3>
                        {currentBowler ? (
                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-sm">⚾</div>
                                    <span className="font-medium">{currentBowler.name}</span>
                                </div>
                                <div className="text-right">
                                    <span className="font-score text-xl text-red-400">{currentBowler.wickets || 0}</span>
                                    <span className="text-gray-500 text-sm">/{currentBowler.runsConceded || 0}</span>
                                    <span className="text-gray-500 text-sm ml-2">({formatOvers(currentBowler.oversBowled || 0)})</span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">Bowler not selected</p>
                        )}
                    </div>
                </div>

                {/* Match Complete Message */}
                {match.status === 'complete' && (
                    <div className="card text-center py-8 bg-gradient-to-r from-emerald-900/50 to-emerald-800/50 border-emerald-500/30">
                        <div className="text-5xl mb-4">🏆</div>
                        <h2 className="text-2xl font-bold text-white">Match Complete</h2>
                        <p className="text-gray-300 mt-2">Check the summary for full details</p>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="text-center py-6 text-gray-600 text-xs">
                Auto-refreshing every 5 seconds • Cricket Tracker
            </footer>
        </div>
    );
}
