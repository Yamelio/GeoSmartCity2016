var mymap = L.map('mapid').setView([40, 0], 2.8);
var popup = L.popup();
var idx_m = 0;
var tab_markers = [];
var geocodeService = L.esri.Geocoding.geocodeService();
var canPlaceMarker = true;
var DEBUG = true;

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(mymap);

mymap.locate({setView: true, maxZoom: 15});

var LeafIcon = L.Icon.extend({
    options: {
        shadowUrl: 'images/problem.png',
        iconSize:     [60, 58],
        shadowSize:   [60, 58],
        iconAnchor:   [30, 47],
        shadowAnchor: [30, 47],
        popupAnchor:  [0, -37]
    }
});

var problemIcon = new LeafIcon({iconUrl: 'images/problem.png'});
var infoIcon = new LeafIcon({iconUrl: 'images/info.png'});
var eventIcon = new LeafIcon({iconUrl: 'images/event.png'});
var otherIcon = new LeafIcon({iconUrl: 'images/other.png'});

var tmpMarker = "t";
/**
*	[Event] Places a marker at the click position on the Map
* @param {eventObject} e - The event you get from clicking on the map
*/
function onMapClick(e) {
    removeTmpMarkers();
	if(canPlaceMarker){
		tmpMarker = addMarker(e.latlng.lat, e.latlng.lng);
		$('#comment-page').show("slow");
		$('#add-comment').show("slow");
        $('#modify-comment').hide("slow");		
		canPlaceMarker=false;
	}
}

/**
*	Places a marker at the click position on the Map
* @param {number} lat
* @param {number} lon
* @param {string} addr
*/
function onSearchClick(lat, lon, addr) {
    goTo(lat, lon);
    removeTmpMarkers();
	if(canPlaceMarker){
		tmpMarker = addMarker(lat, lon, addr, "eventIcon");
		$('#comment-page').show("slow");
		$('#add-comment').show("slow");
        $('#modify-comment').hide("slow");		
		canPlaceMarker=false;
	}
}

var selectedMarker = "s";
/**
*	[Event] Displays the popup attached to the marker
*    + Displays the modify comment box
* @param {eventObject} e - The event you get from clicking on the marker
*/
function onMarkerClick(e){
	//console.log(e.target);    //e.target gives the Object on which the event is called
    removeTmpMarkers();
	selectedMarker = e.target;
    selectedMarker.dragging.enable();
    displayComment(selectedMarker);
	if(selectedMarker != tmpMarker){
		$('#comment-page').show("slow");
		$('#modify-comment').show("slow");
        $('#add-comment').hide("slow");
		//mymap.removeLayer(marker);
		selectedMarker.getPopup().togglePopup();
		lat = e.target._latlng.lat;
		lng = e.target._latlng.lng;
	}
	//console.log(lat, lng);
	//goTo(lat, lng);
}

/**
*	Place a marker on the location of the user and stores it in tmpMarker
* @param {eventObject} e
*/
function locationOfUserMarker(e){
	console.log(e);
	lat = e.latitude;
	lng = e.longitude;
	tmpMarker = addMarker(lat, lng);
}

/********************** EVENTS ***************************/

mymap.on('click', onMapClick);
mymap.on('locationfound', locationOfUserMarker);

document.getElementById('addr').addEventListener('input', function (e) {
                 addr_search();
}, false);

var radios = document.forms["add_comment_form"].elements["radio_button"];
for(var i = 0, max = radios.length; i < max; i++) {
    radios[i].onclick = function() {
       change_icon(this.value);
    }
}


/*********************************************************/

/**
*	Change the current view of the map to go to the 
* 	wanted coordinates
* @param {number} lat
* @param {number} lon
*/
function goTo(lat, lng){
	mymap.setView([lat, lng], 17);
}

/**
*   Removes the temporary markers of the map
*/
function removeTmpMarkers(){
	$('#comment-page').hide();
    $('#modify-comment').hide();
	$('#add-comment').hide();
    if(tmpMarker != "t")
        mymap.removeLayer(tmpMarker);
    //if(selectedMarker != "s")
    //    mymap.removeLayer(selectedMarker);
    canPlaceMarker=true;
}

/**
*	Places a marker with a comment attached
* @param {boolean} bool
*/
function validateComment(bool){
    comment = createComment();
    tmpMarker['comment']= comment;
	$('#comment-page').hide("slow");
	$('#add-comment').hide("slow");
	if(!bool){
		mymap.removeLayer(tmpMarker);
	}
	tmpMarker = "t";
	canPlaceMarker=true;
}

