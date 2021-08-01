const SpotifyWebApi = window.SpotifyWebApi;
const clientId = CLIENT_ID;

// TODO: Check to see if token is still valid using timestamp?
const accessTokenRegexMatch = /#access_token=(.*?)&/.exec(window.location.hash);
const accessToken = accessTokenRegexMatch != null ? accessTokenRegexMatch[1] : null

function login() {
  const scopes = ['playlist-modify-private'];
  // TODO: Switch to website in console
  const redirectUri = 'https://localhost:8080';
  const redirectState = 'login-attempted';
  const showDialog = true;
  const responseType = 'token';

  const authorizeURL = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=${responseType}&redirect_uri=${redirectUri}&scope=${scopes.join('%20')}&state=${redirectState}&show_dialog=${showDialog}`;
  window.location.replace(authorizeURL);
}

const SEARCH_LIMIT = 50;

function sanitizedPhrase(phrase) {
  // preserve spaces
  return phrase.replace(/[^a-zA-Z0-9 ]/g, '').toLowerCase();
}

async function findTrackWithString(spotifyApi, targetString) {
  const sanitizedTargetString = sanitizedPhrase(targetString)
  const searchResult = await spotifyApi.searchTracks(`track:"${sanitizedTargetString}"`, {
    limit: SEARCH_LIMIT
  });
  const tracks = (searchResult?.body?.tracks?.items ?? []).filter(item =>
    sanitizedPhrase(item.name) === sanitizedTargetString
  ).map(item => {
    return {
      name: item.name,
      id: item.id,
      artists: (item.artists ?? []).map(artist => artist.name).join(', '),
      albumArtURL: (item.album?.images ?? [])[1]?.url
    };
  });
  tracks.sort((i1, i2) => i1.name.length - i2.name.length);
  return tracks.length > 0 ? tracks[0] : null;
}

async function getTracksForPhrase(spotifyApi, targetString, minimizeTrackCount, onProgressUpdate) {
  const sanitizedTargetString = sanitizedPhrase(targetString).replace(/ +/g, ' ');

  const inputArr = sanitizedTargetString.split(' ');
  const n = inputArr.length;

  // initialize DP arrays
  const isPossible = new Array(n + 1);
  const wordCountInLatestPhrase = new Array(n + 1);
  const trackForLatestPhrase = new Array(n + 1);
  isPossible[0] = true;
  wordCountInLatestPhrase[0] = 0;
  trackForLatestPhrase[0] = null;

  // in case we fail
  const checkedTracks = [];

  for (let i = 1; i <= n; i++) {
    const phrasesToCheck = Array.from(Array(i).keys()).map(j => {
      return inputArr.slice(i - j - 1, i);
    });
    const responses = await Promise.all(phrasesToCheck.map(async phrase => {
      const track = await findTrackWithString(spotifyApi, phrase.join(' '));
      if (track != null) {
        checkedTracks.push(track);
      }
      return {
        track,
        phraseLength: phrase.length
      };
    }));
    isPossible[i] = false;
    responses.filter(response => response.track != null).forEach((response) => {
      if (isPossible[i - response.phraseLength]) {
        isPossible[i] = true;
        if (trackForLatestPhrase[i] == null ||
          (((wordCountInLatestPhrase[i] - response.phraseLength) * minimizeTrackCount ? 1 : -1) > 0)
        ) {
          // this is our new best option - replace existing
          wordCountInLatestPhrase[i] = response.phraseLength;
          trackForLatestPhrase[i] = response.track;
        }
      }
    });
  }

  if (!isPossible[n]) { // :(
    return {
      isSuccess: false,
      checkedTracks: [...new Set(array)]
    };
  }

  const result = [];
  let i = n;
  while (i > 0) {
    result.unshift(trackForLatestPhrase[i]);
    i -= wordCountInLatestPhrase[i];
  }

  // TODO: verify result with different inputs
  return {
    isSuccess: true,
    result
  };
}

if (accessToken == null) {
  // TODO: Bind login to button
  login();
} else {
  // We're logged in - initialize API
  const spotifyApi = new SpotifyWebApi({
    clientId
  });
  spotifyApi.setAccessToken(accessToken);


  // TODO: Get from UI
  const targetWord = 'I can\'t believe this works'
  setTimeout(async () => {
    const result = await getTracksForPhrase(spotifyApi, targetWord, false);
    console.log(
      result
    );
  }, 10)

}
