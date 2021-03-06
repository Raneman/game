package org.forweb.commandos.controller;

import org.forweb.commandos.database.Table;
import org.forweb.commandos.entity.GameMap;
import org.forweb.commandos.service.MapService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.security.NoSuchAlgorithmException;
import java.util.List;

@RestController
@RequestMapping("/map")
public class MapController {


    @Autowired
    private MapService mapService;

    @RequestMapping("/save")
    public String saveMap(@RequestBody GameMap map) throws NoSuchAlgorithmException {
        return mapService.saveMap(map);
    }

    @RequestMapping("/list/{page}/{size}")
    public List<GameMap> loadMaps(@RequestParam(required = false) String mapName, @PathVariable Integer page, @PathVariable Integer size) {
        return mapService.loadMaps(mapName, page, size);

    }

    @RequestMapping("/name-empty")
    public Boolean nameEmpty(@RequestBody String name) {
        return mapService.nameEmpty(name);
    }

}