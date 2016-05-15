package org.forweb.commandos.service;

import org.forweb.commandos.service.person.MovementService;
import org.forweb.commandos.service.person.TurnService;
import org.forweb.geometry.shapes.Point;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.forweb.commandos.controller.PersonWebSocketEndpoint;
import org.forweb.commandos.entity.Direction;
import org.forweb.commandos.entity.Person;
import org.forweb.commandos.entity.Room;
import org.forweb.commandos.game.Context;

import javax.annotation.PostConstruct;
import java.util.Collection;

@Service
public class PersonService {
    @Autowired
    MovementService movementService;
    @Autowired
    ResponseService responseService;
    @Autowired
    ProjectileService projectileService;
    @Autowired
    LocationService locationService;
    @Autowired
    TurnService turnService;
    
    @Autowired
    Context gameContext;
    @PostConstruct
    public void postConstruct() {
        System.out.println("location service pc");
    }
    public synchronized void kill(Person person, Room room) {
        resetState(person, room);
        //responseService.sendMessage(person, "{\"type\": \"dead\"}");
    }

    public synchronized void reward(Person person) {
        //responseService.sendMessage(person, "{\"type\": \"kill\"}");
    }


    public void resetState(Person person, Room room) {
        person.setDirection(Direction.NONE);
        person.setLife(PersonWebSocketEndpoint.LIFE_AT_START);
        Point point = locationService.getRespawnCenter(room);
        if(point != null) {
            person.setX((int) point.getX());
            person.setY((int) point.getY());
        } else {
            throw new RuntimeException("No respawn points on map");
        }
    }

    public void remove(Room room, int id) {

    }

    public void handleDirection(Person person, String message) {
        person.setDirection(Direction.valueOf(message.toUpperCase()));
    }

    public void handlePersons(Collection<Person> persons, Room room) {
        for (Person person : persons) {
            movementService.onMove(person, room);
            projectileService.handleFire(person);
            turnService.onPersonChangeViewAngle(person);
        }
    }
}