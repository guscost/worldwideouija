var Rooms = new Meteor.Collection("rooms");
var Forces = new Meteor.Collection("forces");
var Messages = new Meteor.Collection("messages");


if (Meteor.is_client) {
Meteor.startup(function() {
        Meteor.subscribe("rooms");
        Meteor.subscribe("messages");
        Meteor.setInterval(function() {
          var theRoom = Rooms.findOne(Session.get("room"));
         if (theRoom !== undefined)
	 {
          if (isNaN(Session.get("dx"))) Session.set("dx", 0);
          if (isNaN(Session.get("dy"))) Session.set("dy", 0);
          Meteor.call("updateMarker", Session.get("room"));
          Meteor.call("getPosition", Session.get("room"), function(e,r) {
           Session.set("posX", r.x);
           Session.set("posY", r.y);
          });
          Forces.insert({
            room: Session.get("room"),
            x: Session.get("dx"),
            y: Session.get("dy")
          });
         }
       }, 100);
});

  Template.rooms.events = {
    "click #addRoom": function () {
        var roomName = $('#roomName').val();
        if(roomName != "") {
            Rooms.insert({
              name: roomName,
              x: 200,
              y: 200
            });
        }
    }
};

Template.main.currentRoom = function() {
    return Session.get("room") || false;
};

Template.rooms.availableRooms = function () {
    return Rooms.find({});
};

Template.roomItem.events = {
    "click a.enter": function () {
        if(Session.get("name") === undefined) {
            var d = "Guest" + Math.floor(Math.random()*999);
            var name = window.prompt("Name:", d);
            if(name === "") name = d; 
            Session.set("name", name);
        }
        Session.set("room", this._id);
    }
};

Template.room.events = {
    "mousemove .gameBoard": function(e) {
        var theRoom = Rooms.findOne(Session.get("room"));
        Session.set("dx", ((e.pageX - parseInt($('.gameBoard').css("margin-left"))) - Session.get("posX"))/25);
        Session.set("dy", (e.pageY - Session.get("posY"))/25);
    },
    "click #leave": function() {
        Session.set("room", undefined);
    },
    "submit": function() {
        Messages.insert({
            room: Session.get("room"),
            author: Session.get("name"),
            text: $("#msg").val()
        });
        $("#msg").val("");
    }
};

Template.room.roomName = function() {
     var room = Rooms.findOne(Session.get("room"));
     return room && room.name ;
};

Template.room.messages = function() {
    return Messages.find({room: Session.get("room")});
};

Template.room.x = function() {
    return Session.get("posX") && parseInt(Session.get("posX")) - 100;
};

Template.room.y = function() {
    return Session.get("posY") && parseInt(Session.get("posY")) - 100;
};


}

if (Meteor.is_server) {
  Meteor.startup(function () {
    // code to run on server at startup
  Meteor.publish("rooms", function() {
    return Rooms.find({});
  });
  Meteor.publish("messages", function() {
    return Messages.find({});
  });

Meteor.methods({
  updateMarker: function(id) {
    var theRoom = Rooms.findOne(id); 
    var theForces = Forces.find({room: id});
    var dx = 0;
    var dy = 0;
    theForces.forEach(function(force) {
      dx += parseInt(force.x);
      dy += parseInt(force.y);
    });
    Forces.remove({room: id});
    var newX = parseInt(theRoom.x) + dx;
    var newY = parseInt(theRoom.y) + dy;
    if (newX < 100) newX = 100;
    if (newX > 860) newX = 860;
    if (newY < 100) newY = 100;
    if (newY > 540) newY = 540;
    Rooms.update(id, {$set: {x: newX}});
    Rooms.update(id, {$set: {y: newY}});      
  },
  getPosition: function (id) {
    var theRoom = Rooms.findOne(id);
    var position = {};
    position.x = parseInt(theRoom.x);
    position.y = parseInt(theRoom.y);
    if (isNaN(position.x)) position.x = 200;
    if (isNaN(position.y)) position.y = 200;
    return position;
  }
});
  });
}
