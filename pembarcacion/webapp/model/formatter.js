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
		formatDateDDMMYYYY: function (dateString) {
			let date = new Date(dateString.substring(0, 4), dateString.substring(4, 6) - 1, dateString.substring(6, 8));
			const day = date.getDate();
			const month = date.getMonth() + 1;
			const year = date.getFullYear();

			return `${day >= 10 ? day : `0${day}`}/${month >= 10 ? month : `0${month}`}/${year}`;
		},
		getDateFromString: function (dateString) {
			let date = new Date(dateString.substring(0, 4), dateString.substring(4, 6) - 1, dateString.substring(6, 8));
			return date;
		},

		/**
		 * Recibe string dd/mm/yyyy y devuelve objecto Date
		 * @param {string} sDate 
		 */
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