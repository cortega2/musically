var bestHeight = 0;
var body = document.body;
var w = body.offsetWidth;
var h = body.offsetHeight;

if (w > h)
    bestHeight = h; 
else
    bestHeight = w;

(function () {
    var pickedArtist;
    var homeGraph = new nodeGraph();
    var app = angular.module('musically', []);

    app.controller('ViewController', function($scope) {
         $scope.showGraph = true;
         
         $scope.hideNodes = function() {
            this.showGraph = false;
            $scope.$apply();
         };

         $scope.searchArtist = function(){
            var input = document.getElementById("inputBox").value;
            homeGraph.searchArtist(input);
         };

    });

    app.directive('nodeGraph', function() {
        return {
            restrict : 'E',
            link : link
        }

        function link(scope, element){
            homeGraph.init(element[0], scope, setPickedArtist); 
        };
    });

    app.controller('ArtistController', function($scope){
        $scope.artistInfo;
        $scope.artist = pickedArtist;
        $scope.bio = "";
        $scope.calledBio = false;
        $scope.topTracks;
        $scope.gotTopTracks = false;
        $scope.twitterHandle = false;


        $scope.update = function(){
            console.log("updating");
            $scope.artist = pickedArtist;

            if ($scope.artist && !$scope.calledBio){
                console.log("updating artist stuff");

                $scope.calledBio = true;

                //set player size when artist picked
                var body = document.body;
                player.setSize(body.offsetWidth, body.offsetHeight);

                $scope.artistInfo = new ArtistInfo(this.artist);
                $scope.artistInfo.getBio($scope.setBio);
                $scope.artistInfo.getTopTracks($scope.setTopTracks);
                $scope.artistInfo.getTwitterHandle($scope.setTwitterHandle);
                $scope.artistInfo.createMap();
            }
        }

        $scope.setBio = function (bio){
            $scope.bio = bio;
            console.log(bio);
            $scope.$apply();
        }

        $scope.setTopTracks = function (tracks){
            $scope.topTracks = tracks;
            $scope.gotTopTracks = true;
            $scope.$apply();
        }

        $scope.searchYoutube = function (query){
            $scope.artistInfo.search(query);
            // console.log(query);
        }

        $scope.setTwitterHandle = function(handle){ 
            $scope.twitterHandle = handle;
            $scope.$apply();
            if (handle) {
                runTwitter(document,"script","twitter-wjs", handle);
            }
        }
    });

    app.directive('artistInfo', function(){
        return {
            restrict : 'E',
            templateUrl : 'artist.html'
        } 
    });

    // code via http://stackoverflow.com/questions/27104571/creating-a-new-directive-with-angularjs-using-html5-audio-element
    app.directive('soundButton', [function () {
        return {
            restrict: 'E',
            link: function (scope, element, attrs) {
                var audioSrc = attrs.origem,
                    audio = angular.element('<audio/>');

                var source = angular.element('<source />');
                source.attr("src", audioSrc).attr("type", "audio/mp3");

                audio.attr('preload', true);
                // audio.src = audioSrc;
                audio.append(source);
                element.append(audio);

                scope.play = function (event) {
                    
                    var audioElement = event.srcElement.children.item();
                    if (audioElement.paused) {
                        audioElement.play();
                    } else {
                        audioElement.pause();
                    }
                };

                element.css({
                    backgroundImage : 'url(' + attrs.image + ')',
                    backgroundSize : '100%',
                    borderRadius : '50%',
                    width : '5vw',
                    height : '5vw',
                    border : '0px',
                    backgroundColor : 'red',
                    display : 'inline-block',
                    cursor : 'pointer',
                    float: 'left'
                });

            }
        }
    }]);

    function setPickedArtist(artist){
        pickedArtist = artist;
    };

    function runTwitter(d, s, id, handle){

        var dom = document.getElementById("tweets");
        dom.innerHTML = '<a class="twitter-timeline" height="' + bestHeight + '"href="https://twitter.com/' + handle +'"data-chrome="noheader noborders" data-screen-name="' + handle + '"data-widget-id="586052502761693184"> Tweets by @ ' + handle +'</a>';

        var js,fjs=d.getElementsByTagName(s)[0],p=/^http:/.test(d.location)?'http':'https';
        if(!d.getElementById(id)){
            js=d.createElement(s);
            js.id=id;js.src=p+"://platform.twitter.com/widgets.js";
            fjs.parentNode.insertBefore(js,fjs);
        };
    }

})();