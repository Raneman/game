package org.forweb.commandos.entity.weapon;

import org.forweb.commandos.entity.ammo.Flame;

public class Flamethrower extends AbstractWeapon<Flame> {
    public Flamethrower(){
        this.setShotTimeout(200);
        this.setReloadTimeout(3000);
        this.setMaxClip(30);
        this.setRadius(80);
        setSpread(15);
    }

    @Override
    public String getName() {
        return "flamethrower";
    }
}