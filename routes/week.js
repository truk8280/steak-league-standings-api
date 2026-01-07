import getLiveScores from '../api/live-scores.js';
import getStandings from '../api/standings.js';
import getDefaults from '../utils/get-defaults.js';

export default async function getWeek(request, reply) {
  const { season: defaultSeason, leagues } = getDefaults();
  const season = request.params.year || defaultSeason;
  // Just use the first league to get the week
  const league = leagues[0];

  // Get standings to calculate week based on games played
  const { latestResultWeek, standings } = await getStandings({
    season,
    leagueID: league.id,
    prefix: league.name,
  });

  // Calculate week as the max games played (wins + losses + ties) across all teams
  let maxGamesPlayed = 0;
  if (standings && !standings.error) {
    Object.values(standings).forEach((team) => {
      const gamesPlayed =
        (team.wins || 0) + (team.losses || 0) + (team.ties || 0);
      if (gamesPlayed > maxGamesPlayed) {
        maxGamesPlayed = gamesPlayed;
      }
    });
  }

  // If we have games played data, use that as the week
  // Otherwise fall back to MFL's week
  let week;
  if (maxGamesPlayed > 0) {
    week = maxGamesPlayed + 1; // Next week is current week
  } else {
    const liveScoresData = await getLiveScores({
      season,
      leagueID: league.id,
      prefix: `${league.name}`,
    });
    week = liveScoresData.week;
  }

  reply.send({ week });
}
