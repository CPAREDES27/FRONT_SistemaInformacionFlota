sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent",
	"sap/m/library",
	"../model/formatter",
	"../model/models"
], function (Controller, UIComponent, mobileLibrary, formatter, models) {
	"use strict";

	// shortcut for sap.m.URLHelper
	var URLHelper = mobileLibrary.URLHelper;
	var mainUrlRest = 'https://cf-nodejs-qas.cfapps.us10.hana.ondemand.com/api/';

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
		getListPescaDeclarada: async function (fecha, motivoMarea) {
			const fecon = formatter.formatDateYYYYMMDD(fecha);

			let body = {
				fieldstr_te: [],
				fieldstr_tp: [],
				p_cdmma: motivoMarea,
				p_fecon: fecon,
				p_user: ""
			};

			let listPescaDeclarada = await fetch(`${mainUrlRest}sistemainformacionflota/PescaDeclarada`, {
				method: 'POST',
				body: JSON.stringify(body)
			})
				.then(resp => resp.json())
				.then(data => data)
				.catch(error => console.log("Error de consulta de pesca declarada"));

			return listPescaDeclarada;
		}
	});

});