/**
*	Modifies the marker currently selected
* @param {boolean} bool
*/
function modifyComment(bool){
    $('#comment-page').hide("slow");
	$('#modify-comment').hide("slow");
	if(!bool){
		mymap.removeLayer(selectedMarker);
        mymap.removeLayer(tmpMarker);
	}
    selectedMarker.dragging.disable();
	selectedMarker = "s";
}

/**
*	Add a marker on my map + event
* @param {number} lat
* @param {number} lon
* @param {string} addr
* @param {string} iconChosen
*/
function addMarker(lat, lng, addr, iconChosen){
    goTo(lat, lng);
    var marker;
    console.log(iconChosen);
    switch(iconChosen) {
        case "Problem":
            marker = L.marker(L.latLng(lat, lng), {icon: problemIcon}).addTo(mymap);
            break;
        case "Info":
            marker = L.marker(L.latLng(lat, lng), {icon: infoIcon}).addTo(mymap);
            break;
        case "Event":
            marker = L.marker(L.latLng(lat, lng), {icon: eventIcon}).addTo(mymap);
            break;
        case "Other":
            marker = L.marker(L.latLng(lat, lng), {icon: otherIcon}).addTo(mymap);
            break;
        default:
            marker = L.marker(L.latLng(lat, lng), {icon: eventIcon}).addTo(mymap);
    }
	var latlng = L.latLng(lat, lng);
	tab_markers.push(marker);
    if(addr != undefined){
        marker.bindPopup(addr).openPopup();
    }else{
        geocodeService.reverse().latlng(latlng).run(function(error, result) {
            address="";
            if(result){
                address+=result.address.Match_addr;
            }else{
                address+="No address";
            }
            marker.bindPopup(address).openPopup();
        });
    }
	marker.on("click", onMarkerClick);
	return marker;
}

/**
*	Removes the marker from the map
*   @param {L.marker} marker
*/
function removeMarker(marker){
	mymap.removeLayer(marker);
}

/**
*	Removes the selectedMarker from the map
*/
function removeCurrentMarker(){
	mymap.removeLayer(selectedMarker);	
}

/**
*	Displays the list of matching addresses according to the input
*/
function addr_search() {
	var inp = document.getElementById("addr");
    $('#search_answers').empty();
	$.getJSON('http://nominatim.openstreetmap.org/search?format=json&limit=5&q=' + inp.value, function(data) {
		var items = [];
		$.each(data, function(key, val) {
			$('#search_answers').append("<li><a href='#' onclick='onSearchClick(" +
					val.lat + ", " + val.lon + ", \"" + val.display_name +"\");'>" + val.display_name +
					"</a></li>"
			);
		});
	});
}

function change_icon(name){
    switch(name) {
        case "Problem":
            tmpMarker.setIcon(problemIcon);
            break;
        case "Info":
             tmpMarker.setIcon(infoIcon);
            break;
        case "Event":
             tmpMarker.setIcon(eventIcon);
            break;
        case "Other":
            tmpMarker.setIcon(otherIcon);
            break;
        default:
    }
}

var tmpComment;
/**
*   Creates a new comment with the given informations from the form
*   @return {Comment} The new Comment object.
*/
function createComment(){
    f = document.getElementById('add-comment-form-id');
    
    title= f['title'].value;
    description = f['description'].value;
    type=$('#add-comment-form-id input:checked')[0].value;
    if(type=="Other")
        type=f['other'].value;
    f.reset();
    tmpComment = new Comment(title, description, type, 0);
    console.log(tmpComment);
    return tmpComment;
}

/**
*   Displays the comment in the console
*/
function previewComment(){
    f = document.getElementById('add-comment-form');
    
    title= f['title'].value;
    description = f['description'].value;
    type=$('#add-comment-form input:checked')[0].value;
    if(type=="Other")
        type=f['other'].value;
    f.reset();
    tmpComment = new Comment(title, description, type, 0);
    console.log(tmpComment);
    return tmpComment;
}

/**
*   Displays the comment contained in the marker
*   @param {L.marker} marker
*/
function displayComment(marker){
    c= marker.comment;
    d=$('#display');
    d.empty();
    d.append('<p>Title: '+c.title+'</p>');
    d.append('<p>Type: '+c.type+'</p>');
    d.append('<p>Created on: '+c.date_creation+'</p>');
    d.append('<p>Description:'+'<br/>'+c.description+'</p>');
}

/**
*   Creates an instance of Comment
*
*   @constructor
*   @this {Comment}
*   @param {string} title
*   @param {string} description
*   @param {string} type
*   @param {string} duration
*/
function Comment(title, description, type, duration){
    d = new Date();
    this.title = title;
    this.description = description;
    this.type = type;
    this.date_creation = d.getDate()+'/'+(d.getMonth()+1)+'/'+d.getFullYear()+' '+d.getHours()+':'+d.getMinutes();
    //this.end = this.date_creation+duration;
}