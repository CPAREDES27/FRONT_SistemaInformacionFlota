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

	return Controller.extend("com.tasa.pdeclaradadiaria.controller.BaseController", {
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
		// getListPescaDeclaradaDiaria: async function (fechaInicio, fechaFin) {
		// 	const fechaInicioFormat = formatter.formatDateYYYYMMDD(fechaInicio);
		// 	const fechaFinFormat = formatter.formatDateYYYYMMDD(fechaFin);

		// 	let listPescaDeclaradaDiaria = await fetch(`${mainUrlRest}sistemainformacionflota/PescaDeclaradaDiara`, {
		// 		method: 'POST',
		// 		body: JSON.stringify({
		// 			fieldstr_dl: [],
		// 			p_fefin: fechaFinFormat,
		// 			p_feini: fechaInicioFormat,
		// 			p_user: ""
		// 		})
		// 	})
		// 		.then(resp => resp.json())
		// 		.then(data => data)
		// 		.catch(error => console.log("Error de llamado al servicio"));

		// 	return listPescaDeclaradaDiaria;
		// },

		getDataService: async function(sUrl,param){
			BusyIndicator.show(0);
			try {
				let oResponseData = await fetch(sUrl,{
					method:'POST',
					body:JSON.stringify(param)
				});
				if(oResponseData.ok) {
					BusyIndicator.hide();
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