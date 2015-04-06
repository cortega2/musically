function ArtistInfo (artist){
	var context = this;
	this.artist = artist;
	this.topTracks = {};

	this.setArtist = function (artist){
		this.artist = artist;
	}

	this.getTopTracks = function (callback) {
		d3.json('https://api.spotify.com/v1/artists/' + this.artist.spotifyId +'/top-tracks?country=US', function (data){
			console.log(data);
			var tracks = [];
			for(var i = 0; i < data.tracks.length; i++){
				var track = {
					name : data.tracks[i].name,
					album : data.tracks[i].album.name,	
					previewURL : data.tracks[i].preview_url,
					image : data.tracks[i].album.images[0].url 
				}
				tracks.push(track);
			}

			callback(tracks);
		});
	}

	this.getBio = function (callback){
		d3.json('http://developer.echonest.com/api/v4/artist/biographies?api_key=EZYC2KYTIGEQDMKFM&id='+ this.artist.nestId +'&format=json&results=1&start=0',
		function (data){
			var bio = {};
			bio.text = data.response.biographies[0].text;
			if (bio.text.length > 400) {
				bio.text = bio.text.substring(0, 400) + '...';
			};

			bio.link = data.response.biographies[0].url;
			callback(bio);
		});
	}

	function loadYoutube(){
		gapi.client.load('youtube', 'v3', onYouTubeApiLoad);
	};

	function onYouTubeApiLoad() {
	    gapi.client.setApiKey('AIzaSyBe8-Hdhs5xHYNsUi-E3WJiJtrjpD_hsKI');
	    console.log(this);
	    context.search(artist.name);
	}

	this.search = function (query) {
	    // Use the JavaScript client library to create a search.list() API call.
	    var request = gapi.client.youtube.search.list({
	        part: 'snippet',
	        type: "video",
	        q: query
	    });
	    
	    // Send the request to the API server,
	    // and invoke onSearchRepsonse() with the response.
	    request.execute(onSearchResponse);

	}

	// Called automatically with the response of the YouTube API request.
	function onSearchResponse(response) {
	    console.log(response);
	    var videoId = response.items[0].id.videoId;
	    console.log(videoId);
	    player.loadVideoById(videoId);
	}

	loadYoutube();
}