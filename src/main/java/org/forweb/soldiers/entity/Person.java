package org.forweb.soldiers.entity;

import org.forweb.soldiers.controller.PersonController;
import org.forweb.soldiers.entity.weapon.AbstractWeapon;
import org.forweb.soldiers.entity.weapon.Pistol;

public class Person {

    private int id;
    private final String clientKey;
    private Direction direction;
    private int x;
    private int y;
    private float angle;
    private int turnDirection;
    private String hexColor;
    private Integer life = PersonController.LIFE_AT_START;
    
    private AbstractWeapon weapon;

    public Person(int id, String clientKey) {
        this.id = id;
        this.clientKey = clientKey;
        this.weapon = new Pistol();
    }

    public int getId() {
        return id;
    }

    public Direction getDirection() {
        return direction;
    }

    public void setDirection(Direction direction) {
        this.direction = direction;
    }
    
    public String getHexColor() {
        return hexColor;
    }

    public Integer getLife() {
        return life;
    }

    public void setLife(Integer life) {
        this.life = life;
    }

    public void setHexColor(String hexColor) {
        this.hexColor = hexColor;
    }


    public int getX() {
        return x;
    }

    public void setX(int x) {
        this.x = x;
    }

    public int getY() {
        return y;
    }

    public void setY(int y) {
        this.y = y;
    }

    public float getAngle() {
        return angle;
    }

    public void setAngle(float angle) {
        this.angle = angle;
    }

    public int getTurnDirection() {
        return turnDirection;
    }

    public void setTurnDirection(int turnDirection) {
        this.turnDirection = turnDirection;
    }

    public String getClientKey() {
        return clientKey;
    }
    public AbstractWeapon getWeapon() {
        return weapon;
    }

    public void setWeapon(AbstractWeapon weapon) {
        this.weapon = weapon;
    }
}