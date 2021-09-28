sap.ui.define([], function() {
	"use strict";

	let lista = [
        {
            IDAPP:"S01",
            NAMEAPP:"Pesca declarada",
            typeChart:["01","02"],
            data:[
                {
                    planta:"MALABRIGO",
                    asig:"0",
                    pesc:"0",
                    inop:"0",
                    otro:"0"
                },
                {
                    planta:"CHIMBOTE",
                    asig:"60",
                    pesc:"8",
                    otro:"0"
                }
            ]
        },
        {
            IDAPP:"S02",
            NAMEAPP:"Pesca por embarcación"
        },
        {
            IDAPP:"S03",
            NAMEAPP:"Pesca declarada diaria"
        },
        {
            IDAPP:"S04",
            NAMEAPP:"Pesca descargada"
        },
        {
            IDAPP:"S05",
            NAMEAPP:"Pesca de competencia - Radial"
        },
        {
            IDAPP:"S06",
            NAMEAPP:"Pesca declarada del cierre del día"
        },
        {
            IDAPP:"S07",
            NAMEAPP:"Pesca competencia"
        }
    ]

    return lista;
});