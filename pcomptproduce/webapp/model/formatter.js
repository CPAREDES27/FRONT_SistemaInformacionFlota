sap.ui.define([], function () {
	"use strict";

	return {

		/**
		 * Rounds the number unit value to 2 digits
		 * @public
		 * @param {string} sValue the number string to be rounded
		 * @returns {string} sValue with 2 digits rounded
		 */
		numberUnit : function (sValue) {
			if (!sValue) {
				return "";
			}
			return parseFloat(sValue).toFixed(2);
		},

		setFormatDate:function(sDate){
			if(sDate){
				let oDate = new Date(sDate.split("/")[2],sDate.split("/")[1]-1,sDate.split("/")[0]);
				return oDate;
			}else{
				return "";
			}
		},

		/**
		 * Recibe string dd/mm/yyyy y devuelve yyyymmdd
		 * @param {string} sDate 
		 */
		setFormatDateYYYYMMDD:function(sDate){
			if(sDate){
				let sNewDate = sDate.split("/")[2]+sDate.split("/")[1]+sDate.split("/")[0];
				return sNewDate;
			}else{
				return "";
			}
		}

	};

});