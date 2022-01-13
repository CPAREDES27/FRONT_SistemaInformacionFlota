sap.ui.define([
	"sap/ui/core/format/NumberFormat"
], function (
	NumberFormat
	) {
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
		formatRowNumber: function (val) {
			if (!this.getBindingContext()) return null;
			var index = this.getBindingContext().getPath().split("/")[2];
			// (an example of path value here is "/modelData/0")
			return parseInt(index) + 1;
		},

		/**
		 * Formatea numero sin digitos decimales
		 * @param {string} sNumber 
		 */
		 formatFloat:function(sNumber){
			if(!isNaN(Number(sNumber))){
				let oFloatNumber = NumberFormat.getFloatInstance({
					decimals:0,
                    groupingEnabled: true,
					groupingSeparator:',',
					decimalSeparator:'.'
				});
				return oFloatNumber.format(sNumber);
			}else{
				return sNumber;
			}
		},

		/**
		 * Formatea numero con 2 digitos decimales
		 * @param {string} sNumber 
		 */
		 formatFloat2:function(sNumber){
			if(sNumber){
				let oFloatNumber = NumberFormat.getFloatInstance({
					decimals:2,
                    groupingEnabled: true,
					groupingSeparator:',',
					decimalSeparator:'.'
				});
				return oFloatNumber.format(sNumber);
			}else{
				return "0";
			}
		}
	};

});