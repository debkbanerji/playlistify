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

async function findTracksWithString(spotifyApi, targetString) {
  const searchResult = await spotifyApi.searchTracks(`track:"${targetString}"`);
  console.log({
    searchResult
  });
  const tracks = (searchResult?.body?.tracks?.items ?? []).map(item => {
    return {
      name: item.name,
      id: item.id,
      artists: (item.artists ?? []).map(artist => artist.name).join(', '),
      albumArtURL: (item.album?.images ?? [])[1]?.url
    };
  });
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
  const targetWord = 'Pokemon'
  setTimeout(async () => {
    const result = await findTracksWithString(spotifyApi, targetWord);
    console.log({
      result
    })
  }, 10)

}
