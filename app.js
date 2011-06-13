var stat;

function Stat(distance) {
        this.totalDistance = distance;
        this.locations = [];
        this.distance = 0; // m
        this.elapsed = 0; // s
        this.averageSpeed = 0; // m/s
        this.currentSpeed = 0; // m/s

        this.pushLocation = function(location) {
                var previous = this.locations[this.locations.length - 1];
                if (typeof(previous) !== 'undefined') {
                        this.distance += distanceBetween(previous, location);
                }

                var locationCopy = jQuery.extend(true, {}, location);
                this.locations.push(locationCopy);

                this.elapsed = (location.timestamp - this.startTime()) / 1000;
                this.averageSpeed = this.distance / this.elapsed;

                var lastFew = this.locations.slice(-20);
                var lastFewDist = distanceOverArray(lastTen);
                this.currentSpeed = lastTenDist / (location.timestamp - lastTen[0].timestamp) * 1000;
        };

        this.startTime = function() {
                return this.locations[0].timestamp;
        };

        this.lastTime = function() {
                return this.locations[this.locations.length - 1].timestamp;
        };

        this.estimatedFinishTime = function() {
                var res = this.totalDistance / this.averageSpeed;
                if (!res)
                        return 0;
                return res;
        }

        this.possibleFinishTime = function() {
                var res = this.elapsed + (this.totalDistance - this.distance) / this.currentSpeed;
                if (!res)
                        return 0;
                return res;
        }
};

if (typeof(Number.prototype.toRad) === "undefined") {
        Number.prototype.toRad = function() {
                return this * Math.PI / 180;
        }
}

function distanceBetween(p1, p2) {
        var R = 6371; // km
        var dLat = (p2.coords.latitude - p1.coords.latitude).toRad();
        var dLon = (p2.coords.longitude - p1.coords.longitude).toRad(); 
        var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(p1.coords.latitude.toRad()) * Math.cos(p2.coords.latitude.toRad()) *
                        Math.sin(dLon/2) * Math.sin(dLon/2); 
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        var d = R * c;
        return d * 1000;
}

function distanceOverArray(array) {
        var dist = 0;
        for (var i = 1; i < array.length; i++) {
                dist += distanceBetween(array[i-1], array[i]);
        }
        return dist;
}

function timeString() {
        var stamp = new Date();
        return stamp.toString("HH:mm:ss");
}

function dateString() {
        var stamp = new Date();
        return stamp.toString("yyyy-MM-dd");
}

function colorString() {
        var ms = (new Date()).getMilliseconds();
        var intensity = 240 - ms / 30;
        var hexIntensity = parseInt(intensity).toString(16);
        if (hexIntensity.length < 2) {
                hexIntensity = '0' + hexIntensity;
        }
        return '20' + hexIntensity + hexIntensity;
}

function formatDMS(dec) {
        var deg = parseInt(dec);
        if (deg < 10) {
                deg = '0' + deg
        }

        dec = (dec - deg) * 60;
        var min = parseInt(dec);
        if (min < 10) {
                min = '0' + min
        }

        dec = (dec - min) * 60;
        var sec = dec.toFixed(3);
        if (sec < 10) {
                sec = '0' + sec
        }

        return deg + "&deg;&thinsp;" + min + "'&thinsp;" + sec + '"';
}

function formatLat(dec) {
        var dir = "W";
        if (dec < 0) {
                dir = "E";
        }
        return formatDMS(dec) + " " + dir;
}

function formatLon(dec) {
        var dir = "N";
        if (dec < 0) {
                dir = "S";
        }
        return formatDMS(dec) + " " + dir;
}

function locationSuccessFake(location) {
        speed += .01;
        location.timestamp += 1000;
        location.coords.latitude += speed / 1852 / 60;
        location.coords.longitude += speed / 1852 / 60;
        locationSuccess(location);
        setTimeout(function() { locationSuccessFake(location); }, 1000);
}

function locationSuccess(location) {
        if (location.coords.accuracy < 50) {
                $('#gps').attr('class', 'ok');
        } else {
                $('#gps').attr('class', 'failed');
        }

        if (!stat)
                return;

        stat.pushLocation(location);

        var avgMinutes = stat.estimatedFinishTime() / 60;
        var curMinutes = stat.possibleFinishTime() / 60;
        if (avgMinutes < 500) {
                $("#average").text(Math.round(avgMinutes));
        } else {
                $('#average').html('&#8734;'); // Infinity
        }

        var current = $("#current");
        if (curMinutes < 500) {
                current.text(Math.round(curMinutes));
        } else {
                current.html('&#8734;'); // Infinity
        }

        current.removeClass('slow');
        current.removeClass('fast');
        if (curMinutes < avgMinutes * 0.9) {
                current.addClass('fast');
        } else if (curMinutes > avgMinutes * 1.1) {
                current.addClass('slow');
        }

        var progress = Math.round(100 * stat.distance / stat.totalDistance);
        $('#progress').css('width', progress.toString() + '%');
}

function locationFailure(location) {
        $('#average').text('F');
        $('#current').text(location.code);
        $('#gps').attr('class', 'failed');
}

function choiceMade(event) {
        $('#config').hide();
        $('#main').show();
        var length = $(this).data('length');
        stat = new Stat(length);
}

function main() {
        speed = 3;
        var coords = { latitude: 55.5, longitude: 13.7 };
        var location = { timestamp: 1305745043000, coords: coords };
        // locationSuccessFake(location);
        $('.choice').bind('click', choiceMade);
        navigator.geolocation.watchPosition(locationSuccess, locationFailure, { frequency: 5000 });
}

