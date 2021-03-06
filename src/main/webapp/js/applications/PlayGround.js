var PlayGround = {
    radius: 20,
    gameStarted: false,
    
    container: null,
    canvas: null,
    socket: null,//websocket
        entities: {},//game persons on playground
    owner: {},//current person. Come from server with full information
    projectiles: [],//current projectiles to display
    xMouse: 0,//current x-mouse position
    yMouse: 0,//current y-mouse position,
    viewAngleDirection: 0,//current y-mouse position,
    angle: 0,
    map: {},
    canvasOffset: {top: 0, left: 0},
    
    nextFrame: null,
    interval: null,
    nextGameTick: 0,
    skipTicks: 0,
    fps:30,

    showNames: false,
    rocketRadius: 5,
    fireRadius: 7,
    explosionRadius: 40,//different on 20 with server
    instantBullets: {},
    
    init: function () {
        PersonTracker.init();
        ZoneActions.init();
        Weapons.init();
        LifeAndArmor.init();
        KeyboardSetup.init();
        GameStats.init();
        Score.init();
        Chat.init();

        setInterval(function(){
            if(PlayGround.gameStarted) {
                var now = (new Date()).getTime() - 100;
                for (var key in PlayGround.instantBullets) {
                    var bullet = PlayGround.instantBullets[key];
                    if(bullet.created < now) {
                        delete (PlayGround.instantBullets[key]);
                    }
                }
            }
        }, 50);
        
        var openKeyboard = Dom.el('a', {'href': "#", 'class': 'icon-keyboard'});
        openKeyboard.onclick = function(e){e.preventDefault();KeyboardSetup.show()};
        
        var canvas = Dom.el('canvas', {width: 640, height: 480, id: 'playground'});
        PlayGround.container = Dom.el(
            'div',
            {'class': 'playground'},
            [
                openKeyboard, Weapons.container, Chat.container, LifeAndArmor.container,KeyboardSetup.container,
                Score.container, GameStats.container, canvas
            ]
        );
        
        PlayGround.nextGameTick = (new Date).getTime();
        PlayGround.skipTicks = 1000 / PlayGround.fps;

        PlayGround.entities = {};
        if (!canvas.getContext) {
            alert('Error: 2d canvas not supported by this browser.');
            return;
        }

        PlayGround.rect = canvas.getBoundingClientRect();
        PlayGround.context = canvas.getContext('2d');
        canvas.addEventListener('mousedown', PersonActions.startFire);
        canvas.addEventListener('mouseup', PersonActions.stopFire);
        window.addEventListener('keydown', PersonActions.startMovement, false);
        window.addEventListener('keydown', Weapons.changeWeapon, false);
        window.addEventListener('keyup', PersonActions.stopMovement, false);
        window.addEventListener('mousemove', PersonActions.updateMouseDirection);
        window.addEventListener('resize', function(){PlayGround.updateCanvas(PlayGround.map)});
        PlayGround.canvas = canvas;
    },
    createGame: function (name, map) {
        PlayGround.updateCanvas(map);
        PlayGround.connect("create:" + map.id + ":" + encodeURIComponent(name) + ":" + encodeURIComponent(Greetings.getName()))
    },
    writeMessage: function (message) {
        PlayGround.socket.send("message:\n" + message);
    },
    joinGame: function (map, gameId) {
        PlayGround.updateCanvas(map);
        PlayGround.connect("join:" + gameId + ":" + encodeURIComponent(Greetings.getName()))
    },
    updateCanvas: function(map) {        
        PlayGround.map = map;
        var canvas = PlayGround.canvas;
        canvas.style.width  = map.x + 'px';
        canvas.style.height = map.y + 'px';
        canvas.width = map.x;
        canvas.height = map.y;
        var win = ScreenUtils.window();
        if(map.x < win.width) {
            canvas.style.marginLeft = 'auto';
            canvas.style.marginRight = 'auto';
            PersonTracker.trackX = false;
        } else {
            canvas.style.marginLeft = null;
            canvas.style.marginRight = null;
            PersonTracker.trackX = true;
        }
        if(map.y < win.height) {
            canvas.style.marginTop = (win.height - map.y) / 2 + 'px';
            PersonTracker.trackY = false;
        } else {
            canvas.style.marginTop = null;
            PersonTracker.trackY = true;
        }
        if(PersonTracker.trackX || PersonTracker.trackY) {
            PersonTracker.start();
        } else {
            PersonTracker.stop();
        }
        PlayGround.canvasOffset = Dom.calculateOffset(canvas);
    },
    connect: function (onConnectMessage) {
        PlayGround.gameStarted = true;
        var host;
        if (window.location.protocol == 'http:') {
            host = 'ws://' + window.location.host + '/commandos';
        } else {
            host = 'wss://' + window.location.host + '/commandos';
        }
        if ('WebSocket' in window) {
            PlayGround.socket = new WebSocket(host);
        } else if ('MozWebSocket' in window) {
            PlayGround.socket = new MozWebSocket(host);
        } else {
            alert('Error: WebSocket is not supported by this browser.');
            return;
        }

        PlayGround.socket.onerror = function() {
            alert("Error! Please describe how it happen to developer." + JSON.stringify(arguments));
            PlayGround.gameStarted = false;
        };
        
        PlayGround.socket.onopen = function () {
            PlayGround.socket.send(onConnectMessage);
            PlayGround.startGameLoop();
            PlayGround.gameStarted = true;
            setInterval(function () {
                // Prevent server read timeout.
                PlayGround.socket.send('ping');
            }, 5000);
        };

        PlayGround.socket.onclose = function () {
            PlayGround.stopGameLoop();
            PlayGround.gameStarted = false;
        };

        PlayGround.socket.onmessage = function (message) {
            // _Potential_ security hole, consider using json lib to parse data in production.
            var data = eval('(' + message.data + ')');
            switch (data.type) {
                case 'update':
                    PlayGround.onUpdate(data);
                    break;
                case 'leave':   
                    PlayGround.removePerson(data.id);
                    break;
                case 'stats':
                    PlayGround.onStats(data);
                    break;
            }
        };
    },
    onStats: function (data) {
        PlayGround.gameStarted = false;
        GameStats.show();
        GameStats.update(data.stats);
        PlayGround.socket.close();
    },
    onUpdate: function(packet) {
        if (packet.owner !== null) {
            PlayGround.id = packet.owner.id;
            PlayGround.owner = packet.owner;
        }
        Weapons.update(PlayGround.owner);
        LifeAndArmor.update(PlayGround.owner.life, PlayGround.owner.armor);
        Score.update(PlayGround.owner, packet.time);
        for(var i = 0; i < packet.messages.length; i++) {
            var message = packet.messages[i];
            var id = message.substring(0, message.indexOf(":"));
            var subject = message.substring(message.indexOf(':') + 1);
            Chat.update(id, subject);
        }
        for(var i = 0; i < packet.items.length; i++) {
            var zones = PlayGround.map.zones;
            var item = packet.items[i];
            for(var j = 0; j < zones.length; j++) {
                var zone = zones[j];
                if(zone.id === item.id) {
                    zone.available = item.available;
                    break;
                }
            }
        }
        for (var i = 0; i < packet.persons.length; i++) {
            var person = packet.persons[i];
            if (!PlayGround.entities[person.id]) {
                PlayGround.addPerson(person);
            }
            PlayGround.updatePerson(person);
        }
        var now = (new Date()).getTime();
        PlayGround.projectiles = [];
        for(var i = 0; i < packet.projectiles.length; i++) {
            var p = packet.projectiles[i];
            if(p[0].x2 || p[0].x2 === 0) {
                PlayGround.instantBullets[i] = p;
                p.created = now;
            } else {
                PlayGround.projectiles.push(packet.projectiles[i]);
            }
        }
    },
    addPerson: function(person) {
        PlayGround.entities[person.id] = new Person(person)
    },
    updatePerson: function(personDto) {
        var id = personDto.id;
        var p = PlayGround.entities[id];
        p.x = personDto.x;
        p.y = personDto.y;
        p.angle = personDto.angle;
        p.reload = personDto.reload;
        if(PlayGround.owner.id == id) {
            PersonActions.updateMouseDirectionByXy(
                PlayGround.xMouse,
                PlayGround.yMouse,
                p,
                PlayGround.canvasOffset
            );
        }
    },
    removePerson: function(id) {
        delete PlayGround.entities[id];
    },
    startGameLoop: function() {
        if (window.webkitRequestAnimationFrame) {
            PlayGround.nextFrame = function () {
                webkitRequestAnimationFrame(PlayGround.run);
            };
        } else if (window.mozRequestAnimationFrame) {
            PlayGround.nextFrame = function () {
                mozRequestAnimationFrame(PlayGround.run);
            };
        } else {
            PlayGround.interval = setInterval(PlayGround.run, 1000 / PlayGround.fps);
        }
        if (PlayGround.nextFrame != null) {
            PlayGround.nextFrame();
        }
    },
    run: function() {
        while ((new Date).getTime() > PlayGround.nextGameTick) {
            PlayGround.nextGameTick += PlayGround.skipTicks;
        }
        PlayGround.draw();
        if (PlayGround.nextFrame != null) {
            PlayGround.nextFrame();
        }
    },

    draw: function() {
        PlayGround.context.clearRect(0, 0, PlayGround.map.x, PlayGround.map.y);
        if (PlayGround.map.zones != null) {
            for (var zoneId in PlayGround.map.zones) {
                ZoneActions.drawZone(PlayGround.map.zones[zoneId]);
            }
        }
        for (var id in PlayGround.entities) {
            PersonActions.drawPerson(PlayGround.entities[id]);
        }
        if (PlayGround.projectiles != null) {
            for (var i = 0; i < PlayGround.projectiles.length; i++) {
                ProjectilesActions.draw(PlayGround.projectiles[i]);
            }
        }
        for(var iKey in PlayGround.instantBullets) {
            ProjectilesActions.draw(PlayGround.instantBullets[iKey]);
        }
    },
    stopGameLoop: function () {
        PlayGround.nextFrame = null;
        if (PlayGround.interval != null) {
            clearInterval(PlayGround.interval);
        }
    },

    updatePersonViewAngle: function(direction) {
        if(PlayGround.viewAngleDirection !== direction) {
            PlayGround.viewAngleDirection = direction;
            PlayGround.socket.send('angle:' + direction);
        }
    },
    getPerson: function(id){
        if(!id)id = PlayGround.id;
        return PlayGround.entities[id];
    }
};