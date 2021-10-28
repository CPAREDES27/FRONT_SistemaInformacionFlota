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

	return Controller.extend("com.tasa.pdescargada.controller.BaseController", {
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
		getListPescaDescargadaDiaResum: async function (fechaInicio, fechaFin) {
			let fechaInicioFormat = formatter.formatDateYYYYMMDD(fechaInicio);
			let fechaFinFormat = formatter.formatDateYYYYMMDD(fechaFin);

			const body = {
				fieldstr_pta: [],
				fielstr_dsd: [],
				fielstr_dsddia: [],
				fielstr_dsdtot: [],
				p_ffdes: fechaFinFormat,
				p_fides: fechaInicioFormat,
				p_user: ""
			};

			let listPescaDescargada = await fetch(`${mainUrlRest}sistemainformacionflota/PescaDescargadaDiaResum`, {
				method: 'POST',
				body: JSON.stringify(body)
			})
				.then(resp => resp.json())
				.then(data => data)
				.catch(error => console.log('Error de consumo de servicio'));

			return listPescaDescargada;
		}
	});

});