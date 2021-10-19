sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel"
], function (BaseController, JSONModel) {
	"use strict";

	return BaseController.extend("com.tasa.pdeclarada.controller.App", {

		onInit: function () {
			var oViewModel,
				fnSetAppNotBusy,
				iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();

			oViewModel = new JSONModel({
				busy: true,
				delay: 0
			});
			this.setModel(oViewModel, "appView");

			fnSetAppNotBusy = function () {
				oViewModel.setProperty("/busy", false);
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			};

			// disable busy indication when the metadata is loaded and in case of errors
			this.getOwnerComponent().getModel().dataLoaded().
				then(fnSetAppNotBusy);
			this.getOwnerComponent().getModel().attachRequestFailed(fnSetAppNotBusy);

			// apply content density mode to root view
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());

			let data = [
				{
					planta: "MALABRIGO",
					asig: "0",
					pesc: "0",
					inop: "0",
					otro: "0"
				},
				{
					planta: "CHIMBOTE",
					asig: "60",
					pesc: "8",
					otro: "0"
				}
			];
			this.getModel().setProperty("/lista", data)
		}
	});

});