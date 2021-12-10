sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent",
	"sap/m/library",
	"../model/formatter",
	"../model/models",
	"sap/base/Log",
	"sap/ui/core/BusyIndicator"
], function (Controller,
	UIComponent,
	library,
	formatter,
	models,
	Log,
	BusyIndicator
	) {
	"use strict";

	// shortcut for sap.m.URLHelper
	// var URLHelper = mobileLibrary.URLHelper;
	var HOST = 'https://cf-nodejs-qas.cfapps.us10.hana.ondemand.com';

	return Controller.extend("com.tasa.pdeclarada.controller.BaseController", {
		/**
		 * Convenience method for accessing the router.
		 * @public
		 * @returns {sap.ui.core.routing.Router} the router for this component
		 */
		getRouter: function () {
			return UIComponent.getRouterFor(this);
		},

		/**
		 * Convenience method for getting the view model by name.
		 * @public
		 * @param {string} [sName] the model name
		 * @returns {sap.ui.model.Model} the model instance
		 */
		getModel: function (sName) {
			return this.getView().getModel(sName);
		},

		/**
		 * Convenience method for setting the view model.
		 * @public
		 * @param {sap.ui.model.Model} oModel the model instance
		 * @param {string} sName the model name
		 * @returns {sap.ui.mvc.View} the view instance
		 */
		setModel: function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

		/**
		 * Getter for the resource bundle.
		 * @public
		 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
		 */
		getResourceBundle: function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},
		getDataService: async function(sUrl,param){
			BusyIndicator.show(0);
			try {
				let oResponseData = await fetch(sUrl,{
					method:'POST',
					body:JSON.stringify(param)
				});
				if(oResponseData.ok) {
					this.count++;
					return oResponseData.json();
				}else{
					return null;
				}
			} catch (error) {
				BusyIndicator.hide();
				Log.error(error);
				this.getMessageDialog("Error", "Se produjo un error de conexión")
				return null;
			}
			// try {
				// let oPromise = fetch(sUrl,{
				// 	method:'POST',
				// 	body:JSON.stringify(oService.param)	
				// });
				// if(oPromise.ok){
				// 	return oPromise;
					// let oData = await oPromise.json(),
					// aData,
					// aData2;
					// if(oData["str_tp"]) aData = oData["str_tp"];
					// if(oData["data"]) aData = oData.data[0].data;
					// if(aData.length>0){
					// 	oService.model.setProperty(`/${oService.property}`,aData);
					// 	// estrucutura para Detalle
					// 	if(oData["str_tp"]){
					// 		let aDetailData = oData["str_te"],
					// 		aPropia,
					// 		aTerceras;
					// 		aData.forEach(oItem=>{
					// 			aPropia = aDetailData.filter(item=>item.CDPTA===oItem.CDPTA&&item.INPRP==="P");
					// 			aTerceras = aDetailData.filter(item=>item.CDPTA===oItem.CDPTA&&item.INPRP==="T");
					// 			oItem.propias = aPropia;
					// 			oItem.terceras = aTerceras;
					// 			oItem.cantPropias = aPropia.length;
					// 			oItem.cantTerceras = aTerceras.length;
					// 		});
								
					// 	}
					// }else{
					// 	this.getMessageDialog("Information", "No se econtraron registros para la busqueda");
					// 	oService.model.setProperty(`/${oService.property}`,[]);
					// }
					// if(this.count===this.servicesLenght) BusyIndicator.hide();
				// }else{
				// 	return null;
				// }
			// } catch (error) {
			// 	BusyIndicator.hide();
			// 	Log.error(error);
			// 	this.getMessageDialog("Error", "Se produjo un error de conexión")
			// }
		},

		getDataMainTable: async function(oModel,oParam){
			const sUrl = HOST + '/api/sistemainformacionflota/PescaDeclarada',
			param = new Object;

			param.fieldstr_te= [];
			param.fieldstr_tp= [];
			param.p_cdmma= oParam.cdmma;
			param.p_fecon= oParam.fecon;
			param.p_user="";
			let oMotMareaData = await this.getDataService(sUrl, param),
			aDataTp,
			aDataTe;
			if(oMotMareaData){
				aDataTp = oMotMareaData["str_tp"];
				if(aDataTp.length>0){
					let aPropia,
					aTerceras;
					aDataTe = oMotMareaData["str_te"];
					aDataTp.forEach(oItem=>{
						aPropia = aDataTe.filter(item=>item.CDPTA===oItem.CDPTA&&item.INPRP==="P");
						aTerceras = aDataTe.filter(item=>item.CDPTA===oItem.CDPTA&&item.INPRP==="T");
						oItem.propias = aPropia;
						oItem.terceras = aTerceras;
						oItem.cantPropias = aPropia.length;
						oItem.cantTerceras = aTerceras.length;
					});
					this.getGraphData(aDataTp);
					this.calcularTotales(aDataTp);
					oModel.setProperty(`/str_tp`,aDataTp);
					oModel.setProperty(`/str_te`,aDataTe);
					this.setTotalRowTable();
				}else{
					this.getMessageDialog("Information", "No se econtraron registros para la busqueda");
					oModel.setProperty(`/str_tp`,[]);
				}
				if(this.count===this.servicesLenght) BusyIndicator.hide();
			}
			
		},

		calcularTotales: function (listPescaDeclarada) {
			/**
			 * Copia del primer elemento para obtener su modelo
			 */
			let pescaDeclaradaTotal = { ...listPescaDeclarada[0] };

			/**
			 * Cálculos de totales de algunos campos
			 */
			let total_CEMBA = 0;
			let total_CEMBP = 0;
			let total_CEMBI = 0;
			let total_CEMBO = 0;
			let total_CNPDS = 0;
			let total_TOT_PESC_DECL = 0;
			let total_TOT_NUM_EMBA = 0;
			let total_CNPEP = 0;
			let total_NEMBP = 0;
			let total_CNPET = 0;
			let total_NEMBT = 0;
			let total_PROM_PESC_PROP = 0;
			let total_PROM_PESC_TERC = 0;
			let total_TOTED = 0;

			listPescaDeclarada.forEach(p => {
				total_CEMBA += p.CEMBA;
				total_CEMBP += p.CEMBP;
				total_CEMBI += p.CEMBI;
				total_CEMBO += p.CEMBO;
				total_CNPDS += p.CNPDS;
				total_TOT_PESC_DECL += p.TOT_PESC_DECL;
				total_TOT_NUM_EMBA += p.TOT_NUM_EMBA;
				total_CNPEP += p.CNPEP;
				total_NEMBP += p.NEMBP;
				total_CNPET += p.CNPET;
				total_NEMBT += p.NEMBT;
				total_PROM_PESC_PROP += p.PROM_PESC_PROP;
				total_PROM_PESC_TERC += p.PROM_PESC_TERC;
				total_TOTED += p.TOTED;
			});

			/**
			 * Limpieza y asignación de totales
			 */
			Object.keys(pescaDeclaradaTotal).forEach(k => {
				pescaDeclaradaTotal[k] = null;
			});
			pescaDeclaradaTotal.DESCR = "Total general";
			pescaDeclaradaTotal.CEMBA = total_CEMBA;
			pescaDeclaradaTotal.CEMBP = total_CEMBP;
			pescaDeclaradaTotal.CEMBI = total_CEMBI;
			pescaDeclaradaTotal.CEMBO = total_CEMBO;
			pescaDeclaradaTotal.CNPDS = total_CNPDS.toFixed(3);
			pescaDeclaradaTotal.TOT_PESC_DECL = total_TOT_PESC_DECL;
			pescaDeclaradaTotal.TOT_NUM_EMBA = total_TOT_NUM_EMBA;
			pescaDeclaradaTotal.CNPEP = total_CNPEP;
			pescaDeclaradaTotal.NEMBP = total_NEMBP;
			pescaDeclaradaTotal.CNPET = total_CNPET;
			pescaDeclaradaTotal.NEMBT = total_NEMBT;
			pescaDeclaradaTotal.PROM_PESC_PROP = total_PROM_PESC_PROP.toFixed(0);
			pescaDeclaradaTotal.PROM_PESC_TERC = total_PROM_PESC_TERC.toFixed(0);
			pescaDeclaradaTotal.TOTED = total_TOTED;

			listPescaDeclarada.push(pescaDeclaradaTotal);

			//Totales genéricos
			this.getModel().setProperty("/totalGenPescDecl", pescaDeclaradaTotal.TOT_PESC_DECL);
			this.getModel().setProperty("/totalGenNumEmba", pescaDeclaradaTotal.TOT_NUM_EMBA);
			this.getModel().setProperty("/totalGenPescDesc", pescaDeclaradaTotal.CNPDS);
			this.getModel().setProperty("/totalGenNumEmbaDesc", pescaDeclaradaTotal.TOTED);
			

		},

		getGraphData:function(aData){
			const aGraphData = aData.map(s => {
				return {
					descripcion: s.DESCR,
					value: s.PORC_PESC_DECL
				};
			});

			this.getModel().setProperty("/STR_TP_GRAPHICS", aGraphData);
			this.getModel().setProperty("/countBars", aData.length-1);
		},

		setTotalRowTable:function(){
			let oTable = sap.ui.getCore().byId("application-pescaDeclarada-display-component---worklist--tablePescaDeclarada");
			if(!oTable){
				return;
			}
			let aRows = oTable.getRows(),
			iLastIndexRows = aRows.length-1,
			oRowLast = aRows[iLastIndexRows],
			iCellsLength = oRowLast.getCells()["length"],
			oNavButton = oRowLast.getCells()[iCellsLength-1],
			oObjectStatus = oRowLast.getCells()[0];
			oNavButton.setVisible(false);
			oObjectStatus.setState("Warning")
		},

		getMessageDialog:function(sTypeDialog,sMessage){
			let oMessageDialog;
			if (!oMessageDialog) {
				oMessageDialog = new sap.m.Dialog({
					type: sap.m.DialogType.Message,
					title: "Mensaje",
					state: sTypeDialog,
					content: new sap.m.Text({ text: sMessage }),
					beginButton: new sap.m.Button({
						type: sap.m.ButtonType.Emphasized,
						text: "OK",
						press: function () {
							// BusyIndicator.show(0);
							oMessageDialog.close();
						}.bind(this)
					})
				});
			}

			oMessageDialog.open();
		},
	});

});