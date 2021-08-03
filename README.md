# Meme to Playlist
Generate meme playlists from input text using a dynamic programming.

![Example PLaylist](app/assets/png/example-playlist.png)

The algorithm attempts to create a playlist who's track names form the input text when concatenated together. It's designed to parallelize API calls to optimize runtime.

Login with Spotify is required since Spotify is the data source. The app doesn't store any user information - login is only required so tracks can be searched for using the Spotify API, and if you want to save any created Playlists.
