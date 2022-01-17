sap.ui.define([
	"./Utils"
], function(
) {
	"use strict";

	return {

        formatDate: function (date) {
            var d = new Date(date),
                month = '' + (d.getMonth() + 1),
                day = '' + (d.getDate() + 1),
                year = d.getFullYear();

            if (month.length < 2)
                month = '0' + month;
            if (day.length < 2)
                day = '0' + day;

            return [day, month, year].join('/');
        },

        removeDuplicateArray: function(data, key){
            return [
                ...new Map(
                    data.map(x => [key(x), x])
                ).values()
            ];
        },

        getDegrees :function(value){
            if (value != "") {
                let type = null;
                value = value.trim();		
                type = this.getFormatGeo(value);
                if (type != null) {
                    return Number(value.substring(0, 3));
                }
            }
            return 0;
        },

        getMinutes :function(value){
            if (value != "") {
                let type = null;
                value = value.trim();		
                type = this.getFormatGeo(value);
                if (type != null) {
                    if (type == "D") {
                        return Number(value.substring(3));
                    } else if (type == "G") {
                        return Number(value.substring(4, 7));
                    }
                } 
            }
            return 0;
        },
        
        getFormatGeo :function(value){
            if (value != "") {
                let myPattern = /(\d){5}/;
                let myGeoPattern =/(\d){3}º(\d){2}'/;
                value = value.trim();
                let myMatcher = myPattern.test(value);
                let myGeoMatcher = myGeoPattern.test(value);
                if (myMatcher) {
                    return "D";
                } else if (myGeoMatcher) {
                    return "G";
                }
            }
            return null;
        },

        strDateToDate: function(strDate){
            var date = null;
            if(strDate){ // dd/MM/yyyy
                var anio = parseInt(strDate.split("/")[2]);
                var mes = parseInt(strDate.split("/")[1]) - 1;
                var dia = parseInt(strDate.split("/")[0]);
                date = new Date(anio, mes, dia);
            }
            return date;
        },

        strDateHourToDate: function(strDate, strHour){ // dd/MM/yyyy hh:mm
            var date = null;
            if(strDate && strHour){
                var anio = parseInt(strDate.split("/")[2]);
                var mes = parseInt(strDate.split("/")[1]) - 1;
                var dia = parseInt(strDate.split("/")[0]);
                var hour = parseInt(strHour.split(":")[0]);
                var minute = parseInt(strHour.split(":")[1]);
                date = new Date(anio, mes, dia, hour, minute);
            }
            return date;
        },

        dateToStrDate: function(date){
            if(date){
                var dia = date.getDate();
                var mes = date.getMonth() + 1;
                var anio = date.getFullYear();
                var strDia = "";
                if(dia > 0 && dia < 10){
                    strDia = "0" + dia;
                }else{
                    strDia = dia;
                }
                var strMes = "";
                if(mes > 0 && mes < 10){
                    strMes = "0" + mes;
                }else{
                    strMes = mes;
                }
                return strDia + "/" + strMes + "/" + anio;
            }else{
                return null;
            }
        },
        dateToStrHours: function(date){
            if(date){
                let hora = date.getHours();
                let minutos = date.getMinutes();
                let segundos = date.getSeconds();
                let strHor = "";
                if(hora > 0 && hora < 10){
                    strHor = "0" + hora;
                }else{
                    strHor = hora;
                }
                let strMin = "";
                if(minutos > 0 && minutos < 10){
                    strMin = "0" + minutos;
                }else{
                    strMin = minutos;
                }
                let strSec = "";
                if(segundos > 0 && segundos < 10){
                    strSec = "0" + segundos;
                }else{
                    strSec = segundos;
                }
                return strHor + ":" + strMin + ":" + strSec;
            }else{
                return null;
            }
        },

        strDateToSapDate: function(date){
            var newDate = "";
            if(date){
                var dateSplit = date.split("/");
                var dia = dateSplit[0];
                var mes = dateSplit[1];
                var anio = dateSplit[2];
                newDate = anio + mes + dia + "";
            }
            return newDate;
        },

        strHourToSapHo: function(hour){
            var newHour = "";
            if(hour){
                var dateSplit = hour.split(":");
                var hora = dateSplit[0];
                var minuto = dateSplit[1];
                var sec = dateSplit[2] ? dateSplit[2] : "00";
                newHour = hora + minuto + sec + "";
            }
            return newHour;
        },

        getEtiqueta: function(path){
            var etiqueta = "";
            if(etiqueta == "/DatosGenerales/CDEMB"){
                etiqueta = "Embarcación";
            }
            if(etiqueta == "/DatosGenerales/CDEMP"){
                etiqueta = "Armador Comercial";
            }

            return etiqueta;
        },
        difPtosLongOPtosLati:function(d1,m1,d2,m2,cDec){
            let  fReturn = [];
            let val1 = d1*100 + m1;
            let val2 = d2*100 + m2;
            let dDif = 0;
            let mDif = 0;
            let signo = -1;
            let susD = 0;
            
            if (val1 > val2) {	
                let tempD = d1;
                let tempM = m1;
                d1 = d2;
                m1 = m2;
                d2 = tempD;
                m2 = tempM; 	
                signo = 1;
            }
            
            if (m1 > m2) {
                susD = 1;
                m2 += 60;
            } 
                
            d2 -= susD;
            dDif = d2 - d1;
            mDif = m2 - m1;
        
            let bd = Number(mDif);
            mDif = bd.toFixed(2);
            
            fReturn = [signo, dDif, mDif];
            
            return fReturn;

        },
        compPtosLongOPtosLati : function(difPtos){
            let valor = 0;
            if (difPtos != null && difPtos.length > 2) {
                let rPtos = difPtos[0]*(difPtos[1]*100 + difPtos[2]);
            
                if (rPtos > 0.0) {
                    valor = 1;
                } else if (rPtos == 0.0) {
                    valor = 0;
                } else {
                    valor = -1;
                }
            }
            
            return valor;
        },
        distPtosLongitud:function(difPtos,dl,ml,medida){
            let longEcuador = 40076;
            const degrees_to_radians = deg => (deg * Math.PI) / 180.0;
            let paralelo = Math.cos(degrees_to_radians(dl + ml/60))*longEcuador;
            let longGradoKM = paralelo/360;
            let longMinutoKM = longGradoKM/60;
            let valor  = this.distPtosLatOPtosLong(difPtos, longGradoKM, longMinutoKM, medida);
            return valor;
        },
        distPtosLatOPtosLong :function(difPtos,longGradoKM,longMinutoKM,medida){
            const medidas_cons = ['MN', 'KM', 'MT'];
            let valor = Number(0);
            medida = ((medida != "") || medidas_cons.includes(medida)) ? medida : "MN";
            if (medida == "MN") {
                valor =  difPtos[0]*(difPtos[1]*(this.convKmAMillNaut(longGradoKM)) + difPtos[2]*(this.convKmAMillNaut(longMinutoKM)));
            } else if (medida == "KM" || medida == "MT") {
                let eq = 1;
                
                if (medida == "MT") {
                    eq = 1000;
                }
                
                valor =  difPtos[0]*(difPtos[1]*longGradoKM + difPtos[2]*longMinutoKM)*eq;
            }
            
            return valor.toFixed(2);	
        },
        convKmAMillNaut :function(km){
            return km/1.852;
        }


    }
});