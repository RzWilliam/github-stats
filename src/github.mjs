// Fetches GitHub data through the GraphQL API.
// Every request is authenticated with GH_TOKEN → 5000 req/h.

const GRAPHQL_URL = "https://api.github.com/graphql";

function requireToken() {
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error(
      "No token found. Set GH_TOKEN (or GITHUB_TOKEN) in the environment."
    );
  }
  return token;
}

// Generic GraphQL call with error handling.
async function graphql(query, variables = {}) {
  const res = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      Authorization: `bearer ${requireToken()}`,
      "Content-Type": "application/json",
      "User-Agent": "github-stats-cards",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`GitHub API responded ${res.status}: ${await res.text()}`);
  }

  const json = await res.json();
  if (json.errors) {
    throw new Error(`GraphQL error: ${JSON.stringify(json.errors)}`);
  }
  return json.data;
}

// Basic profile info + account creation date.
async function fetchProfile(login) {
  const data = await graphql(
    `
      query ($login: String!) {
        user(login: $login) {
          name
          login
          createdAt
          followers {
            totalCount
          }
          repositories(ownerAffiliations: OWNER, privacy: PUBLIC) {
            totalCount
          }
        }
      }
    `,
    { login }
  );
  if (!data.user) throw new Error(`User not found: ${login}`);
  return data.user;
}

// Sum of stars received across all owned repositories (paginated).
async function fetchTotalStars(login) {
  let stars = 0;
  let cursor = null;
  let hasNext = true;

  while (hasNext) {
    const data = await graphql(
      `
        query ($login: String!, $cursor: String) {
          user(login: $login) {
            repositories(
              ownerAffiliations: OWNER
              first: 100
              after: $cursor
              orderBy: { field: STARGAZERS, direction: DESC }
            ) {
              nodes {
                stargazerCount
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        }
      `,
      { login, cursor }
    );

    const repos = data.user.repositories;
    for (const repo of repos.nodes) stars += repo.stargazerCount;
    hasNext = repos.pageInfo.hasNextPage;
    cursor = repos.pageInfo.endCursor;
  }
  return stars;
}

// All-time contribution total: summed year by year, since contributionsCollection
// only covers a one-year window at a time.
async function fetchTotalContributions(login, createdYear) {
  const currentYear = new Date().getUTCFullYear();
  let total = 0;

  for (let year = createdYear; year <= currentYear; year++) {
    const from = `${year}-01-01T00:00:00Z`;
    const to = `${year}-12-31T23:59:59Z`;
    const data = await graphql(
      `
        query ($login: String!, $from: DateTime!, $to: DateTime!) {
          user(login: $login) {
            contributionsCollection(from: $from, to: $to) {
              contributionCalendar {
                totalContributions
              }
            }
          }
        }
      `,
      { login, from, to }
    );
    total += data.user.contributionsCollection.contributionCalendar.totalContributions;
  }
  return total;
}

// Contribution calendar for the last 365 days (chart + streak).
async function fetchContributionCalendar(login) {
  const data = await graphql(
    `
      query ($login: String!) {
        user(login: $login) {
          contributionsCollection {
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  date
                  weekday
                  contributionCount
                }
              }
            }
          }
        }
      }
    `,
    { login }
  );
  return data.user.contributionsCollection.contributionCalendar;
}

// Gather everything the card needs.
export async function collectStats(login) {
  const profile = await fetchProfile(login);
  const createdYear = new Date(profile.createdAt).getUTCFullYear();

  const [totalStars, totalContributions, calendar] = await Promise.all([
    fetchTotalStars(login),
    fetchTotalContributions(login, createdYear),
    fetchContributionCalendar(login),
  ]);

  return {
    name: profile.name || profile.login,
    login: profile.login,
    createdAt: profile.createdAt,
    followers: profile.followers.totalCount,
    repos: profile.repositories.totalCount,
    totalStars,
    totalContributions,
    calendar,
  };
}
