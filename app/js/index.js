const SpotifyWebApi = window.SpotifyWebApi;
const clientId = CLIENT_ID;

$('[data-toggle="tooltip"]').tooltip();
const inputText = document.getElementById('input-text')
const inputButton = document.getElementById('submit-input')

const accessTokenRegexMatch = /#access_token=(.*?)(&|$)/.exec(window.location.hash);
const accessToken = accessTokenRegexMatch != null ? accessTokenRegexMatch[1] : null
const loginAttemptedTimeMatch = /login_attempted_at-(.*?)(&|$)/.exec(window.location.hash);
const loginAttemptedTime = loginAttemptedTimeMatch != null ? Number(loginAttemptedTimeMatch[1]) : null
const expiresInTimeMatch = /expires_in=(.*?)(&|$)/.exec(window.location.hash);
const expiresInTime = expiresInTimeMatch != null ? Number(expiresInTimeMatch[1]) * 1000 : null

function login() {
  const scopes = ['playlist-modify-private'];
  // TODO: Switch to website in console
  const redirectUri = 'https://localhost:8080';
  const redirectState = 'login_attempted_at-' + Date.now();
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
      checkedTracks: [...new Set(checkedTracks)]
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
    resultTracks: result
  };
}

window.currentResult = null;

function setNewResult(result) {
  window.currentResult = result;
  console.log(
    result
  );
  const {
    input,
    isSuccess,
    resultTracks
  } = result;
  document.getElementById('output').hidden = false;
  if (!isSuccess) {
    document.getElementById('output-text').innerHTML = 'Failed to generate playlist to spell out input'
  } else {
    document.getElementById('output-text').innerHTML = ` Successfully created a playlist of ${resultTracks.length} track${resultTracks.length === 1 ? '' : 's'} that spells out the input text`
    const trackListContainer = document.getElementById('output-track-list');
  }
}

if (accessToken == null ||
  loginAttemptedTime == null ||
  expiresInTime == null ||
  loginAttemptedTime + expiresInTime < Date.now()) {
  document.getElementById('login-button').addEventListener("click", login);
} else {
  document.getElementById('not-logged-in').hidden = true;
  document.getElementById('logged-in').hidden = false;

  // We're logged in - initialize API
  const spotifyApi = new SpotifyWebApi({
    clientId
  });
  spotifyApi.setAccessToken(accessToken);

  inputButton.addEventListener("click", async () => {
    inputText.disabled = true;
    inputButton.disabled = true;

    const targetWord = inputText.value;
    if (sanitizedPhrase(targetWord).replace(/ +/g, '').length > 0) {
      const result = await getTracksForPhrase(spotifyApi, targetWord, document.getElementById("minimize-track-count").checked);
      setNewResult({
        input: targetWord,
        ...result
      });
    }
    inputText.disabled = false;
    inputButton.disabled = false;
  });
}
