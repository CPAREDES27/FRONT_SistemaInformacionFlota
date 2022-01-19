sap.ui.define(["sap/ui/core/format/NumberFormat"], function (NumberFormat) {
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
		},

		/**
		 * Formatea a numero de sin decimales
		 * @param {string} sValue 
		 * @returns string
		 */
		setFormatInteger:function(sValue){
			if(sValue){
				let oFloatNumber = NumberFormat.getFloatInstance({
					decimals:0,
                    groupingEnabled: true,
					groupingSeparator:',',
					decimalSeparator:'.'
				});
				return oFloatNumber.format(sValue);
			}else{
				return null;
			}
		},

		setDivision:function(iPesca, iNdes){
			if(iPesca && iNdes){
				if(isNaN(iPesca)) iPesca = Number(iPesca);
				if(isNaN(iNdes)) iNdes = Number(iNdes);
				return (iPesca/iNdes).toFixed(1);
			}else{
				return "";
			}
		}

	};

});