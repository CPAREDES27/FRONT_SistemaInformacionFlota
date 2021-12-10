sap.ui.define([], function () {
	"use strict";

	return {

		/**
		 * Rounds the number unit value to 2 digits
		 * @public
		 * @param {string} sValue the number string to be rounded
		 * @returns {string} sValue with 2 digits rounded
		 */
		numberUnit: function (sValue) {
			if (!sValue) {
				return "";
			}
			return parseFloat(sValue).toFixed(2);
		},
		formatDateYYYYMMDD: function (date) {
			const year = date.getFullYear();
			const month = date.getMonth() + 1;
			const day = date.getDate();

			return `${year}${month >= 10 ? month : `0${month}`}${day >= 10 ? day : `0${day}`}`;
		},

		formatDateInverse:function(sDate){
			if(sDate){
				let sNewDate =`${sDate.split("/")[2]}${sDate.split("/")[1]}${sDate.split("/")[0]}`;
				return sNewDate;
			}else{
				return "";
			}
		},
		
		formatDateDDMMYYYY:function(oDate){
			if(oDate){
				let sDate = oDate.getDate(),
				sMonth = oDate.getMonth()+1,
				sYear = oDate.getFullYear();
				
				sDate>=10?sDate:`0${sDate}`;
				sMonth>=10?sMonth:`0${sMonth}`;
				sYear>=10?sYear:`0${sYear}`;
				
				return `${sDate}/${sMonth}/${sYear}`;
			}else{
				return "";
			}
		},
		formatHours:function(oDate){
			if(oDate){
				let sHours = oDate.getHours(),
				sMin = oDate.getMinutes(),
				sSec = oDate.getSeconds();
				
				sHours = sHours>=10?sHours:`0${sHours}`;
				sMin = sMin>=10?sMin:`0${sMin}`;
				sSec = sSec>=10?sSec:`0${sSec}`;
				
				return `${sHours}:${sMin}:${sSec}`;
				
			}else{
				return "";
			}
		},
		setColorsFields:function(field){
			console.log(field)
		},
		
	};

});