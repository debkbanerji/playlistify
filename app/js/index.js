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

async function findTracksWithString(spotifyApi, targetString) {
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
  return tracks;
}

if (accessToken == null) {
  // TODO: Bind to button
  login();
} else {
  // We're logged in - initialize API
  const spotifyApi = new SpotifyWebApi({
    // redirectUri,
    clientId
  });
  spotifyApi.setAccessToken(accessToken);


  // TODO: Replace example call with logic, pass to web worker?
  const targetWord = 'hello'
  setTimeout(async () => {
    const result = await findTracksWithString(spotifyApi, targetWord);
    console.log({
      result
    })
  }, 10)

}
