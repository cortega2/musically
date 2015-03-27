(function () {
    var pickedArtist;
    var app = angular.module('musically', []);

    app.controller('ViewController', function($scope) {
         $scope.showGraph = true;
         $scope.hideNodes = function() {
            this.showGraph = false;
            $scope.$apply();
         };

    });

    app.directive('nodeGraph', function() {
        return {
            restrict : 'E',
            link : link
        }

        function link(scope, element){
            
            nodeGraph(element[0], scope, setPickedArtist); 
        };
    });

    app.controller('ArtistController', function($scope){
        $scope.artistInfo;
        $scope.artist = pickedArtist;
        $scope.bio = "";
        $scope.calledBio = false;


        $scope.update = function(){
            console.log("updating");
            $scope.artist = pickedArtist;

            if ($scope.artist && !$scope.calledBio){
                console.log("updating artist stuff");
                //set player size when artist picked
                // var pDOM = document.getElementById('playerLocation');
                var body = document.body;
                // player.setSize(200, body.offsetHeight);
                // console.log(pDOM.offsetWidth);
                player.setSize(body.offsetWidth, body.offsetHeight);


                $scope.artistInfo = new ArtistInfo(this.artist);
                $scope.artistInfo.getBio($scope.setBio);
                $scope.calledBio = true;
            }
        }

        $scope.setBio = function (bio){
            $scope.bio = bio;
            console.log(bio);
            $scope.$apply();
        }
    });

    app.directive('artistInfo', function(){
        return {
            restrict : 'E',
            templateUrl : 'artist.html'
            // controller: function () {
            //     this.artist = pickedArtist;
            //     console.log(this.artist);
            // },
            // controllerAs : 'artist'
        } 
    });

    function setPickedArtist(artist){
        pickedArtist = artist;
    };

})();