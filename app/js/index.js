const SpotifyWebApi = window.SpotifyWebApi;

const scopes = ['playlist-modify-private'],
  // TODO: Switch to website in console
  redirectUri = 'https://localhost:8080',
  clientId = CLIENT_ID,
  redirectState = 'login-attempted',
  showDialog = true,
  responseType = 'token';

const spotifyApi = new SpotifyWebApi({
  redirectUri,
  clientId
});

const authorizeURL= `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=${responseType}&redirect_uri=${redirectUri}&scope=${scopes.join('%20')}&state=${redirectState}&show_dialog=${showDialog}`;

// window.location.replace("http://stackoverflow.com");

console.log(authorizeURL);
