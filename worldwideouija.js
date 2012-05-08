var Rooms = new Meteor.Collection("rooms");
var Forces = new Meteor.Collection("forces");
var Messages = new Meteor.Collection("messages");

if (Meteor.is_client) {
  Meteor.startup(function() {
    Meteor.subscribe("allrooms"); 
    Meteor.subscribe("allmessages");
    Meteor.setInterval(function() {
      var roomID = Session.get("room");
      if (roomID)
      {
        if (isNaN(Session.get("dx"))) Session.set("dx", 0);
        if (isNaN(Session.get("dy"))) Session.set("dy", 0);
        Session.set("dx", Session.get("dx") * 0.9);
        Session.set("dy", Session.get("dy") * 0.9);
        Forces.insert({
          room: roomID,
          x: Session.get("dx"),
          y: Session.get("dy")
        });
        Meteor.call("updateMarker", roomID, function(e,r) {
          if (r.x && r.y)
          {
            Session.set("posX", r.x);
            Session.set("posY", r.y);
          }
        });
      }
    }, 600);
  });

  Template.main.currentRoom = function() {
    return Session.get("room") || false;
  };

  Template.rooms.availableRooms = function () {
    return Rooms.find({});
  };

  Template.rooms.events = {
    "submit": function () {
      var roomName = $('#roomName').val();
      $('#roomName').val('');
      if(roomName != '') {
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

  Template.roomItem.numPlayers = function() {
    var room = Rooms.findOne(this._id);
    return room.players ? room.players : 0;
  };

  Template.room.events = {
    "mousemove .gameBoard": function(e) {
      var theRoom = Rooms.findOne(Session.get("room"));
      var trueX = e.pageX - parseInt($('.gameBoard').css('margin-left'));
      Session.set("dx", (trueX - Session.get("posX"))/10);
      Session.set("dy", ((e.pageY - 50) - Session.get("posY"))/10);
    },
    "click #leave": function() {
      var theRoom = Rooms.findOne(Session.get("room"));
      Rooms.update(theRoom._id, {$set: {players: 0}});
      Session.set("room", undefined);
      Meteor.flush();
    },
    "submit": function() {
      Messages.insert({ 
        room: Session.get("room"), 
        author: Session.get("name"), 
        text: $('#messageInput').val()
      });
      $('#messageInput').val('');
    }
  };

  Template.room.roomName = function() {
    var room = Rooms.findOne(Session.get("room"));
    return room && room.name;
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
    //CLEAR ALL ROOMS AND MESSAGES
    //Rooms.remove({});
    //Messages.remove({});
    //PUBLISH COLLECTIONS
    Meteor.publish("allrooms", function() {
      return Rooms.find({});
    });
    Meteor.publish("allmessages", function() {
      return Messages.find({});
    });

    Meteor.methods({
      updateMarker: function(id) {
        var theRoom = Rooms.findOne(id);
        var position = {};
        if (theRoom)
        { 
          if (isNaN(theRoom.x)) theRoom.x = 480;
          if (isNaN(theRoom.y)) theRoom.y = 320;
          if (isNaN(theRoom.players)) theRoom.players = 0;

          var dx = 0;
          var dy = 0;
          var numForces = 0;
          var theForces = Forces.find({room: id});
          theForces.forEach(function(force) {
            dx += parseInt(force.x);
            dy += parseInt(force.y);
            numForces++;
          });
          Forces.remove({room: id});
          Rooms.update(id, {$set: {players: numForces}});
          if (numForces > 0)
          {
            var newX = theRoom.x + dx/numForces;
            var newY = theRoom.y + dy/numForces;
            if (newX < 100) newX = 100;
            if (newX > 860) newX = 860;
            if (newY < 100) newY = 100;
            if (newY > 540) newY = 540;
            Rooms.update(id, {$set: {x: newX}});
            Rooms.update(id, {$set: {y: newY}});      

            position.x = newX;
            position.y = newY;
          }
        }
        return position;
      },
      clearMessages: function() {
        Messages.remove({});
      }
    });
    Meteor.setInterval(function() {
      var theRooms = Rooms.find({});
      theRooms.forEach(function(room) {
        Meteor.call("updateMarker", room._id);
      });
    }, 5000);
  });
}
