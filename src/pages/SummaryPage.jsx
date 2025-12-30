import { useApp } from '../context/AppContext';
import MatchSummaryDisplay from '../components/MatchSummaryDisplay';

export default function SummaryPage({ onNewMatch }) {
    const {
        match,
        teams,
        players,
        resetMatch,
        resetAll,
        archiveMatch
    } = useApp();

    const handleNewMatch = async () => {
        if (confirm('Start a new match? This will save the current match to history.')) {
            // Archive first
            await archiveMatch();
            // Then reset
            await resetMatch();
            onNewMatch?.();
        }
    };

    const handleResetAll = async () => {
        if (confirm('Reset everything? This will clear all players, teams, and match data.')) {
            await resetAll();
            onNewMatch?.();
        }
    };

    if (!match.battingTeamId || !match.bowlingTeamId) {
        return (
            <div className="animate-fade-in">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold mb-1">Match Summary</h1>
                    <p className="text-gray-400 text-sm">No match data available</p>
                </div>
                <div className="card text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#243352] flex items-center justify-center text-3xl">
                        📊
                    </div>
                    <p className="text-gray-300 font-medium">Start a match to see the summary</p>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in pb-8">
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-1">Match Summary</h1>
                <p className="text-gray-400 text-sm">{match.name || 'Cricket Match'}</p>
            </div>

            <MatchSummaryDisplay
                match={match}
                teams={teams}
                players={players}
            />

            {/* Actions */}
            <div className="space-y-3 mt-6">
                <button onClick={handleNewMatch} className="w-full btn btn-primary">
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Save & Start New Match
                </button>
                <button onClick={handleResetAll} className="w-full btn btn-secondary">
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Reset Everything
                </button>
            </div>
        </div>
    );
}
