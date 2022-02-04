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

		/**
		 * Formatea a numero de un decimal
		 * @param {string} sValue 
		 * @returns string
		 */
		 setFormatFloat:function(sValue){
			if(sValue){
				let oFloatNumber = NumberFormat.getFloatInstance({
					decimals:1,
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
			let cociente=0;
			if(iPesca && iNdes){
				let oFloatNumber = NumberFormat.getFloatInstance({
					decimals:1,
                    groupingEnabled: true,
					groupingSeparator:',',
					decimalSeparator:'.'
				});
				if(isNaN(iPesca)) iPesca = Number(iPesca);
				if(isNaN(iNdes)) iNdes = Number(iNdes);
				cociente = iPesca/iNdes
				return oFloatNumber.format(cociente*100);
			}else{
				return "";
			}
		},

		setDivisionTasa:function(iPesca, iNdes){
			let cociente=0;
			if(iPesca && iNdes){
				let oFloatNumber = NumberFormat.getFloatInstance({
					decimals:3,
                    groupingEnabled: true,
					groupingSeparator:',',
					decimalSeparator:'.'
				});
				if(isNaN(iPesca)) iPesca = Number(iPesca);
				if(isNaN(iNdes)) iNdes = Number(iNdes);
				cociente = iPesca/iNdes
				return oFloatNumber.format(cociente*100);
			}else{
				return "";
			}
		},

		setTotalCol:function(iCant1,iCant2,iCant3){
			if(iCant1 || iCant2 || iCant3){
				if (iCant1 === "N") return "";
				if (iCant2 === "N") return "";
				if (iCant2 === "N") return "";
				let oViewModel = this.getModel("worklistView") || this.getModel("objectView"),
				oModel = this.getModel(),
				iEmpresaIndex = oModel.getProperty("/empresaIndex"),
				sIndicadorPropiedad = oViewModel.getProperty("/indicadorPropiedad"),
				oFloatNumber = NumberFormat.getFloatInstance({
					decimals:0,
                    groupingEnabled: true,
					groupingSeparator:',',
					decimalSeparator:'.'
				});
				// return oFloatNumber.format(sValue);
				if(iEmpresaIndex === 1){
					switch (sIndicadorPropiedad) {
						case "P":
							return oFloatNumber.format(iCant2);
							break;
						case "T":
							return oFloatNumber.format(iCant3);
							break;
						default:
							return oFloatNumber.format(iCant1);
							break;
					}
				}else{
					return oFloatNumber.format(iCant1);
				}
			}
			return 0;
		},
		setTotalCoc:function(iCant1,iCant2,iCant3){
			if(iCant1 || iCant2 || iCant3){
				let oViewModel = this.getModel("worklistView") || this.getModel("objectView"),
				oModel = this.getModel(),
				iEmpresaIndex = oModel.getProperty("/empresaIndex"),
				sIndicadorPropiedad = oViewModel.getProperty("/indicadorPropiedad"),
				oFloatNumber = NumberFormat.getFloatInstance({
					decimals:1,
                    groupingEnabled: true,
					groupingSeparator:',',
					decimalSeparator:'.'
				});
				if(iEmpresaIndex === 1){
					switch (sIndicadorPropiedad) {
						case "P":
							return oFloatNumber.format(iCant2);
							break;
						case "T":
							return oFloatNumber.format(iCant3);
							break;
						default:
							return oFloatNumber.format(iCant1);
							break;
					}
				}else{
					return oFloatNumber.format(iCant1);
				}
			}
			return 0.0;
		}

	};

});