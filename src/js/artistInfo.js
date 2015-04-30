function ArtistInfo (artist){
	var context = this;
	this.artist = artist;
	this.topTracks = {};

	this.setArtist = function (artist){
		this.artist = artist;
	}

	this.getTopTracks = function (callback) {
		d3.json('https://api.spotify.com/v1/artists/' + this.artist.spotifyId +'/top-tracks?country=US', function (data){
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

	this.getTwitterHandle = function(callback){
		d3.json('http://developer.echonest.com/api/v4/artist/twitter?api_key=FILDTEOIK2HBORODV&id=' + this.artist.nestId + '&format=json', 
		function (data) { 
			var handle = false;
			if (data != undefined && data.response.artist.twitter != undefined) { 
				handle = data.response.artist.twitter;
			};

			callback(handle);
		});
	}

	this.createMap = function(){
		var layer = new L.StamenTileLayer("toner");
		var map = new L.Map("map", {
		    center: new L.LatLng(41.83, -87.68),
		    zoom: 12
		});

		map.addLayer(layer);

		d3.json('http://ws.audioscrobbler.com/2.0/?method=artist.getevents&mbid=' + context.artist.mbid + '&api_key=563056c3a22cddf982583f3730187b42&format=json',
		function (data){
			console.log(data);
			if (data.events.total == "0") {
				return;
			};

			shows = [];

			for(var e = 0; e < data.events.event.length; e++){
				var show = data.events.event[e];
				var latlng = show.venue.location["geo:point"];

				var eventDate = data.events.event[e].startDate.split(" ");
				var info = {
					latlng : latlng,
					date : eventDate[2] + " " + eventDate[1] + ", "	+ eventDate[3],
					venue : data.events.event[e].venue.name,
					eventLink : data.events.event[e].website 	
				};

				shows.push(info);

				var marker = L.marker([Number(latlng["geo:lat"]), Number(latlng["geo:long"])]);
				var content = '<h3>' + info.date + '</h3><h4>@ ' + 
								 info.venue + '</h4>' +
								 '<a href="'+ info.eventLink +'">Website</a>';

				marker.bindPopup(content, {autoPan : false}).openPopup();
				marker.addTo(map);
			}

			//sort shows by date
			shows.sort(function (a, b){
				d1 = new Date(a.date);
				d2 = new Date(b.date);
				return a>b ? -1 : a<b ? 1 : 0;
			});

			for(var i = 0; i<=shows.length-2; i++){
				var lat1 = Number(shows[i].latlng["geo:lat"]);
				var lat2 = Number(shows[i+1].latlng["geo:lat"]);

				var lng1 = Number(shows[i].latlng["geo:long"]);
				var lng2 = Number(shows[i+1].latlng["geo:long"]);

				var polyline = L.polyline([[lat1, lng1], [lat2, lng2]], {color: 'red', clickable : false}).addTo(map);	
				console.log(polyline);
			}

			map.invalidateSize(false);
		});

	}

	// Youtube functions
	function loadYoutube(){
		gapi.client.load('youtube', 'v3', onYouTubeApiLoad);
	};

	function onYouTubeApiLoad() {
	    gapi.client.setApiKey('AIzaSyBe8-Hdhs5xHYNsUi-E3WJiJtrjpD_hsKI');
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
	    var videoId = response.items[0].id.videoId;
	    player.loadVideoById(videoId);
	}

	loadYoutube();
}