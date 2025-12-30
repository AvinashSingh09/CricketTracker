import { useState, useEffect } from 'react';
import { historyApi } from '../services/api';
import MatchSummaryDisplay from '../components/MatchSummaryDisplay';

export default function HistoryPage() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMatch, setSelectedMatch] = useState(null);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            setLoading(true);
            const data = await historyApi.getAll();
            setHistory(data);
        } catch (error) {
            console.error('Failed to load history:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin text-4xl">🏏</div>
            </div>
        );
    }

    if (selectedMatch) {
        return (
            <div className="animate-fade-in">
                <button
                    onClick={() => setSelectedMatch(null)}
                    className="mb-4 flex items-center text-gray-400 hover:text-white transition-colors"
                >
                    <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to History
                </button>
                <div className="text-sm text-gray-500 mb-2">
                    Played on {new Date(selectedMatch.date || selectedMatch.timestamp).toLocaleDateString()} at {new Date(selectedMatch.date || selectedMatch.timestamp).toLocaleTimeString()}
                </div>
                <MatchSummaryDisplay
                    match={selectedMatch.match}
                    teams={selectedMatch.teams}
                    players={selectedMatch.players}
                />
            </div>
        );
    }

    return (
        <div className="animate-fade-in pb-8">
            <h1 className="text-2xl font-bold mb-6">Match History</h1>

            {history.length === 0 ? (
                <div className="card text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#243352] flex items-center justify-center text-3xl">
                        📜
                    </div>
                    <p className="text-gray-300 font-medium">No previous matches found</p>
                    <p className="text-sm text-gray-500 mt-2">Completed matches will appear here</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {history.map((item) => {
                        const { match, teams, timestamp } = item;
                        const date = new Date(timestamp || item.date);

                        // Determine winner text
                        const getWinnerText = () => {
                            if (match.status !== 'complete') return 'Incomplete Match';

                            // Try to calculate (or use summary logic)
                            // Simplified here for the list item
                            if (match.innings === 2 && match.firstInningsScore) {
                                const firstBattingTeamId = match.firstInningsScore.battingTeamId;
                                const firstScore = match.firstInningsScore.runs;
                                const secondScore = match.totalRuns;

                                const firstTeamName = firstBattingTeamId === 'team-a' ? teams.teamA.name : teams.teamB.name;
                                const secondTeamName = firstBattingTeamId === 'team-a' ? teams.teamB.name : teams.teamA.name;

                                if (secondScore > firstScore) return `${secondTeamName} Won`;
                                if (firstScore > secondScore) return `${firstTeamName} Won`;
                                return 'Match Tied';
                            }
                            return 'Match Result';
                        };

                        return (
                            <div
                                key={item._id}
                                onClick={() => setSelectedMatch(item)}
                                className="card hover:border-[#3B5278] cursor-pointer transition-colors group"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="text-sm text-gray-400">
                                        {date.toLocaleDateString()} • {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div className="badge bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20">
                                        View Details
                                    </div>
                                </div>

                                <h3 className="text-lg font-bold mb-1">
                                    {teams.teamA.name} vs {teams.teamB.name}
                                </h3>

                                <div className="text-emerald-400 font-medium">
                                    {getWinnerText()}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
