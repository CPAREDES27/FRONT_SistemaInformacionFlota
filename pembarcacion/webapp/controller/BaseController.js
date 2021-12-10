sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent",
	"sap/m/library",
	"sap/base/Log",
	"sap/ui/core/BusyIndicator",
	"../model/formatter"
], function (Controller,
	UIComponent,
	library,
	Log,
	BusyIndicator,
	formatter) {
	"use strict";

	// shortcut for sap.m.URLHelper
	// var URLHelper = mobileLibrary.URLHelper;
	var mainUrlRest = 'https://cf-nodejs-qas.cfapps.us10.hana.ondemand.com/api/';

	return Controller.extend("com.tasa.pembarcacion.controller.BaseController", {
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

		/**
		 * Método para consumir servicio tabla principal
		 * @param {object} oService 
		 */
		getDataService: async function(oService){
			try {
				BusyIndicator.show(0);
				let oGetData= await fetch(oService.PATH,{
					method:'POST',
					body:JSON.stringify(oService.param)
				});
				if(oGetData.status===200){
					this.iCount++;
					let oData = await oGetData.json();
					if(this.iCount===this.iCountService) BusyIndicator.hide();
					return oData;
				}
			} catch (error) {
				BusyIndicator.hide();
				Log.error(error);
				this.getMessageDialog("Error","Hubo problemas de conexión")
				return null;
			}
		},

		getDominios: async function (listDomNames) {
			const dominios = listDomNames.map(dom => {
				return {
					domname: dom,
					status: 'A'
				}
			});

			const body = {
				dominios
			}

			let listDominios = await fetch(`${mainUrlRest}dominios/Listar`, {
				method: 'POST',
				body: JSON.stringify(body)
			}).then(resp => resp.json())
				.then(data => data)
				.catch(error => console.log("Error de consumo de servicio"));

			return listDominios;
		},
		getTemporadas: async function () {
			const body = {
				delimitador: "|",
				fields: ["CDPCN", "DSPCN", "FHITM", "FHFTM", "CTNAC", "ZCDZAR", "ZDSZAR"],
				no_data: "",
				option: [],
				options: [
					{
						cantidad: "",
						control: "MULTIINPUT",
						key: "ESPCN",
						valueHigh: "",
						valueLow: "S"
					}
				],
				order: "",
				p_user: "FGARCIA",
				rowcount: 0,
				rowskips: 0,
				tabla: "ZV_FLTZ"
			};

			let listTemporadas = await fetch(`${mainUrlRest}General/Read_Table`, {
				method: 'POST',
				body: JSON.stringify(body)
			}).then(resp => resp.json())
				.then(data => data)
				.catch(error => console.log("Error de consumo de servicio"));

			return listTemporadas;
		},
		getListPescasEmbarcacion: async function (temporada, tipoEmbarcacion, fechaInicial, fechaFinal) {

			let fechaInicioFormat = formatter.formatDateYYYYMMDD(fechaInicial);
			let fechaFinFormat = formatter.formatDateYYYYMMDD(fechaFinal);

			const body = {
				fieldstr_pem: [],
				p_cdpcn: temporada,
				p_cdtem: tipoEmbarcacion,
				p_fcfin: fechaFinFormat,
				p_fcini: fechaInicioFormat,
				p_user: ""
			};

			let listPescasEmbarcacion = await fetch(`${mainUrlRest}sistemainformacionflota/PescaPorEmbarcacion`, {
				method: 'POST',
				body: JSON.stringify(body)
			}).then(resp => resp.json())
				.then(data => data)
				.catch(error => console.log("Error de consumo de servicio"));

			return listPescasEmbarcacion;
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
		}
	});

});