sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent",
	"sap/m/library",
	"../model/formatter",
	"sap/ui/core/BusyIndicator"
], function (Controller, UIComponent, mobileLibrary, formatter,BusyIndicator) {
	"use strict";

	// shortcut for sap.m.URLHelper
	var URLHelper = mobileLibrary.URLHelper;
	var HOST = 'https://cf-nodejs-qas.cfapps.us10.hana.ondemand.com';

	return Controller.extend("com.tasa.pdeclaradacierredia.controller.BaseController", {
		formatter: formatter,
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
		},

		getDataMainTable: async function(oModel,oParam){
			const sUrl = HOST + '/api/General/Read_Table',
			param = new Object;

			const body = {
				delimitador: "|",
				fields: [
					"WERKS",
					"DESCR",
					"CNPCM",
					"FCIER"
				],
				no_data: "",
				option: [],
				options: [
					{
						cantidad: "8",
						control: "MULTIINPUT",
						key: "FCIER",
						valueHigh: oParam.sEndDate,
						valueLow: oParam.sStartDate
					}
				],
				order: "FCIER AUFNR",
				p_user: "FGARCIA",
				rowcount: 200,
				rowskips: 0,
				tabla: "ZTFL_PDLBCH"
			};
			let oPescaData = await this.getDataService(sUrl, body),
			aData;
			if(oPescaData){
				if(oPescaData.data.length>0){
					oModel.setProperty(`/lista`,oPescaData.data);
				}else{
					this.getMessageDialog("Information", "No se econtraron registros para la busqueda");
					oModel.setProperty(`/lista`,[]);
				}
				BusyIndicator.hide();
			}
			
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
		getPescaDeclaradaCierreDia: async function (fechaInicio, fechaFin) {
			const fechaInicioFormatted = this.formatter.formatDateYYYYMMDD(fechaInicio);
			const fechaFinFormatted = this.formatter.formatDateYYYYMMDD(fechaFin);

			const body = {
				delimitador: "|",
				fields: [
					"WERKS",
					"DESCR",
					"CNPCM",
					"FCIER"
				],
				no_data: "",
				option: [],
				options: [
					{
						cantidad: "",
						control: "MULTIINPUT",
						key: "FCIER",
						valueHigh: fechaFinFormatted,
						valueLow: fechaInicioFormatted
					}
				],
				order: "FCIER AUFNR",
				p_user: "FGARCIA",
				rowcount: 200,
				rowskips: 0,
				tabla: "ZTFL_PDLBCH"
			};

			let pescaDeclaradaCierreDia = await fetch(`${mainUrlRest}General/Read_Table`, {
				method: 'POST',
				body: JSON.stringify(body)
			})
				.then(response => response.json())
				.then(data => data)
				.catch(error => console.log("Error al consultar servicio"));

			return pescaDeclaradaCierreDia;
		}
	});

});