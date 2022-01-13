sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/UIComponent",
	"sap/m/library",
	"sap/ui/core/BusyIndicator",
	"sap/base/Log"
], function (Controller, UIComponent, mobileLibrary,BusyIndicator,Log) {
	"use strict";

	// shortcut for sap.m.URLHelper
	var URLHelper = mobileLibrary.URLHelper;

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

		// getListPescaDescargadaDiaResum: async function (fechaInicio, fechaFin) {
		// 	let fechaInicioFormat = formatter.formatDateYYYYMMDD(fechaInicio);
		// 	let fechaFinFormat = formatter.formatDateYYYYMMDD(fechaFin);

		// 	const body = {
		// 		fieldstr_pta: [],
		// 		fielstr_dsd: [],
		// 		fielstr_dsddia: [],
		// 		fielstr_dsdtot: [],
		// 		p_ffdes: fechaFinFormat,
		// 		p_fides: fechaInicioFormat,
		// 		p_user: ""
		// 	};

		// 	let listPescaDescargada = await fetch(`${mainUrlRest}sistemainformacionflota/PescaDescargadaDiaResum`, {
		// 		method: 'POST',
		// 		body: JSON.stringify(body)
		// 	})
		// 		.then(resp => resp.json())
		// 		.then(data => data)
		// 		.catch(error => console.log('Error de consumo de servicio'));

		// 	return listPescaDescargada;
		// }
	});

});