function ArtistInfo (artist){
	this.artist = artist;
	this.bio = "";

	this.setArtist = function (artist){
		this.artist = artist;
	}

	this.getTopTracks = function () {

	}

	this.getBio = function (callback){
		d3.json('http://developer.echonest.com/api/v4/artist/biographies?api_key=EZYC2KYTIGEQDMKFM&id='+ this.artist.nestId +'&format=json&results=1&start=0',
		function (data){
			console.log(data);
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
	    search();
	}

	function search() {
	    // Use the JavaScript client library to create a search.list() API call.
	    var request = gapi.client.youtube.search.list({
	        part: 'snippet',
	        type: "video",
	        q: artist.name		// place holder
	        
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