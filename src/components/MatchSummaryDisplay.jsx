import { formatOvers, calculateStrikeRate, calculateEconomyRate } from '../utils/calculations';

// Reusable summary display for both active match and history
export default function MatchSummaryDisplay({ match, teams, players }) {
    if (!match || !teams || !players) return null;

    // Helper to get player by id
    const getPlayer = (id) => players.find(p => p.id === id);

    // Helper to get team players
    const getTeamPlayers = (teamId) => {
        const teamKey = teamId === 'team-a' ? 'teamA' : 'teamB';
        // Handle both recent matches (playerIds) and historical snapshots (if specific format differs)
        if (!teams[teamKey] || !teams[teamKey].playerIds) return [];
        return teams[teamKey].playerIds.map(id => getPlayer(id)).filter(Boolean);
    };

    const battingTeamId = match.battingTeamId;
    const bowlingTeamId = match.bowlingTeamId;

    // Derive teams
    const battingTeam = battingTeamId === 'team-a' ? teams.teamA : teams.teamB;
    const bowlingTeam = bowlingTeamId === 'team-a' ? teams.teamA : teams.teamB;

    if (!battingTeam || !bowlingTeam) return null;

    // Determine man of the match
    const getManOfMatch = () => {
        if (players.length === 0) return null;

        const topScorer = players.reduce((best, player) =>
            (player.runs || 0) > (best.runs || 0) ? player : best
            , { runs: -1 });

        const topWicketTaker = players.reduce((best, player) =>
            (player.wickets || 0) > (best.wickets || 0) ? player : best
            , { wickets: -1 });

        // Basic heuristic: 20 runs ≈ 1 wicket
        if ((topScorer.runs || 0) >= (topWicketTaker.wickets || 0) * 20) {
            return topScorer.id ? topScorer : null;
        }
        return topWicketTaker.id ? topWicketTaker : null;
    };

    const manOfMatch = getManOfMatch();

    // Get players for both teams
    const teamAPlayers = getTeamPlayers('team-a');
    const teamBPlayers = getTeamPlayers('team-b');

    // Determine which team batted in which innings
    const firstBattingTeamId = match.firstInningsScore?.battingTeamId || match.battingTeamId;

    // Helper to get sorted batting stats
    const getSortedBatsmen = (teamPlayers) => {
        return [...teamPlayers].sort((a, b) => (b.runs || 0) - (a.runs || 0));
    };

    // Helper to get sorted bowling stats
    const getSortedBowlers = (teamPlayers) => {
        return [...teamPlayers]
            .filter(p => p.oversBowled > 0)
            .sort((a, b) => {
                if (b.wickets !== a.wickets) return (b.wickets || 0) - (a.wickets || 0);
                return parseFloat(calculateEconomyRate(a.runsConceded, a.oversBowled)) -
                    parseFloat(calculateEconomyRate(b.runsConceded, b.oversBowled));
            });
    };

    // Determine winner
    const getMatchResult = () => {
        if (match.status !== 'complete' && match.status !== 'history') return null;

        if (match.innings === 2 && match.firstInningsScore) {
            const firstBattingTeam = match.firstInningsScore.battingTeamId === 'team-a' ? teams.teamA : teams.teamB;
            const secondBattingTeam = battingTeam;

            const firstScore = match.firstInningsScore.runs;
            const secondScore = match.totalRuns;

            if (secondScore > firstScore) {
                const battingPlayers = getTeamPlayers(match.battingTeamId);
                const wicketsRemaining = battingPlayers.length - 1 - match.wickets;
                return `${secondBattingTeam.name} won by ${wicketsRemaining} wicket${wicketsRemaining !== 1 ? 's' : ''}`;
            } else if (firstScore > secondScore) {
                const runsDiff = firstScore - secondScore;
                return `${firstBattingTeam.name} won by ${runsDiff} run${runsDiff !== 1 ? 's' : ''}`;
            } else {
                return 'Match Tied!';
            }
        }
        return null;
    };

    const matchResult = getMatchResult();

    // Batting Scorecard Component
    const BattingScorecard = ({ teamName, players, innings, accentColor }) => {
        const sortedBatsmen = getSortedBatsmen(players);
        // Team A (blue accent) -> A.png, Team B (gold accent) -> B.png
        const logoSrc = accentColor === 'blue' ? '/A.png' : '/B.png';

        return (
            <div className={`card mb-4 border-l-4 ${accentColor === 'blue' ? 'border-l-blue-500' : 'border-l-yellow-500'}`}>
                <h3 className="text-lg font-bold mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/10 rounded-lg p-1 flex items-center justify-center shadow-lg border border-white/10">
                            <img src={logoSrc} alt={teamName} className="w-full h-full object-contain filter drop-shadow" />
                        </div>
                        <span className="tracking-wide uppercase">{teamName}</span>
                    </div>
                    {innings && <span className="text-xs font-bold px-2 py-1 rounded bg-white/5 border border-white/10">{innings}</span>}
                </h3>

                {sortedBatsmen.length === 0 || sortedBatsmen.every(p => !p.balls) ? (
                    <p className="text-gray-500 text-center py-6 text-sm italic">No batting statistics recorded</p>
                ) : (
                    <div className="overflow-x-auto -mx-5 px-5">
                        <table className="stats-table">
                            <thead>
                                <tr>
                                    <th>Batsman</th>
                                    <th className="text-right">R</th>
                                    <th className="text-right">B</th>
                                    <th className="text-right">4s</th>
                                    <th className="text-right">6s</th>
                                    <th className="text-right">SR</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedBatsmen.filter(p => p.balls > 0 || p.runs > 0).map(player => (
                                    <tr key={player.id}>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs font-bold ${player.isOut ? 'text-red-400' : 'text-emerald-400'}`}>
                                                    {player.isOut ? 'OUT' : '*'}
                                                </span>
                                                <span className={`${player.isOut ? 'text-gray-400' : 'text-white font-medium'} truncate max-w-[120px]`}>{player.name}</span>
                                                {manOfMatch?.id === player.id && <span className="text-yellow-400 text-xs">⭐</span>}
                                            </div>
                                        </td>
                                        <td className="text-right font-score text-xl text-white">{player.runs}</td>
                                        <td className="text-right text-gray-400 font-numeric">{player.balls}</td>
                                        <td className="text-right text-blue-400 font-numeric">{player.fours}</td>
                                        <td className="text-right text-purple-400 font-numeric">{player.sixes}</td>
                                        <td className="text-right text-gray-400 font-numeric text-sm">
                                            {calculateStrikeRate(player.runs, player.balls)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    };

    // Bowling Scorecard Component
    const BowlingScorecard = ({ teamName, players, innings, accentColor }) => {
        const sortedBowlers = getSortedBowlers(players);
        const logoSrc = accentColor === 'blue' ? '/A.png' : '/B.png';

        return (
            <div className={`card mb-4 border-l-4 ${accentColor === 'blue' ? 'border-l-blue-500' : 'border-l-yellow-500'}`}>
                <h3 className="text-lg font-bold mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/10 rounded-lg p-1 flex items-center justify-center shadow-lg border border-white/10">
                            <img src={logoSrc} alt={teamName} className="w-full h-full object-contain filter drop-shadow" />
                        </div>
                        <span className="tracking-wide uppercase">{teamName}</span>
                    </div>
                    {innings && <span className="text-xs font-bold px-2 py-1 rounded bg-white/5 border border-white/10">{innings}</span>}
                </h3>

                {sortedBowlers.length === 0 ? (
                    <p className="text-gray-500 text-center py-6 text-sm italic">No bowling statistics recorded</p>
                ) : (
                    <div className="overflow-x-auto -mx-5 px-5">
                        <table className="stats-table">
                            <thead>
                                <tr>
                                    <th>Bowler</th>
                                    <th className="text-right">O</th>
                                    <th className="text-right">R</th>
                                    <th className="text-right">W</th>
                                    <th className="text-right">Econ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedBowlers.map(player => (
                                    <tr key={player.id}>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <span className="text-white font-medium">{player.name}</span>
                                                {manOfMatch?.id === player.id && <span className="text-yellow-400 text-xs">⭐</span>}
                                            </div>
                                        </td>
                                        <td className="text-right font-numeric">{formatOvers(player.oversBowled)}</td>
                                        <td className="text-right text-gray-400 font-numeric">{player.runsConceded}</td>
                                        <td className="text-right font-score text-xl text-red-400">{player.wickets}</td>
                                        <td className="text-right text-gray-400 font-numeric text-sm">
                                            {calculateEconomyRate(player.runsConceded, player.oversBowled)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        );
    };

    const teamABattingInnings = firstBattingTeamId === 'team-a' ? '1st Innings' : (match.innings === 2 ? '2nd Innings' : null);
    const teamBBattingInnings = firstBattingTeamId === 'team-b' ? '1st Innings' : (match.innings === 2 ? '2nd Innings' : null);

    const teamABowlingInnings = firstBattingTeamId === 'team-b' ? '1st Innings' : (match.innings === 2 ? '2nd Innings' : null);
    const teamBBowlingInnings = firstBattingTeamId === 'team-a' ? '1st Innings' : (match.innings === 2 ? '2nd Innings' : null);

    return (
        <div>
            {/* Match Result Banner */}
            {matchResult && (
                <div className="mb-6 mx-1 p-6 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 rounded-2xl text-white text-center animate-fade-in shadow-lg shadow-emerald-500/20 border-t border-emerald-400">
                    <div className="text-4xl mb-2 filter drop-shadow-md">🏆</div>
                    <div className="font-bold text-xl uppercase tracking-widest text-shadow-sm">{matchResult}</div>
                </div>
            )}

            {/* Scoreboard - Both Teams */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                {/* First Innings Score */}
                {match.firstInningsScore ? (
                    <div className="card border-t-4 border-t-blue-500 relative overflow-hidden group hover:border-blue-400 transition-all">
                        <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="text-xs text-blue-400 font-bold uppercase tracking-widest mb-2">1st Innings</div>
                        <div className="font-bold text-white truncate text-lg">
                            {match.firstInningsScore.battingTeamId === 'team-a' ? teams.teamA.name : teams.teamB.name}
                        </div>
                        <div className="flex items-baseline mt-1 gap-1">
                            <span className="font-score text-4xl text-white">{match.firstInningsScore.runs}</span>
                            <span className="font-score text-2xl text-gray-500">/{match.firstInningsScore.wickets}</span>
                        </div>
                        <div className="text-xs text-gray-400 font-medium">({formatOvers(match.firstInningsScore.balls)} overs)</div>
                    </div>
                ) : (
                    <div className="card border-t-4 border-t-blue-500 relative overflow-hidden">
                        <div className="text-xs text-blue-400 font-bold uppercase tracking-widest mb-2">1st Innings</div>
                        <div className="font-bold text-white truncate text-lg">{battingTeam.name}</div>
                        <div className="flex items-baseline mt-1 gap-1">
                            <span className="font-score text-4xl text-white">{match.totalRuns}</span>
                            <span className="font-score text-2xl text-gray-500">/{match.wickets}</span>
                        </div>
                        <div className="text-xs text-gray-400 font-medium">({formatOvers(match.totalBalls)} overs)</div>
                    </div>
                )}

                {/* Second Innings Score */}
                {match.innings === 2 ? (
                    <div className="card border-t-4 border-t-yellow-500 relative overflow-hidden group hover:border-yellow-400 transition-all">
                        <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="text-xs text-yellow-500 font-bold uppercase tracking-widest mb-2">2nd Innings</div>
                        <div className="font-bold text-white truncate text-lg">{battingTeam.name}</div>
                        <div className="flex items-baseline mt-1 gap-1">
                            <span className="font-score text-4xl text-white">{match.totalRuns}</span>
                            <span className="font-score text-2xl text-gray-500">/{match.wickets}</span>
                        </div>
                        <div className="text-xs text-gray-400 font-medium">({formatOvers(match.totalBalls)} overs)</div>
                    </div>
                ) : (
                    <div className="card border-t-4 border-t-yellow-500/30 relative overflow-hidden opacity-60 bg-black/20">
                        <div className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2">2nd Innings</div>
                        <div className="font-bold text-gray-400 truncate text-lg">{bowlingTeam.name}</div>
                        <div className="flex items-baseline mt-1 gap-1">
                            <span className="font-score text-4xl text-gray-600">-</span>
                        </div>
                        <div className="text-xs text-gray-600 font-medium">Yet to bat</div>
                    </div>
                )}
            </div>

            {/* Man of the Match */}
            {manOfMatch && (manOfMatch.runs > 0 || manOfMatch.wickets > 0) && (
                <div className="card mb-8 bg-gradient-to-r from-[#2A2305] to-[#1A1A1A] border border-yellow-500/30 relative overflow-hidden shadow-lg shadow-yellow-900/10">
                    <div className="flex items-center gap-5 relative z-10">
                        <div className="w-16 h-16 rounded-xl avatar-gold flex items-center justify-center text-3xl shadow-lg border border-yellow-400/20">
                            🏆
                        </div>
                        <div>
                            <div className="text-xs text-yellow-500 font-bold uppercase tracking-widest mb-1">Man of the Match</div>
                            <div className="text-2xl font-bold text-white">{manOfMatch.name}</div>
                            <div className="text-sm text-gray-400 mt-1 font-medium">
                                {manOfMatch.runs > 0 && <span className="text-white">{manOfMatch.runs} runs</span>}
                                {manOfMatch.runs > 0 && manOfMatch.wickets > 0 && <span className="mx-2 text-gray-600">•</span>}
                                {manOfMatch.wickets > 0 && <span className="text-white">{manOfMatch.wickets} wickets</span>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Team A Stats */}
            <div className="mb-2">
                <div className="flex items-center gap-3 mb-4 px-1">
                    <div className="w-12 h-12 bg-white/10 rounded-xl p-1 flex items-center justify-center border border-white/10 shadow-lg">
                        <img src="/A.png" alt="Team A" className="w-full h-full object-contain filter drop-shadow" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">{teams.teamA.name}</h2>
                </div>
                <BattingScorecard
                    teamName="Batting"
                    players={teamAPlayers}
                    innings={teamABattingInnings}
                    accentColor="blue"
                />
                <BowlingScorecard
                    teamName="Bowling"
                    players={teamAPlayers}
                    innings={teamABowlingInnings}
                    accentColor="blue"
                />
            </div>

            {/* Team B Stats */}
            <div className="mb-6 pt-4 border-t border-white/5">
                <div className="flex items-center gap-3 mb-4 px-1">
                    <div className="w-12 h-12 bg-white/10 rounded-xl p-1 flex items-center justify-center border border-white/10 shadow-lg">
                        <img src="/B.png" alt="Team B" className="w-full h-full object-contain filter drop-shadow" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">{teams.teamB.name}</h2>
                </div>
                <BattingScorecard
                    teamName="Batting"
                    players={teamBPlayers}
                    innings={teamBBattingInnings}
                    accentColor="gold"
                />
                <BowlingScorecard
                    teamName="Bowling"
                    players={teamBPlayers}
                    innings={teamBBowlingInnings}
                    accentColor="gold"
                />
            </div>
        </div>
    );
}
