function nodeGraph() {
    var element;
    var controller;
    var setArtist;
    var context = this;

    var minWidth = 50;
    var maxWidth = 100;
    var svg;

    function getArtists() {
        var artists = [];
        //changed gettopartists to get hypedartists since it was down, change back later when working again
        d3.json("http://ws.audioscrobbler.com/2.0/?method=chart.gettopartists&api_key=563056c3a22cddf982583f3730187b42&limit=200&format=json"
            , function(lastfm){
            d3.json("http://developer.echonest.com/api/v4/artist/top_hottt?api_key=EZYC2KYTIGEQDMKFM&format=json&results=200&start=0&bucket=hotttnesss", function(nest){
                console.log(lastfm);
                console.log(nest);

                var count = 0;
                var min = lastfm.artists.artist[0].listeners *  nest.response.artists[0].hotttnesss;
                var max = lastfm.artists.artist[0].listeners *  nest.response.artists[0].hotttnesss;

                // var min = nest.response.artists[0].hotttnesss;
                // var max = nest.response.artists[0].hotttnesss;

                for(var l in lastfm.artists.artist){
                    // console.log(lastfm.artists.artist[i].name);
                    for(var n in nest.response.artists){
                        if (lastfm.artists.artist[l].name === nest.response.artists[n].name){
                            count ++;

                            var artist = {
                                name: nest.response.artists[n].name,
                                // rank: nest.response.artists[n].hotttnesss,
                                rank: lastfm.artists.artist[l].listeners *  nest.response.artists[n].hotttnesss,
                                imageLink: lastfm.artists.artist[l].image[2]["#text"],
                                imageLinkLarge : lastfm.artists.artist[l].image[4]["#text"],
                                nestId: nest.response.artists[n].id,
                                spotifyId: "",
                                topGenre: ""

                            };

                            if (artist.rank > max) {
                                max = artist.rank;
                            };

                            if (artist.rank < min) {
                                min = artist.rank;
                            };

                            artists.push(artist);
                        }
                    }
                };

                var scale = d3.scale.sqrt()
                    .domain([min, max])
                    .range([minWidth, maxWidth]);

                
                context.getArtistGenres(artists, scale, maxWidth);
            });
        });

    };

    this.getArtistGenres = function (artists, scale, maxWidth) {
        genres = {};
        var counter = 0;

        for(var i in artists){
            (function (index) {
                d3.json('http://developer.echonest.com/api/v4/artist/profile?api_key=EZYC2KYTIGEQDMKFM&id=' + artists[index].nestId + '&bucket=genre&format=json&bucket=id:spotify'
                    , function (data){
                    for(var i in data.response.artist.genres){
                        var genre = data.response.artist.genres[i].name;
                        
                        if (genres[genre] == null) {
                            genres[genre] = {
                                artists: [],
                                consolidated: false
                            };
                        }
                        
                        genres[genre].artists.push(data.response.artist.name);
                    };

                    var spotifyId = data.response.artist.foreign_ids[0].foreign_id.split(":");
                    artists[index].spotifyId = spotifyId[2];

                    counter ++;
                    if (counter >= artists.length) {
                        var indexedGenres = consolidateGenres();
                        context.createGraph(artists, scale, maxWidth, indexedGenres);
                    };
                });
            })(i);   
        };

        function consolidateGenres(){
            // loop unitl finished... couldn't think of a better way to do this at the moment
            while(true){
                //get the top genre
                var count = 0;
                var max = 0;
                var topGenre;

                for(var genre in genres){
                    if (genres[genre] != undefined && genres[genre].consolidated != true ){
                        if( max < genres[genre].artists.length ) {
                            max = genres[genre].artists.length;
                            topGenre = genres[genre];
                        };
                    }
                    else{
                        count ++;
                    };
                };

                // check if all have been consolidated
                if (count >= Object.keys(genres).length) {
                    break;
                };

                //consolidate the genres
                topGenre.consolidated = true;
                for( var genre in genres){
                    var tempGenre = genres[genre];

                    for(var index in topGenre.artists){
                        if (tempGenre == undefined){
                            break;
                        }

                        //check if other genres contain the same artists, if they do remove them
                        artistIndex = tempGenre.artists.indexOf(topGenre.artists[index]);
                        if (tempGenre.artists.indexOf(topGenre.artists[index]) >= 0 && !tempGenre.consolidated) {
                            //remove it
                            tempGenre.artists.splice([artistIndex], 1);
                        };

                        if (tempGenre.artists.length === 0) {
                            genres[genre] = undefined;
                            break;
                        };
                    }
                }

            }

            var artistCount = 0;
            var genreCount = 0;
            var indexedGenres = [];
            for(var genre in genres){
                indexedGenres.push(genre);
                if (genres[genre] != undefined) {
                    genreCount++;
                    artistCount += genres[genre].artists.length;
                    for(var i = 0; i < genres[genre].artists.length; i++){
                        var artistIndex = context.getIndexByKey(artists, "name", genres[genre].artists[i]);
                        artists[artistIndex].topGenre = genre;
                    }
                };
            };

            console.log("genre count:" + genreCount);
            console.log("artist count: " + artistCount);

            return indexedGenres;
        };
    };

    this.getIndexByKey = function (array, key, value){
        for(var i = 0; i < array.length; i++){
            if (array[i][key] == value ) {
                return i;
            };
        };

        console.log("couldn't find:" + key + " with val: " + value);
        return -1;
    }

    this.createGraph = function(artists, scale, maxSize, indexedGenres){
        // clear everything first
        d3.selectAll("svg").remove();
        var tooltips = document.getElementsByClassName("tooltip");
        if (tooltips.length != 0) {
            tooltips[0].remove();
        }; 

        svg = d3.select(element)
            .append("svg")
            .attr("width", "100%")
            .attr("height", "100%");


        var width = element.offsetWidth;
        var height = element.offsetHeight;

        var padding = 1; // separation between same-color nodes
        var clusterPadding = 10; // separation between different-color nodes 

        var fill = d3.scale.category20();

        //4 is the number of different clusters which will be the number of diff genres
        var clusters = new Array(indexedGenres.length);

        for(var index in artists){
            var artist = artists[index];
            artist.width = scale(artist.rank);

            //cluster function will go here
            artist.cluster = indexedGenres.indexOf(artist.topGenre);

            if (!clusters[artist.cluster] || (artist.width > clusters[artist.cluster].width)) {
                clusters[artist.cluster] = artist;
            };
        }


        var nodes = artists;

        var force = d3.layout.force()
            .nodes(nodes)
            .size([width, height])
            .gravity(0)
            .charge(0)
            .on("tick", tick)
            .start();

        //tooltip
        var div = d3.select(element).append("div")
            .attr("class", "tooltip")
            .style("opacity", 0); 

        var node = svg.selectAll(".node")
            .data(nodes)
            .enter()
                .append("g")
                .attr("class", "node")
                .call(force.drag)
                .on("mousedown", function (d) {
                    d3.event.stopPropagation();
                    context.showArtistPage(d);

                })
                .on("mouseover", function (d) {
                    div.transition(200)
                    .style("opacity", .9);

                    div.html(d.name + "<hr>" + d.topGenre)
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY) + "px");
                });

        node.append("image")
            .attr("xlink:href", function(d) { return d.imageLink; })
            .attr("x", -8)
            .attr("y", -8)
            .attr("width", function(d) { return scale(d.rank); })
            .attr("height", function(d) { return scale(d.rank); });

        node.append("rect")
                .attr("class", "node")
                .attr("x", function (d) {
                    return -8;
                })
                .attr("y", function (d) {
                    return -8;
                })
                .attr("width", function(d) { return scale(d.rank); })
                .attr("height", function(d) { return scale(d.rank); })
                .style("fill-opacity", 0)
                .style("stroke", function (d, i) {
                    return d3.rgb(fill( indexedGenres.indexOf(d.topGenre) ));
                }); 

        svg.style("opacity", 1e-6)
            .transition()
                .duration(1000)
                .style("opacity", 1);

        // d3.select(div)
        //     .on("mousedown", mousedown);

        function tick(e){
            // push the nodes to different areas for clustering
            nodes.forEach(function (d, i){
                clustering(10 * e.alpha * e.alpha, d);
                collision(.5, d);
            });

            node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
        };

        function clustering(alpha, d){
            var cluster = clusters[d.cluster];
            k = 1;

            // For cluster nodes, apply custom gravity.
            if (cluster === d) {
              cluster = {x: width / 2, y: height / 2, width: -d.width/1.5};
              k = .1 * Math.sqrt(d.width/1.5);
            }

            var x = d.x - cluster.x,
                y = d.y - cluster.y,
                l = Math.sqrt(x * x + y * y),
                r = d.width/1.5 + cluster.width/1.5;

            if (l != r) {
              l = (l - r) / l * alpha * k;
              d.x -= x *= l;
              d.y -= y *= l;
              cluster.x += x;
              cluster.y += y;
            }
        };  

        function collision(alpha, d){
            var quadtree = d3.geom.quadtree(nodes);
            
            var r = d.width/1.5 + maxSize + Math.max(padding, clusterPadding),
                nx1 = d.x - r,
                nx2 = d.x + r,
                ny1 = d.y - r,
                ny2 = d.y + r;
            
            quadtree.visit(function(quad, x1, y1, x2, y2) {
                if (quad.point && (quad.point !== d)) {
                    var x = d.x - quad.point.x,
                    y = d.y - quad.point.y,
                    l = Math.sqrt(x * x + y * y),
                    r = d.width/1.5 + quad.point.width/1.5 + (d.cluster === quad.point.cluster ? padding : clusterPadding);
                    
                    if (l < r) {
                        l = (l - r) / l * alpha;
                        d.x -= x *= l;
                        d.y -= y *= l;
                        quad.point.x += x;
                        quad.point.y += y;
                    }
                }

                return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
            });
        };

        // function mousedown() {
        //     nodes.forEach(function (o, i){
        //         o.x += (Math.random() - .5) * 100;
        //         o.y += (Math.random() - .5) * 100;
        //     });

        //     force.resume();
        // };
    };

    this.showArtistPage = function (artistNode){
            setArtist(artistNode);
            controller.hideNodes();
    }

    this.init = function(elem, contr, callback){
        element = elem;
        controller = contr;
        setArtist = callback;

        // svg = d3.select(element)
        //     .append("svg")
        //     .attr("width", "100%")
        //     .attr("height", "100%");

        getArtists();
    }

    this.getImageFromLastFM = function (artists){
        var counter = 0;
        var min = Number.MAX_VALUE;
        var max = artists[0].rank;
        
        for(var i in artists){

            (function (index) {
                console.log(artists[index].mbid);
                d3.json('http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&mbid=' + artists[index].mbid + '&api_key=563056c3a22cddf982583f3730187b42&format=json'
                    , function (data){
                    
                    artists[index].imageLink = data.artist.image[2]["#text"];
                    artists[index].imageLinkLarge = data.artist.image[4]["#text"];

                    var rank = artists[index].rank * data.artist.stats.listeners;
                    artists[index].rank = rank;

                    if (rank < min) {
                        min = rank;
                    };
                    if(rank > max){
                        max = rank;
                    }

                    counter ++;
                    if (counter >= artists.length) {
                        console.log(artists);
                        var scale = d3.scale.sqrt()
                            .domain([min, max])
                            .range([minWidth, maxWidth]);
                        context.getArtistGenres(artists, scale, maxWidth);
                    };
                });
            })(i);   
        };
    }

    this.searchArtist = function(query){
        d3.json('http://developer.echonest.com/api/v4/artist/search?api_key=EZYC2KYTIGEQDMKFM&format=json&name=' + query + '&bucket=hotttnesss&bucket=id:musicbrainz&bucket=id:spotify&results=40',
            function (data){
                var artists = [];
                console.log(data);
                for(var i = 0; i < data.response.artists.length; i++){

                    //cant use artists with no ids
                    if (data.response.artists[i].foreign_ids == undefined || data.response.artists[i].foreign_ids.length < 2) {
                        break;
                    };

                    var spotifyId = data.response.artists[i].foreign_ids[1].foreign_id.split(":");
                    var mbid = data.response.artists[i].foreign_ids[0].foreign_id.split(":");

                    var artist = {
                        name: data.response.artists[i].name,
                        rank: data.response.artists[i].hotttnesss,
                        imageLink: "",
                        imageLinkLarge: "",
                        nestId: data.response.artists[i].id,
                        spotifyId: spotifyId[2],
                        mbid: mbid[2], 
                        topGenre: "Place holder"
                    };

                    artists.push(artist);
                }

                if (artists.length <= 0) {
                    console.log("No artists were found");
                    return;
                };
                
                context.getImageFromLastFM(artists);
            });
    }
};