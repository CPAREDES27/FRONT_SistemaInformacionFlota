sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent",
	"sap/m/library",
	"../model/formatter"
], function (Controller, UIComponent, mobileLibrary, formatter) {
	"use strict";

	// shortcut for sap.m.URLHelper
	var URLHelper = mobileLibrary.URLHelper;
	var mainUrlRest = 'https://cf-nodejs-qas.cfapps.us10.hana.ondemand.com/api/';

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

		/**
		 * Event handler when the share by E-Mail button has been clicked
		 * @public
		 */
		onShareEmailPress: function () {
			var oViewModel = (this.getModel("objectView") || this.getModel("worklistView"));
			URLHelper.triggerEmail(
				null,
				oViewModel.getProperty("/shareSendEmailSubject"),
				oViewModel.getProperty("/shareSendEmailMessage")
			);
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