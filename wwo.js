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

  Template.main.currentRoom = function() {
    return Session.get("room") || false;
  };

  Template.rooms.availableRooms = function () {
    return Rooms.find({});
  };

  Template.rooms.events = {
    "click #addRoom": function () {
      var roomName = $('#roomName').val();
      if(roomName != "") {
        Rooms.insert({name: roomName });
      }
    }
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
      Session.set("dy", ((e.pageY - 50) - Session.get("posY"))/25);
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
    //CLEAR MESSAGES
    Messages.remove({});
    //PUBLISH COLLECTIONS
    Meteor.publish("rooms", function() {
      return Rooms.find({});
    });
    Meteor.publish("messages", function() {
      return Messages.find({});
    });

    Meteor.methods({
      updateMarker: function(id) {
        var theRoom = Rooms.findOne(id); 
        if (isNaN(theRoom.x)) theRoom.x = 480;
        if (isNaN(theRoom.y)) theRoom.y = 320;

        var dx = 0;
        var dy = 0;
        var theForces = Forces.find({room: id});
        theForces.forEach(function(force) {
          dx += parseInt(force.x);
          dy += parseInt(force.y);
        });
        Forces.remove({room: id});

        var newX = theRoom.x + dx;
        var newY = theRoom.y + dy;
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
        return position;
      }
    });
  });
}
