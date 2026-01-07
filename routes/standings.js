import getStandings from '../api/standings.js';
import getDefaults from '../utils/get-defaults.js';
import sortTeamList from '../utils/sort-team-list.js';

export default async function standingsYear(request, reply) {
  const { season: defaultSeason, leagues } = getDefaults();
  const season = request.params.year || defaultSeason;

  const teamList = {};

  for (const league of leagues) {
    const { latestResultWeek, standings: teams } = await getStandings({
      season,
      leagueID: league.id,
      prefix: `${league.name}`,
    });
    if (teams.error) {
      throw new Error(teams.error);
    }

    Object.entries(teams).forEach((team) => {
      const [teamID, teamData] = team;
      teamList[teamID] = teamData;
    });
  }

  // Round points for each team in standings
  Object.values(teamList).forEach((team) => {
    team.points = Math.round(team.points * 10) / 10;
  });

  reply.send(sortTeamList(teamList, 'points'));
}
