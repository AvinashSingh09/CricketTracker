import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatOvers, isOverComplete } from '../utils/calculations';

export default function ScoringPage({ onEndMatch }) {
    const {
        match,
        players,
        getPlayer,
        getTeamPlayers,
        getBattingTeam,
        getBowlingTeam,
        getTarget,
        recordBall,
        undoLastBall,
        selectBatsman,
        selectBowler,
        endInnings,
        startSecondInnings,
        completeMatch
    } = useApp();

    const [showBatsmanSelect, setShowBatsmanSelect] = useState(false);
    const [showBowlerSelect, setShowBowlerSelect] = useState(false);
    const [showWicketModal, setShowWicketModal] = useState(false);
    const [showInningsEndModal, setShowInningsEndModal] = useState(false);
    const [showOverCompleteModal, setShowOverCompleteModal] = useState(false);
    const [selectedPosition, setSelectedPosition] = useState(0);
    const [noBallMode, setNoBallMode] = useState(false);

    // Track the last over's bowler to prevent consecutive overs
    const [lastOverBowlerId, setLastOverBowlerId] = useState(null);

    const battingTeam = getBattingTeam();
    const bowlingTeam = getBowlingTeam();
    const target = getTarget();

    if (!battingTeam || !bowlingTeam) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-400">Match not configured properly</p>
            </div>
        );
    }

    const battingPlayers = getTeamPlayers(match.battingTeamId);
    const bowlingPlayers = getTeamPlayers(match.bowlingTeamId);

    const striker = match.currentBatsmanIds[0] ? getPlayer(match.currentBatsmanIds[0]) : null;
    const nonStriker = match.currentBatsmanIds[1] ? getPlayer(match.currentBatsmanIds[1]) : null;
    const currentBowler = match.currentBowlerId ? getPlayer(match.currentBowlerId) : null;

    const availableBatsmen = battingPlayers.filter(p => !p.isOut && !match.currentBatsmanIds.includes(p.id));
    const oversLimitReached = match.oversLimit && match.totalBalls >= match.oversLimit * 6;
    const allOut = match.wickets >= battingPlayers.length - 1;
    const targetAchieved = target && match.totalRuns >= target;

    // Get current over number (0-indexed)
    const currentOver = Math.floor(match.totalBalls / 6);
    const ballsInOver = match.totalBalls % 6;

    // Handle run scoring
    const handleScore = (runs) => {
        if (!striker || !currentBowler) {
            alert('Please select batsmen and bowler first');
            return;
        }

        const wasLegalDelivery = !noBallMode;
        const newTotalBalls = wasLegalDelivery ? match.totalBalls + 1 : match.totalBalls;

        recordBall({
            runs,
            isNoBall: noBallMode,
            isWide: false,
            isWicket: false,
            batsmanId: striker.id,
            bowlerId: currentBowler.id
        });

        if (noBallMode) {
            setNoBallMode(false);
        }

        // Rotate strike on odd runs
        if (runs % 2 === 1) {
            const temp = match.currentBatsmanIds[0];
            selectBatsman(match.currentBatsmanIds[1], 0);
            selectBatsman(temp, 1);
        }

        // Check if over is complete (only on legal deliveries)
        if (wasLegalDelivery && isOverComplete(newTotalBalls)) {
            // Store current bowler as last over's bowler
            setLastOverBowlerId(currentBowler.id);

            // Rotate strike at end of over
            setTimeout(() => {
                const temp = match.currentBatsmanIds[0];
                selectBatsman(match.currentBatsmanIds[1], 0);
                selectBatsman(temp, 1);

                // Show over complete modal for new bowler selection
                selectBowler(null); // Clear current bowler
                setShowOverCompleteModal(true);
            }, 200);
        }
    };

    // Handle wide
    const handleWide = () => {
        if (!striker || !currentBowler) {
            alert('Please select batsmen and bowler first');
            return;
        }

        recordBall({
            runs: 0,
            isNoBall: false,
            isWide: true,
            isWicket: false,
            batsmanId: striker.id,
            bowlerId: currentBowler.id
        });
    };

    // Toggle no-ball mode
    const handleNoBall = () => {
        setNoBallMode(true);
    };

    // Handle wicket
    const handleWicket = () => {
        if (!striker || !currentBowler) {
            alert('Please select batsmen and bowler first');
            return;
        }
        setShowWicketModal(true);
    };

    const confirmWicket = () => {
        const wasLegalDelivery = !noBallMode;
        const newTotalBalls = wasLegalDelivery ? match.totalBalls + 1 : match.totalBalls;

        recordBall({
            runs: 0,
            isNoBall: noBallMode,
            isWide: false,
            isWicket: true,
            batsmanId: striker.id,
            bowlerId: currentBowler.id
        });

        setNoBallMode(false);
        selectBatsman(null, 0);
        setShowWicketModal(false);

        // Check if over is complete after wicket
        if (wasLegalDelivery && isOverComplete(newTotalBalls)) {
            setLastOverBowlerId(currentBowler.id);
            setTimeout(() => {
                const temp = match.currentBatsmanIds[1]; // non-striker becomes striker
                selectBatsman(temp, 0);
                selectBatsman(null, 1); // Will need to select new batsman
                selectBowler(null);
                setShowOverCompleteModal(true);
            }, 200);
        } else if (match.wickets + 1 < battingPlayers.length - 1) {
            setSelectedPosition(0);
            setShowBatsmanSelect(true);
        }
    };

    const handleInningsEnd = () => {
        setShowInningsEndModal(true);
    };

    const handleStartSecondInnings = () => {
        startSecondInnings();
        setLastOverBowlerId(null);
        setShowInningsEndModal(false);
    };

    const handleEndMatch = () => {
        completeMatch();
        setShowInningsEndModal(false);
        onEndMatch?.();
    };

    // Handle new bowler selection after over
    const handleNewBowlerSelect = (bowlerId) => {
        selectBowler(bowlerId);
        setShowOverCompleteModal(false);

        // If striker position is empty (after wicket on last ball), show batsman select
        if (!match.currentBatsmanIds[0] || !match.currentBatsmanIds[1]) {
            setTimeout(() => {
                const position = !match.currentBatsmanIds[0] ? 0 : 1;
                setSelectedPosition(position);
                setShowBatsmanSelect(true);
            }, 100);
        }
    };

    // Get available bowlers (exclude last over's bowler)
    const availableBowlers = bowlingPlayers.filter(p => p.id !== lastOverBowlerId);

    // Select batsman modal
    const BatsmanSelectModal = () => (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="card max-w-md w-full animate-slide-up">
                <h3 className="text-xl font-bold mb-4">
                    Select {selectedPosition === 0 ? 'Striker' : 'Non-Striker'}
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                    {availableBatsmen.length === 0 ? (
                        <p className="text-gray-400 text-center py-4">No batsmen available</p>
                    ) : (
                        availableBatsmen.map(player => (
                            <button
                                key={player.id}
                                onClick={() => {
                                    selectBatsman(player.id, selectedPosition);
                                    setShowBatsmanSelect(false);

                                    if (selectedPosition === 0 && !match.currentBatsmanIds[1] && availableBatsmen.length > 1) {
                                        setTimeout(() => {
                                            setSelectedPosition(1);
                                            setShowBatsmanSelect(true);
                                        }, 100);
                                    }
                                }}
                                className="w-full flex items-center gap-3 p-3 rounded-lg border-2 border-[#2A3F5F] bg-[#1A2744] hover:border-emerald-500/50 transition-all"
                            >
                                <div className="w-10 h-10 rounded-lg avatar-green flex items-center justify-center font-bold">
                                    {player.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="text-left flex-1">
                                    <div className="font-medium">{player.name}</div>
                                    <div className="text-xs text-gray-500">
                                        {player.runs} runs ({player.balls} balls)
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
                <button
                    onClick={() => setShowBatsmanSelect(false)}
                    className="w-full btn btn-secondary mt-4"
                >
                    Cancel
                </button>
            </div>
        </div>
    );

    // Select bowler modal (regular)
    const BowlerSelectModal = () => (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="card max-w-md w-full animate-slide-up">
                <h3 className="text-xl font-bold mb-4">Select Bowler</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                    {bowlingPlayers.map(player => (
                        <button
                            key={player.id}
                            onClick={() => {
                                selectBowler(player.id);
                                setShowBowlerSelect(false);
                            }}
                            className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${player.id === match.currentBowlerId
                                ? 'border-emerald-500 bg-emerald-500/10'
                                : 'border-[#2A3F5F] bg-[#1A2744] hover:border-[#3B5278]'
                                }`}
                        >
                            <div className="w-10 h-10 rounded-lg avatar-red flex items-center justify-center font-bold">
                                {player.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="text-left flex-1">
                                <div className="font-medium">{player.name}</div>
                                <div className="text-xs text-gray-500">
                                    {formatOvers(player.oversBowled)} ov • {player.runsConceded} runs • {player.wickets} wkt
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => setShowBowlerSelect(false)}
                    className="w-full btn btn-secondary mt-4"
                >
                    Cancel
                </button>
            </div>
        </div>
    );

    // Over Complete Modal - Must select new bowler
    const OverCompleteModal = () => {
        const lastBowler = lastOverBowlerId ? getPlayer(lastOverBowlerId) : null;

        return (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                <div className="card max-w-md w-full animate-slide-up border-emerald-500/30">
                    <div className="text-center mb-4">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/20 flex items-center justify-center text-3xl mb-3">
                            🏏
                        </div>
                        <h3 className="text-xl font-bold text-emerald-400">Over Complete!</h3>
                        <p className="text-gray-400 text-sm mt-1">
                            End of Over {currentOver} • Strike rotated
                        </p>
                    </div>

                    <div className="mb-4">
                        <div className="text-sm font-medium text-gray-300 mb-2">Select New Bowler:</div>
                        {lastBowler && (
                            <p className="text-xs text-yellow-400 mb-3">
                                ⚠️ {lastBowler.name} bowled last over and cannot bowl again
                            </p>
                        )}
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {availableBowlers.map(player => (
                                <button
                                    key={player.id}
                                    onClick={() => handleNewBowlerSelect(player.id)}
                                    className="w-full flex items-center gap-3 p-3 rounded-lg border-2 border-[#2A3F5F] bg-[#1A2744] hover:border-emerald-500/50 transition-all"
                                >
                                    <div className="w-10 h-10 rounded-lg avatar-red flex items-center justify-center font-bold">
                                        {player.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="text-left flex-1">
                                        <div className="font-medium">{player.name}</div>
                                        <div className="text-xs text-gray-500">
                                            {formatOvers(player.oversBowled)} ov • {player.runsConceded} runs • {player.wickets} wkt
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Wicket modal
    const WicketModal = () => (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="card max-w-md w-full animate-slide-up border-red-500/30">
                <div className="text-center mb-4">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/20 flex items-center justify-center text-3xl mb-3">
                        🏏
                    </div>
                    <h3 className="text-xl font-bold text-red-400">Wicket!</h3>
                </div>
                <p className="text-gray-300 text-center mb-6">
                    <span className="font-bold">{striker?.name}</span> is out.<br />
                    <span className="text-gray-500">Bowler: {currentBowler?.name}</span>
                    {noBallMode && <span className="text-yellow-400 block mt-1">(On No-Ball)</span>}
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={() => { setShowWicketModal(false); setNoBallMode(false); }}
                        className="flex-1 btn btn-secondary"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={confirmWicket}
                        className="flex-1 btn btn-danger"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );

    // Innings End Modal
    const InningsEndModal = () => (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="card max-w-md w-full animate-slide-up">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/20 flex items-center justify-center text-3xl mb-3">
                        🏆
                    </div>
                    <h3 className="text-xl font-bold">
                        {match.innings === 1 ? 'End First Innings?' : 'End Match?'}
                    </h3>
                    <p className="text-gray-400 mt-2">
                        {battingTeam.name}: {match.totalRuns}/{match.wickets} ({formatOvers(match.totalBalls)} ov)
                    </p>
                </div>

                <div className="space-y-3">
                    {match.innings === 1 && (
                        <button
                            onClick={handleStartSecondInnings}
                            className="w-full btn btn-primary"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Start Second Innings
                        </button>
                    )}
                    <button
                        onClick={handleEndMatch}
                        className={`w-full btn ${match.innings === 1 ? 'btn-secondary' : 'btn-primary'}`}
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        End Match & View Summary
                    </button>
                    <button
                        onClick={() => setShowInningsEndModal(false)}
                        className="w-full btn btn-secondary"
                    >
                        Continue Playing
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="animate-fade-in pb-32">
            {showBatsmanSelect && <BatsmanSelectModal />}
            {showBowlerSelect && <BowlerSelectModal />}
            {showWicketModal && <WicketModal />}
            {showInningsEndModal && <InningsEndModal />}
            {showOverCompleteModal && <OverCompleteModal />}

            {/* Live Scoreboard - Broadcast Style */}
            <div className="card mb-6 border-t-4 border-t-emerald-500 overflow-hidden relative">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(16, 185, 129, 0.4), transparent 50%)' }}>
                </div>

                {/* Header Strip */}
                <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                    <div className="flex items-center gap-2">
                        <div className="live-dot"></div>
                        <span className="text-sm font-bold text-emerald-400 uppercase tracking-widest">
                            {match.innings === 2 ? '2nd Innings' : 'Live Match'}
                        </span>
                    </div>
                    <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">{match.name || 'Tournament 2024'}</span>
                </div>

                {/* Main Score Display */}
                <div className="flex items-end justify-between relative z-10">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shadow-lg border border-white/10">
                                <img src={match.battingTeamId === 'team-a' ? '/A.png' : '/B.png'} alt={battingTeam.name} className="w-full h-full object-contain filter drop-shadow" />
                            </div>
                            <h2 className="text-xl font-bold text-white tracking-wide">{battingTeam.name.toUpperCase()}</h2>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="font-score text-7xl text-white drop-shadow-lg">{match.totalRuns}</span>
                            <span className="font-score text-4xl text-gray-400">/{match.wickets}</span>
                        </div>
                    </div>

                    <div className="text-right">
                        <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">OVERS</div>
                        <div className="flex items-baseline justify-end gap-1">
                            <span className="font-score text-5xl text-white">{formatOvers(match.totalBalls)}</span>
                            {match.oversLimit && (
                                <span className="font-score text-2xl text-gray-500">/{match.oversLimit}</span>
                            )}
                        </div>
                        <div className="text-xs text-gray-400 font-medium mt-1">CRR: {((match.totalRuns / match.totalBalls) * 6 || 0).toFixed(2)}</div>
                    </div>
                </div>

                {/* Target / Status Bar */}
                {(target || match.firstInningsScore) && (
                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-sm">
                        {target ? (
                            <>
                                <span className="text-gray-400">Target: <span className="font-bold text-white">{target}</span></span>
                                <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400 font-bold border border-yellow-500/30">
                                    Need {Math.max(0, target - match.totalRuns)} off {match.oversLimit * 6 - match.totalBalls}
                                </span>
                            </>
                        ) : (
                            <span className="text-gray-500">
                                1st Innings: {match.firstInningsScore?.runs}/{match.firstInningsScore?.wickets} ({formatOvers(match.firstInningsScore?.balls || 0)})
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Current Over Indicator */}
            <div className="mb-6 px-1">
                <div className="flex items-center justify-between text-xs text-gray-400 uppercase tracking-wider font-bold mb-2">
                    <span>This Over</span>
                    {/* <span>{currentBowler?.name}</span> */}
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div
                            key={i}
                            className={`ball-indicator ${i < ballsInOver
                                ? 'bg-white text-blue-900 border-2 border-white shadow-lg shadow-white/20'
                                : 'bg-white/5 text-white/20 border-2 border-white/10'
                                }`}
                        >
                            {i < ballsInOver ? (
                                // Logic to show run scored on that ball? This would arguably be better if we tracked ball-by-ball history for the view.
                                // For now, simple dot. In future, we can map active over stats.
                                '•'
                            ) : i + 1}
                        </div>
                    ))}
                    {(match.extras.wides > 0 || match.extras.noBalls > 0) && (
                        <div className="ml-auto flex items-center gap-3 text-xs font-bold text-yellow-400 bg-yellow-400/10 px-3 py-1 rounded-full border border-yellow-400/20">
                            <span>EXTRAS: {match.extras.wides + match.extras.noBalls}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Active Players Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Batting Card */}
                <div className="card backdrop-blur-xl bg-gradient-to-br from-[#1E293B]/80 to-[#0F172A]/80 border-l-4 border-l-blue-500">
                    <div className="text-xs text-blue-400 uppercase tracking-widest font-bold mb-3 flex justify-between">
                        <span>Batting</span>
                        <span>RUNS (BALLS)</span>
                    </div>

                    <button
                        onClick={() => { setSelectedPosition(0); setShowBatsmanSelect(true); }}
                        className="w-full flex items-center justify-between mb-3 p-2 rounded hover:bg-white/5 transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            {striker ? (
                                <span className="font-bold text-lg group-hover:text-blue-400 transition-colors">{striker.name}</span>
                            ) : (
                                <span className="text-gray-500 italic">Select Striker...</span>
                            )}
                        </div>
                        {striker && (
                            <div className="font-score text-2xl">
                                {striker.runs}<span className="text-gray-500 text-lg ml-1">({striker.balls})</span>
                            </div>
                        )}
                    </button>

                    <button
                        onClick={() => { setSelectedPosition(1); setShowBatsmanSelect(true); }}
                        className="w-full flex items-center justify-between p-2 rounded hover:bg-white/5 transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
                            {nonStriker ? (
                                <span className="font-medium text-gray-300 group-hover:text-blue-400 transition-colors">{nonStriker.name}</span>
                            ) : (
                                <span className="text-gray-500 italic">Select Non-Striker...</span>
                            )}
                        </div>
                        {nonStriker && (
                            <div className="font-score text-xl text-gray-400">
                                {nonStriker.runs}<span className="text-gray-600 text-base ml-1">({nonStriker.balls})</span>
                            </div>
                        )}
                    </button>
                </div>

                {/* Bowling Card */}
                <div className="card backdrop-blur-xl bg-gradient-to-br from-[#1E293B]/80 to-[#0F172A]/80 border-l-4 border-l-orange-500">
                    <div className="text-xs text-orange-400 uppercase tracking-widest font-bold mb-3 flex justify-between">
                        <span>Bowling</span>
                        <span>FIGURES</span>
                    </div>
                    <button
                        onClick={() => setShowBowlerSelect(true)}
                        className="w-full flex items-center justify-between p-2 rounded hover:bg-white/5 transition-colors h-full group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-orange-500/20 flex items-center justify-center text-orange-500">
                                ⚾
                            </div>
                            {currentBowler ? (
                                <div className="text-left">
                                    <div className="font-bold text-lg group-hover:text-orange-400 transition-colors">{currentBowler.name}</div>
                                    <div className="text-xs text-gray-500">{formatOvers(currentBowler.oversBowled)} overs</div>
                                </div>
                            ) : (
                                <span className="text-gray-500 italic">Select Bowler...</span>
                            )}
                        </div>
                        {currentBowler && (
                            <div className="text-right">
                                <div className="font-score text-2xl text-white block">
                                    {currentBowler.wickets}<span className="text-gray-500 text-lg mx-1">-</span>{currentBowler.runsConceded}
                                </div>
                                <div className="text-xs text-gray-500 font-mono">ECO: {(currentBowler.runsConceded / (currentBowler.oversBowled || 1)).toFixed(1)}</div>
                            </div>
                        )}
                    </button>
                </div>
            </div>

            {/* Control Center */}
            {noBallMode && (
                <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/40 rounded-xl flex items-center justify-between animate-pulse">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">⚠️</span>
                        <div>
                            <div className="font-bold text-yellow-400 uppercase tracking-wider text-sm">No-Ball Active</div>
                            <div className="text-xs text-yellow-200/70">Select runs scored on this delivery</div>
                        </div>
                    </div>
                    <button
                        onClick={() => setNoBallMode(false)}
                        className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 text-xs font-bold rounded-lg transition-colors border border-yellow-500/30"
                    >
                        CANCEL
                    </button>
                </div>
            )}

            <div className="card bg-[#0F172A]/90 border-t border-white/10">
                <div className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-4 text-center">
                    {noBallMode ? 'NO-BALL SCORING' : 'CONTROLS'}
                </div>

                {/* Runs Grid */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                    {[0, 1, 2, 3].map(run => (
                        <button
                            key={run}
                            onClick={() => handleScore(run)}
                            className="score-btn score-btn-runs shadow-lg shadow-black/20"
                        >
                            {run}
                        </button>
                    ))}
                </div>

                {/* Boundaries & Wicket */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    <button onClick={() => handleScore(4)} className="score-btn score-btn-four font-bold italic">4</button>
                    <button onClick={() => handleScore(6)} className="score-btn score-btn-six font-bold italic">6</button>
                    <button onClick={handleWicket} className="score-btn score-btn-out font-bold">OUT</button>
                </div>

                {/* Extras Row */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <button
                        onClick={handleWide}
                        disabled={noBallMode}
                        className="btn btn-secondary text-sm py-3 border border-indigo-500/30 hover:bg-indigo-500/10 hover:border-indigo-500/50 text-indigo-300 transition-all disabled:opacity-30"
                    >
                        WIDE (+1)
                    </button>
                    <button
                        onClick={handleNoBall}
                        disabled={noBallMode}
                        className={`btn text-sm py-3 transition-all disabled:opacity-30 ${noBallMode
                            ? 'bg-yellow-500 text-black border-yellow-500'
                            : 'btn-secondary border-yellow-500/30 hover:bg-yellow-500/10 hover:border-yellow-500/50 text-yellow-300'
                            }`}
                    >
                        NO BALL (+1)
                    </button>
                </div>

                {/* Footer Actions */}
                <div className="flex gap-3 pt-4 border-t border-white/5">
                    <button
                        onClick={undoLastBall}
                        disabled={match.ballByBall.length === 0}
                        className="flex-1 btn btn-secondary text-xs py-3 text-gray-400 hover:text-white disabled:opacity-30"
                    >
                        ↺ UNDO
                    </button>
                    <button onClick={handleInningsEnd} className="flex-1 btn bg-white/5 hover:bg-white/10 text-xs py-3 text-gray-300 hover:text-white border border-white/10">
                        🛑 {match.innings === 1 ? 'END INNINGS' : 'END MATCH'}
                    </button>
                </div>
            </div>

            {/* Fullscreen Overlay Alerts */}
            {(oversLimitReached || allOut || targetAchieved) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className={`w-full max-w-sm p-8 rounded-2xl text-center shadow-2xl transform scale-105 border-2 ${targetAchieved ? 'bg-emerald-900/90 border-emerald-500' : 'bg-gray-900/90 border-yellow-500'}`}>
                        <div className="text-6xl mb-4">{targetAchieved ? '🏆' : allOut ? '🏏' : '⏱️'}</div>
                        <h2 className="text-3xl font-black text-white italic mb-2 uppercase">
                            {targetAchieved ? 'WINNER!' : allOut ? 'ALL OUT!' : 'INNINGS OVER'}
                        </h2>
                        <p className="text-xl text-gray-300 font-bold">
                            {targetAchieved ? `${battingTeam.name} Wins!` : allOut ? 'Wickets Exhausted' : 'Overs Completed'}
                        </p>
                        <button
                            onClick={match.innings === 1 ? handleStartSecondInnings : handleEndMatch}
                            className="mt-8 w-full btn btn-primary text-lg py-4 shadow-xl shadow-emerald-500/20"
                        >
                            {match.innings === 1 ? 'Start 2nd Innings' : 'View Summary'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
