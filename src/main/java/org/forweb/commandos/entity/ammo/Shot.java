package org.forweb.commandos.entity.ammo;

public class Shot extends Projectile {
    public Shot(int xStart, int yStart, float angle) {
        super(xStart, yStart, angle);
        this.setLifeTime(150L);
        this.setRadius(300);
    }

    @Override
    public boolean isInstant() {
        return true;
    }

    @Override
    public String getName() {
        return "shot";
    }

    @Override
    public int getDamage() {
        return 15;
    }
}
