var map;
var singleInfoWindow;
// Create a new blank array for all the listing markers.
var markers = [];
var infoWindowContent;

function initMap() {
	// Constructor creates a new map - only center and zoom are required.
	map = new google.maps.Map(document.getElementById('map'), {
	  center: {lat: 28.385233, lng: -81.563874},
	  zoom: 14,
	  mapTypeControl: false
	});

	singleInfoWindow = new google.maps.InfoWindow();

	// display listings on page load
	createMapMarkers(locations);
	getVenueFoursquareId(markers);
	showListings();
}


function createMapMarkers(locations) {
	// The following group uses the location array to create an array of markers on initialize.
	for (var i = 0; i < locations.length; i++) {
	  // Get the position from the location array.
	  var position = locations[i].location;

	  // Create a marker per location, and put into markers array.
	  var marker = new google.maps.Marker({
	    position: position,
	    latitude: locations[i].location.lat,
	    longitude: locations[i].location.lng,
	    title: locations[i].title,
	    animation: google.maps.Animation.DROP,
	    venueId: 'placeholder',
	    id: i,
	  });
	  // Push the marker to our array of markers.
	  markers.push(marker);
	  // Create an onclick event to open an infowindow at each marker.
	  marker.addListener('click', function() {
		// center the map
		var position = this.getPosition();
		map.panTo(position);
		// show popup window
	    populateInfoWindow(this, singleInfoWindow);
	  });
	}
}


function getVenueFoursquareId(markers) {

	markers.forEach( function(marker) {

		// Query Foursquare API for location details
		$.ajax({
		    url:'https://api.foursquare.com/v2/venues/search',
		    data: {
		    	client_id: foursquare_client_id,
		    	client_secret: foursquare_client_secret,
		    	v: '20130815',
		    	ll: marker.latitude + "," + marker.longitude,
		    	query: marker.title
		    },
		    success:function(locationData) {
		    	// add location details to info window
		        var venue = locationData.response.venues[0];
		        marker.venueId = venue.id;
		        return true;
		    },
		    error: function(jqXHR, textStatus, errorThrown){
		    	// show pleasant error
		        console.error(errorThrown);
		        // TODO - output error?
		    }
		});

	});

}




// This function populates the infowindow when the marker is clicked. We'll only allow
// one infowindow which will open at the marker that is clicked, and populate based
// on that markers position.
function populateInfoWindow(marker, infowindow) {

	// Check to make sure the infowindow is not already opened on this marker.
	if (infowindow.marker != marker) {

	    infowindow.marker = marker;
	    infoWindowContent = ''; // reset window content variable
	    getVenueDetails(marker, infowindow);
		getVenuePhoto(marker, infowindow);

	    infowindow.open(map, marker);

	    // Make sure the marker property is cleared if the infowindow is closed.
	    infowindow.addListener('closeclick', function() {
	    	infowindow.marker = null;
	    });
	}

}


function getVenueDetails(marker, infowindow) {

	// Query Foursquare API for location details
	$.ajax({
	    url:'https://api.foursquare.com/v2/venues/search',
	    data: {
	    	client_id: foursquare_client_id,
	    	client_secret: foursquare_client_secret,
	    	v: "20130815",
	    	ll: marker.latitude + "," + marker.longitude,
	    	query: marker.title
	    },
	    success:function(locationData) {
	    	// add location details to info window
	        console.dir(locationData.response.venues[0]);
	        var venue = locationData.response.venues[0];
	        infoWindowContent += '<b>' + venue.name + '</b>';
	        infoWindowContent += '<p>' + venue.location.formattedAddress[0] + '<br>';
	        infoWindowContent += venue.location.formattedAddress[1] + '<br>';
	        infoWindowContent += venue.location.formattedAddress[2] + '</p>';
	        infoWindowContent += '<a href="' + venue.url + '" target="_blank">' + venue.url + '</a>';

	        infowindow.setContent('<div>' + infoWindowContent + '</div>');
	        return locationData;
	    },
	    error: function(jqXHR, textStatus, errorThrown){
	    	// show pleasant error
	        console.error(errorThrown);
	        infoWindowContent += '<b>' + marker.title + '</b>';
	        infoWindowContent += '<p>Sorry there was an error loading additional information.</p>';
	        infowindow.setContent('<div>' + infoWindowContent + '</div>');
    		return infoWindowContent;
	    }
	});
}

function getVenuePhoto(marker, infowindow) {
    // grab a photo from Foursquare
	$.ajax({
	    url:'https://api.foursquare.com/v2/venues/'+ marker.venueId +'/photos',
	    data: {
	    	client_id: foursquare_client_id,
	    	client_secret: foursquare_client_secret,
	    	v: "20130815",
	    },
	    success:function(photoDetails) {
	    	// get photo and add to infowindow
	    	if (photoDetails.response.photos) {
	    		var photo = photoDetails.response.photos.items[0];
	    		var photo_src = photo.prefix + 'width300' + photo.suffix;
	    		infoWindowContent += '<br><br><img src="' + photo_src + '"><br><br>';
	    		infowindow.setContent('<div>' + infoWindowContent + '</div>');
	    		return photoDetails;
	    	}

		},
		error: function(jqXHR, textStatus, errorThrown){
			console.error(errorThrown);
	        infoWindowContent += '<b>' + marker.title + '</b>';
	        infoWindowContent += '<p>No image could be found at this time.</p>';
	        infowindow.setContent('<div>' + infoWindowContent + '</div>');
    		return infoWindowContent;
		}
	});
}

// This function will loop through the markers array and display them all.
function showListings() {
	var bounds = new google.maps.LatLngBounds();
	// Extend the boundaries of the map for each marker and display the marker
	for (var i = 0; i < markers.length; i++) {
	  markers[i].setMap(map);
	  bounds.extend(markers[i].position);
	}
	map.fitBounds(bounds);
}
