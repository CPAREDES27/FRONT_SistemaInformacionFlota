sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel"
], function (BaseController, JSONModel) {
	"use strict";

	return BaseController.extend("com.tasa.pdescargada.controller.App", {

		onInit : function () {
			var oViewModel,
				fnSetAppNotBusy,
				iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();

			oViewModel = new JSONModel({
				busy : true,
				delay : 0
			});
			this.setModel(oViewModel, "appView");

			fnSetAppNotBusy = function() {
				oViewModel.setProperty("/busy", false);
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			};

			// disable busy indication when the metadata is loaded and in case of errors
			this.getOwnerComponent().getModel().dataLoaded().
				then(fnSetAppNotBusy);
			// this.getOwnerComponent().getModel().attachMetadataFailed(fnSetAppNotBusy);

			// apply content density mode to root view
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());

			let oModel = this.getModel();
			oModel.setProperty("/help",{
				dateFrom:new Date(),
				dateTo:new Date()
			});
			oModel.setProperty("/columns",[
				{
					id:"FIDES",
					header:"Fecha",
					footer:"Total",
					align:"Begin"
				},
				{
					id:"CNPDS",
					header:"Pesca",
					footer:"",
					align:"End",
					styleClass:"colPesca"
				},
				{
					id:"CORREL",
					header:"Días",
					styleClass:"colDias"
				},
				{
					id:"PROMCNPDS",
					header:"Promedio",
					styleClass:"colProm"
				}
			]);
		}
	});

});